import seed from "../../../data/catalog.json";
import type { CatalogDocument } from "@/lib/catalog/types";
import { STORE_HANDLES } from "@/content/products";

/**
 * Brand identity on a shared Shopify store: the store sells several brands, so
 * order history, returns and purchase events are filtered down to Slumberlush's own
 * products. Ids come from the committed catalog snapshot (they don't change
 * when prices or media do), matched by product id first so a variant added
 * after the last sync still counts.
 */

const doc = seed as unknown as CatalogDocument;
const products = STORE_HANDLES.map((h) => doc.products[h]).filter(Boolean);

const numericTail = (gid: string) => gid.split("/").pop() ?? gid;

const productIds = new Set(products.flatMap((p) => [p!.id, numericTail(p!.id)]));
const variantIds = new Set(
  products.flatMap((p) => p!.variants.flatMap((v) => [v.id, numericTail(v.id)])),
);

/** Accepts GIDs (APIs) or plain numeric ids (webhooks). */
export function belongsToStore(input: {
  variantId?: string | number | null;
  productId?: string | number | null;
}): boolean {
  if (input.productId != null && productIds.has(String(input.productId))) return true;
  return input.variantId != null && variantIds.has(String(input.variantId));
}
