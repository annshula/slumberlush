import "server-only";

import { unstable_cache } from "next/cache";

import { graphqlRequest } from "@/lib/shopify/client";
import { isStorefrontConfigured, shopifyConfig, storefrontEndpoint } from "@/lib/shopify/config";

/**
 * Legal policies straight from Shopify (Settings → Policies), so the storefront
 * always shows the exact text the merchant published. Cached for a day and
 * tagged `policies` for manual purge via /api/admin/revalidate.
 */

export type PolicyKey = "privacyPolicy" | "refundPolicy" | "shippingPolicy" | "termsOfService";
export type Policy = { title: string; body: string };

const QUERY = /* GraphQL */ `
  query Policies {
    shop {
      privacyPolicy { title body }
      refundPolicy { title body }
      shippingPolicy { title body }
      termsOfService { title body }
    }
  }
`;

/**
 * Allowlist sanitiser for merchant-authored policy HTML: keeps structural tags
 * and plain links, drops everything executable. Policies are simple rich text,
 * so a strict allowlist loses nothing.
 */
const ALLOWED = new Set(["p", "br", "h2", "h3", "h4", "strong", "b", "em", "i", "u", "ul", "ol", "li", "a", "span", "div", "table", "thead", "tbody", "tr", "th", "td"]);

export function sanitizePolicyHtml(html: string): string {
  return html
    .replace(/<(script|style|iframe|object|embed|form|svg|math)[\s\S]*?<\/\1>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (tag, name: string, attrs: string) => {
      const lower = name.toLowerCase();
      const closing = tag.startsWith("</");
      if (lower === "h1") return closing ? "</h2>" : "<h2>";
      if (!ALLOWED.has(lower)) return "";
      if (closing) return `</${lower}>`;
      if (lower === "a") {
        const href = /href\s*=\s*"([^"]*)"/i.exec(attrs)?.[1] ?? "";
        const safe = /^(https?:|mailto:|\/|#)/i.test(href.trim()) ? href.replace(/"/g, "&quot;") : "#";
        const external = /^https?:/i.test(safe);
        return `<a href="${safe}"${external ? ' rel="noopener noreferrer"' : ""}>`;
      }
      return `<${lower}>`;
    })
    // Anything left that looks like a tag opener but isn't one we emitted is text.
    .replace(/<(?!\/?(?:p|br|h2|h3|h4|strong|b|em|i|u|ul|ol|li|a|span|div|table|thead|tbody|tr|th|td)[\s>])/gi, "&lt;");
}

const readPolicies = unstable_cache(
  async (): Promise<Partial<Record<PolicyKey, Policy>>> => {
    if (!isStorefrontConfigured()) return {};
    try {
      const data = await graphqlRequest<{ shop: Record<PolicyKey, Policy | null> }>({
        endpoint: storefrontEndpoint(),
        query: QUERY,
        storefrontToken: shopifyConfig().storefrontToken,
      });
      const out: Partial<Record<PolicyKey, Policy>> = {};
      for (const key of Object.keys(data.shop) as PolicyKey[]) {
        const p = data.shop[key];
        if (p?.body) out[key] = { title: p.title, body: sanitizePolicyHtml(p.body) };
      }
      return out;
    } catch (error) {
      console.error("[policies] fetch failed:", (error as Error).message);
      return {};
    }
  },
  ["shop-policies-v1"],
  { tags: ["policies"], revalidate: 86_400 },
);

export async function getPolicy(key: PolicyKey): Promise<Policy | null> {
  return (await readPolicies())[key] ?? null;
}
