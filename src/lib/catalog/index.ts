import "server-only";

import { unstable_cache } from "next/cache";

import seed from "../../../data/catalog.json";
import { CATALOG_PATH, readJsonFile } from "@/lib/catalog/storage";
import { CACHE_TAGS } from "@/lib/catalog/tags";
import type { CatalogDocument, ProductRecord } from "@/lib/catalog/types";
import {
  products as productContent,
  productContentBySlug,
  type ProductContent,
} from "@/content/products";

/**
 * Server-side catalog reads.
 *
 * Source order: live synced document (Vercel Blob in production, data/ on
 * disk in dev — written by the products/* webhook and `npm run shopify:sync`)
 * → the committed build-time seed. The read is wrapped in `unstable_cache`
 * with the `catalog` tag, so pages stay static/ISR and the webhook's
 * `revalidateTag("catalog")` refreshes every surface at once — no redeploy.
 */

const seedDoc = seed as unknown as CatalogDocument;

const readCatalog = unstable_cache(
  async (): Promise<CatalogDocument> => {
    try {
      const live = await readJsonFile<CatalogDocument>(CATALOG_PATH);
      if (live?.products && Object.keys(live.products).length > 0) {
        /* A product renamed or added in Shopify can be missing from the live
           document until the next sync. Fall back to the committed seed for
           those handles, so a listed product never vanishes in the gap. */
        const products = { ...live.products };
        for (const { handle } of productContent) {
          const fallback = seedDoc.products[handle];
          if (!products[handle] && fallback) products[handle] = fallback;
        }
        return { ...live, products };
      }
    } catch (error) {
      console.error(
        "[catalog] live read failed, serving the build-time seed:",
        error instanceof Error ? error.message : error,
      );
    }
    return seedDoc;
  },
  ["slumberlush-catalog-v1"],
  { tags: [CACHE_TAGS.catalog], revalidate: 3600 },
);

export async function getCatalog(): Promise<CatalogDocument> {
  return readCatalog();
}

export type CatalogProduct = { record: ProductRecord; content: ProductContent };

/** Every Slumberlush product that exists in Shopify and is active, in content order. */
export async function getProducts(): Promise<CatalogProduct[]> {
  const catalog = await getCatalog();
  return productContent
    .map((content) => ({ content, record: catalog.products[content.handle] }))
    .filter(
      (p): p is CatalogProduct =>
        Boolean(p.record) && p.record!.status === "ACTIVE",
    );
}

export async function getProductBySlug(slug: string): Promise<CatalogProduct | null> {
  const content = productContentBySlug(slug);
  if (!content) return null;
  const catalog = await getCatalog();
  const record = catalog.products[content.handle];
  if (!record || record.status !== "ACTIVE") return null;
  return { record, content };
}

export async function getProductsInCategory(categorySlug: string): Promise<CatalogProduct[]> {
  return (await getProducts()).filter((p) => p.content.category.slug === categorySlug);
}

export async function storeCurrency(): Promise<string> {
  return (await getCatalog()).shop.currencyCode || "USD";
}

/** Every Slumberlush variant id → product handle. Used to validate cart lines and match orders. */
export async function storeVariantIndex(): Promise<Map<string, string>> {
  const catalog = await getCatalog();
  const index = new Map<string, string>();
  for (const content of productContent) {
    const record = catalog.products[content.handle];
    for (const v of record?.variants ?? []) index.set(v.id, content.handle);
  }
  return index;
}
