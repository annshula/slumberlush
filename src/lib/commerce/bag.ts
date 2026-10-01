import "server-only";

import type { BagCatalog } from "@/components/cart/CartProvider";
import { getProducts, storeCurrency } from "@/lib/catalog";
import { buildProductView } from "@/lib/commerce/product-view";

/** The small variant lookup the client bag needs (a few hundred bytes per product). */
export async function getBagCatalog(): Promise<BagCatalog> {
  const [products, currency] = await Promise.all([getProducts(), storeCurrency()]);
  const variants: BagCatalog["variants"] = {};
  for (const { record, content } of products) {
    const view = buildProductView(record, content, currency);
    const fallbackImage = view.cardImage?.url ?? null;
    for (const v of view.variants) {
      variants[v.id] = {
        productName: view.name,
        variantLabel: v.label,
        price: v.price,
        image: v.image ?? fallbackImage,
        href: `${view.href}?variant=${v.id.split("/").pop()}`,
        available: v.availableForSale,
        hasPackOption: view.packOptionName !== null,
      };
    }
  }
  return { currency, variants };
}
