import { getAdminToken } from "@/lib/shopify/admin-token";
import {
  adminEndpoint,
  isStorefrontConfigured,
  shopifyConfig,
} from "@/lib/shopify/config";
import { getLocalizedVariantPrices } from "@/lib/shopify/localization-service";
import {
  CATALOG_PATH,
  acquireLock,
  readJsonFile,
  writeJsonFileAtomic,
} from "@/lib/catalog/storage";
import { STORE_HANDLES } from "@/content/products";
import type {
  CatalogDocument,
  MarketPrice,
  ProductRecord,
  MediaRecord,
  VariantRecord,
} from "@/lib/catalog/types";

/**
 * Shopify → data/catalog.json sync engine (same model as the reference
 * storefront): the Admin API is read once per product, normalised into a small
 * read model, and written through `lib/catalog/storage.ts` — the filesystem in
 * dev, private Vercel Blob in production.
 *
 * Differences from the reference:
 *  - Multi-product. The catalog holds every Slumberlush handle listed in
 *    `content/products.ts`; a webhook re-syncs only the product that changed.
 *  - Variants keep their `selectedOptions`, so the PDP can render the real
 *    Set × Pack matrix and disable combinations Shopify doesn't have.
 *  - Media keeps Shopify's alt text.
 *
 * The record is a read model only — prices are re-validated by Shopify when the
 * Storefront cart is created at checkout, never trusted from this file.
 */

type AdminVariantNode = {
  id: string;
  title: string;
  sku: string | null;
  barcode: string | null;
  price: string | null;
  compareAtPrice: string | null;
  availableForSale: boolean;
  selectedOptions: { name: string; value: string }[];
  image: { url: string } | null;
  packDescription: { value: string } | null;
};

type VideoSourceNode = {
  url: string;
  mimeType: string;
  width: number | null;
  height: number | null;
};

type MediaNode =
  | {
      __typename: "MediaImage";
      alt: string | null;
      image: { url: string; width: number | null; height: number | null } | null;
    }
  | {
      __typename: "Video";
      alt: string | null;
      sources: VideoSourceNode[];
      preview: { image: { url: string; width: number; height: number } | null } | null;
    }
  | { __typename: string };

type MetaobjectFieldNode = {
  key: string;
  value: string | null;
  reference: { image?: { url: string } } | null;
};

type MetaobjectRefsField = {
  references: { nodes: { fields: MetaobjectFieldNode[] }[] } | null;
} | null;

type ProductData = {
  productByHandle: {
    id: string;
    handle: string;
    title: string;
    vendor: string | null;
    productType: string | null;
    status: string;
    updatedAt: string;
    options: { name: string; values: string[] }[];
    variants: { nodes: AdminVariantNode[] };
    media: { nodes: MediaNode[] };
    seo: { title: string | null; description: string | null } | null;
    specs: MetaobjectRefsField;
    featureHighlights: MetaobjectRefsField;
    perks: { value: string } | null;
    saleEndsAt: { value: string } | null;
  } | null;
};

const SHOP_QUERY = `query { shop { name currencyCode } }`;

const MARKETS_QUERY = `
query Markets {
  markets(first: 20) {
    nodes {
      enabled
      regions(first: 10) { nodes { ... on MarketRegionCountry { code } } }
    }
  }
}`;

const PRODUCT_QUERY = `
query ProductByHandle($handle: String!) {
  productByHandle(handle: $handle) {
    id
    handle
    title
    vendor
    productType
    status
    updatedAt
    seo { title description }
    options { name values }
    variants(first: 100) {
      nodes {
        id title sku barcode price compareAtPrice availableForSale
        selectedOptions { name value }
        image { url }
        packDescription: metafield(namespace: "slumberlush", key: "pack_description") { value }
      }
    }
    media(first: 50) {
      nodes {
        __typename
        alt
        ... on MediaImage { image { url width height } }
        ... on Video {
          sources { url mimeType width height }
          preview { image { url width height } }
        }
      }
    }
    specs: metafield(namespace: "custom", key: "specs") {
      references(first: 20) {
        nodes {
          ... on Metaobject {
            fields {
              key
              value
              reference { ... on MediaImage { image { url } } }
            }
          }
        }
      }
    }
    featureHighlights: metafield(namespace: "custom", key: "feature_highlights") {
      references(first: 20) {
        nodes {
          ... on Metaobject {
            fields {
              key
              value
              reference { ... on MediaImage { image { url } } }
            }
          }
        }
      }
    }
    perks: metafield(namespace: "custom", key: "perks") { value }
    saleEndsAt: metafield(namespace: "custom", key: "sale_ends_at") { value }
  }
}`;

async function adminRequest<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const token = await getAdminToken();
  const res = await fetch(adminEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  const body = (await res.json().catch(() => ({}))) as {
    data?: T;
    errors?: Array<{ message?: string }>;
  };
  if (!res.ok || body.errors?.length) {
    throw new Error(body.errors?.[0]?.message || `HTTP ${res.status}`);
  }
  return body.data as T;
}

/** Single-country markets are merchant-priced; multi-country ones are the FX catch-all. */
async function discoverCuratedMarketCountries(): Promise<string[]> {
  const data = await adminRequest<{
    markets: {
      nodes: { enabled: boolean; regions: { nodes: { code?: string }[] } }[];
    };
  }>(MARKETS_QUERY);
  const codes = new Set<string>();
  for (const market of data.markets.nodes) {
    if (!market.enabled) continue;
    const regionCodes = market.regions.nodes
      .map((r) => r.code)
      .filter((c): c is string => Boolean(c));
    if (regionCodes.length === 1) codes.add(regionCodes[0]!);
  }
  return [...codes];
}

const bareUrl = (url: string) => url.split("?")[0] ?? url;

function normalizeVariants(nodes: AdminVariantNode[]): Omit<VariantRecord, "pricesByMarket">[] {
  return nodes
    .filter((v) => v.price != null)
    .map((v) => {
      const price = Number(v.price);
      const compare = v.compareAtPrice != null ? Number(v.compareAtPrice) : null;
      return {
        id: v.id,
        title: v.title,
        sku: v.sku || null,
        barcode: v.barcode || null,
        price,
        compareAtPrice: compare != null && compare > price ? compare : null,
        availableForSale: v.availableForSale,
        options: Object.fromEntries(v.selectedOptions.map((o) => [o.name, o.value])),
        image: v.image?.url ?? null,
        description: v.packDescription?.value?.trim() || null,
      };
    });
}

function normalizeMedia(
  nodes: MediaNode[],
  variants: { id: string; image: string | null }[],
): MediaRecord[] {
  const variantByImage = new Map(
    variants
      .filter((v): v is { id: string; image: string } => Boolean(v.image))
      .map((v) => [bareUrl(v.image), v.id] as const),
  );
  const items: MediaRecord[] = [];
  for (const node of nodes) {
    if (node.__typename === "MediaImage" && "image" in node) {
      if (!node.image?.url) continue;
      items.push({
        type: "image",
        url: node.image.url,
        width: node.image.width ?? null,
        height: node.image.height ?? null,
        alt: node.alt?.trim() || null,
        variantId: variantByImage.get(bareUrl(node.image.url)) ?? null,
      });
    } else if (node.__typename === "Video" && "sources" in node) {
      // Plain <video> can only play the mp4 renditions (HLS needs a player).
      const mp4 = node.sources
        .filter((s) => s.mimeType === "video/mp4")
        .sort((a, b) => (a.width ?? 0) - (b.width ?? 0));
      if (mp4.length === 0) continue;
      items.push({
        type: "video",
        alt: node.alt?.trim() || null,
        poster: node.preview?.image?.url ?? "",
        width: node.preview?.image?.width ?? null,
        height: node.preview?.image?.height ?? null,
        sources: mp4.map((s) => ({ src: s.url, type: s.mimeType, width: s.width ?? null })),
      });
    }
  }
  return items;
}

/** Rows still describing the retired "Style" option (Spray / Spray & Serum / Spray & Cream) — no longer a real purchase choice, so never shown. */
const STALE_STYLE_PATTERN = /\bstyle(s)?\b|spray\s*&\s*(serum|cream)/i;

function fieldValue(fields: MetaobjectFieldNode[], key: string): string {
  return fields.find((f) => f.key === key)?.value?.trim() || "";
}
function fieldImage(fields: MetaobjectFieldNode[], key: string): string | null {
  return fields.find((f) => f.key === key)?.reference?.image?.url ?? null;
}

function normalizeSpecs(field: MetaobjectRefsField): ProductRecord["specs"] {
  const nodes = field?.references?.nodes ?? [];
  return nodes
    .map((n) => ({
      label: fieldValue(n.fields, "label"),
      value: fieldValue(n.fields, "value"),
      description: fieldValue(n.fields, "description") || null,
    }))
    .filter((s) => s.label && s.value && !STALE_STYLE_PATTERN.test(`${s.label} ${s.value}`));
}

function normalizeFeatureHighlights(field: MetaobjectRefsField): ProductRecord["featureHighlights"] {
  const nodes = field?.references?.nodes ?? [];
  return nodes
    .map((n) => ({
      label: fieldValue(n.fields, "label"),
      body: fieldValue(n.fields, "body"),
      image: fieldImage(n.fields, "image"),
    }))
    .filter((h) => h.label && h.body && !STALE_STYLE_PATTERN.test(`${h.label} ${h.body}`));
}

function normalizePerks(field: { value: string } | null): string[] {
  if (!field?.value) return [];
  try {
    const list = JSON.parse(field.value) as unknown;
    if (!Array.isArray(list)) return [];
    return list
      .filter((p): p is string => typeof p === "string" && p.trim().length > 0)
      .filter((p) => !STALE_STYLE_PATTERN.test(p));
  } catch {
    return [];
  }
}

/** Only kept when it's a valid timestamp that hasn't passed yet — never shows an expired countdown. */
function normalizeSaleEndsAt(field: { value: string } | null): string | null {
  const raw = field?.value?.trim();
  if (!raw) return null;
  const time = Date.parse(raw);
  if (Number.isNaN(time) || time <= Date.now()) return null;
  return new Date(time).toISOString();
}

async function fetchProduct(
  handle: string,
  markets: string[],
): Promise<ProductRecord | null> {
  const data = await adminRequest<ProductData>(PRODUCT_QUERY, { handle });
  const product = data.productByHandle;
  if (!product) return null;

  const variants = normalizeVariants(product.variants.nodes);
  const pricesByVariant = new Map<string, Record<string, MarketPrice>>(
    variants.map((v) => [v.id, {}]),
  );

  if (markets.length > 0 && isStorefrontConfigured()) {
    const ids = variants.map((v) => v.id);
    await Promise.all(
      markets.map(async (country) => {
        const prices = await getLocalizedVariantPrices(ids, country).catch(
          () => new Map(),
        );
        for (const [variantId, localized] of prices) {
          const bucket = pricesByVariant.get(variantId);
          if (!bucket) continue;
          bucket[country] = {
            amount: Number(localized.amount),
            compareAtAmount:
              localized.compareAtAmount != null ? Number(localized.compareAtAmount) : null,
            currencyCode: localized.currencyCode,
          };
        }
      }),
    );
  }

  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    vendor: product.vendor,
    productType: product.productType,
    status: product.status,
    updatedAt: product.updatedAt,
    seo: {
      title: product.seo?.title ?? null,
      description: product.seo?.description ?? null,
    },
    options: product.options.map((o) => ({ name: o.name, values: o.values })),
    availableForSale: variants.some((v) => v.availableForSale),
    variants: variants.map((v) => ({ ...v, pricesByMarket: pricesByVariant.get(v.id) ?? {} })),
    media: normalizeMedia(product.media.nodes, variants),
    specs: normalizeSpecs(product.specs),
    featureHighlights: normalizeFeatureHighlights(product.featureHighlights),
    perks: normalizePerks(product.perks),
    saleEndsAt: normalizeSaleEndsAt(product.saleEndsAt),
  };
}

export type SyncResult = {
  action: "synced";
  handles: string[];
  missing: string[];
};

/**
 * Re-syncs the given handles (default: every Slumberlush handle) and merges them
 * into the existing catalog document, so one product's webhook never wipes the
 * others. Serialised behind the storage lock.
 */
export async function syncProducts(
  handles: readonly string[] = STORE_HANDLES,
): Promise<SyncResult> {
  const cfg = shopifyConfig();
  if (!cfg.storeDomain) throw new Error("SHOPIFY_STORE_DOMAIN is not set");

  const [shopData, markets] = await Promise.all([
    adminRequest<{ shop: { name: string; currencyCode: string } | null }>(SHOP_QUERY),
    // A missing read_markets scope must not take down the base sync.
    discoverCuratedMarketCountries().catch(() => [] as string[]),
  ]);

  const fetched = await Promise.all(handles.map((h) => fetchProduct(h, markets)));
  const missing = handles.filter((_, i) => !fetched[i]);

  const lock = await acquireLock();
  try {
    const existing = await readJsonFile<CatalogDocument>(CATALOG_PATH);
    const products: Record<string, ProductRecord> = { ...(existing?.products ?? {}) };
    for (const record of fetched) if (record) products[record.handle] = record;
    // Drop products that are no longer part of the Slumberlush line.
    for (const key of Object.keys(products)) {
      if (!STORE_HANDLES.includes(key)) delete products[key];
    }

    const doc: CatalogDocument = {
      version: 6,
      syncedAt: new Date().toISOString(),
      shop: {
        domain: cfg.storeDomain,
        name: shopData.shop?.name ?? "",
        currencyCode: shopData.shop?.currencyCode ?? "USD",
      },
      markets,
      products,
    };
    await writeJsonFileAtomic(CATALOG_PATH, doc);
  } finally {
    await lock.release();
  }

  return {
    action: "synced",
    handles: fetched.filter(Boolean).map((p) => p!.handle),
    missing,
  };
}

/** Webhook entry point: re-sync just the product that changed, if it is ours. */
export async function syncProductFromWebhook(handle: string): Promise<SyncResult> {
  return syncProducts([handle]);
}
