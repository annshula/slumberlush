/**
 * `npm run shopify:sync [handle…]` — refresh data/catalog.json from Shopify.
 * Same engine as the products/create|update webhook (src/lib/shopify/sync-product.ts),
 * so a manual sync and a merchant edit can never drift apart.
 */
import { loadEnv } from "./env";

loadEnv();

async function main(): Promise<void> {
  const { syncProducts } = await import("../src/lib/shopify/sync-product");
  const { STORE_HANDLES } = await import("../src/content/products");
  const handles = process.argv.slice(2);
  const result = await syncProducts(handles.length ? handles : STORE_HANDLES);
  console.log(`✔ synced: ${result.handles.join(", ") || "(none)"}`);
  if (result.missing.length) console.warn(`⚠ not found in Shopify: ${result.missing.join(", ")}`);
}

main().catch((err) => {
  console.error("✖ sync failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
