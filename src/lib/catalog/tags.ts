import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Cache vocabulary shared by pages and webhook/admin revalidation.
 * `catalog` tags the one cached catalog read (lib/catalog/index.ts), so a
 * single purge refreshes home, collections, PDPs, sitemap and feeds.
 */
export const CACHE_TAGS = {
  catalog: "catalog",
  reviews: (handle: string) => `reviews:${handle}`,
} as const;

export function purgeTag(tag: string): void {
  revalidateTag(tag);
}

export function purgePath(path: string, type?: "layout" | "page"): void {
  revalidatePath(path, type);
}

/** The catalog changed — drop the cached read and the product's page. */
export function revalidateCatalog(productSlug?: string): void {
  purgeTag(CACHE_TAGS.catalog);
  if (productSlug) purgePath(`/products/${productSlug}`);
  purgePath("/", "layout");
}
