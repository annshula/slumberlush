/**
 * Shape of data/catalog.json — the Shopify read model written by
 * `lib/shopify/sync-product.ts` and read by `lib/catalog/index.ts`.
 * Plain data only, safe to import from client components.
 */

export type MarketPrice = {
  amount: number;
  compareAtAmount: number | null;
  currencyCode: string;
};

export type VariantRecord = {
  id: string;
  title: string;
  sku: string | null;
  barcode: string | null;
  price: number;
  /** Only kept when greater than price (Shopify allows nonsense values). */
  compareAtPrice: number | null;
  availableForSale: boolean;
  /** Option name → value, e.g. { Style: "Spray", Pack: "2PCS" }. */
  options: Record<string, string>;
  image: string | null;
  pricesByMarket: Record<string, MarketPrice>;
  /** Shopify metafield `slumberlush.pack_description` — editable in Admin without a redeploy. */
  description: string | null;
};

export type ImageRecord = {
  type: "image";
  url: string;
  width: number | null;
  height: number | null;
  alt: string | null;
  variantId: string | null;
};

export type VideoRecord = {
  type: "video";
  alt: string | null;
  poster: string;
  width: number | null;
  height: number | null;
  /** mp4 renditions, smallest first. */
  sources: { src: string; type: string; width: number | null }[];
};

export type MediaRecord = ImageRecord | VideoRecord;

/** A `product_spec` metaobject: a labelled fact row. */
export type SpecRecord = { label: string; value: string; description: string | null };

/** A `feature_highlight` metaobject: a labelled point, optionally with an image. */
export type FeatureHighlightRecord = { label: string; body: string; image: string | null };

export type ProductRecord = {
  id: string;
  handle: string;
  title: string;
  vendor: string | null;
  productType: string | null;
  status: string;
  updatedAt: string;
  seo: { title: string | null; description: string | null };
  options: { name: string; values: string[] }[];
  availableForSale: boolean;
  variants: VariantRecord[];
  media: MediaRecord[];
  /** From the `custom.specs` metaobject list, in Shopify's own order. */
  specs: SpecRecord[];
  /** From the `custom.feature_highlights` metaobject list, in Shopify's own order. */
  featureHighlights: FeatureHighlightRecord[];
  /** From the `custom.perks` metafield (plain text list), in Shopify's own order. */
  perks: string[];
  /** From the `custom.sale_ends_at` metafield — an ISO timestamp, or null if unset or already past. */
  saleEndsAt: string | null;
};

export type CatalogDocument = {
  version: number;
  syncedAt: string;
  shop: { domain: string; name: string; currencyCode: string };
  markets: string[];
  products: Record<string, ProductRecord>;
};
