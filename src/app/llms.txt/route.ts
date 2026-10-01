import { collections } from "@/content/collections";
import { guides } from "@/content/guides";
import { getProducts, storeCurrency } from "@/lib/catalog";
import { buildProductView } from "@/lib/commerce/product-view";
import { formatMoney } from "@/lib/money";
import { absoluteUrl, site } from "@/lib/site";

/**
 * /llms.txt — a plain-text map of the canonical pages and core facts for AI
 * systems and answer engines (GEO). Same facts as the pages; refreshed with
 * the catalog.
 */
export const revalidate = 3600;

export async function GET() {
  const [products, currency] = await Promise.all([getProducts(), storeCurrency()]);
  const liveCategories = new Set(products.map((p) => p.content.category.slug));
  const lines: string[] = [
    `# ${site.name}`,
    "",
    `> ${site.description}`,
    "",
    "## Key facts",
    `- Shipping: tracked delivery in ${site.delivery.minDays}–${site.delivery.maxDays} business days${site.freeShippingThreshold ? `; free on orders over $${site.freeShippingThreshold}` : ""}.`,
    `- Returns: within ${site.returnWindowDays} days of delivery, started from the customer's order history.`,
    "- Checkout: Shopify secure checkout.",
    `- Contact: ${site.supportEmail}`,
    "",
    "## Products",
    ...products.map(({ record, content }) => {
      const v = buildProductView(record, content, currency);
      const sizes = content.sizeGuide?.map((s) => `${s.size} ${s.dimensions}`).join("; ");
      return `- [${v.name}](${absoluteUrl(v.href)}): ${content.format}. ${content.benefitLine} From ${formatMoney(v.fromPrice, currency)}.${v.swatches.length > 1 ? ` ${v.swatches.length} colours.` : ""} Materials: ${content.materials.map((m) => m.name).join(", ")}. Care: ${content.care.do.join(", ").toLowerCase()}.${sizes ? ` Sizes: ${sizes}.` : ""}`;
    }),
    "",
    "## Categories",
    ...collections
      .filter((c) => c.categories === "*" || (c.categories as string[]).some((s) => liveCategories.has(s)))
      .map((c) => `- [${c.title}](${absoluteUrl(`/collections/${c.slug}`)}): ${c.description}`),
    "",
    "## Sleep Journal",
    ...guides.map((g) => `- [${g.title}](${absoluteUrl(`/guides/${g.slug}`)}): ${g.summary}`),
    "",
    "## Company",
    `- [About](${absoluteUrl("/pages/about")})`,
    `- [FAQs](${absoluteUrl("/pages/faq")})`,
    `- [Shipping](${absoluteUrl("/pages/shipping")})`,
    `- [Refund policy](${absoluteUrl("/pages/refund-policy")})`,
    "",
  ];
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=3600" },
  });
}
