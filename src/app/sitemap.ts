import type { MetadataRoute } from "next";

import { collections } from "@/content/collections";
import { guides } from "@/content/guides";
import { contentPages, policyPages } from "@/content/pages";
import { getCatalog, getProducts } from "@/lib/catalog";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, catalog] = await Promise.all([getProducts(), getCatalog()]);
  const synced = new Date(catalog.syncedAt);
  const live = new Set(products.map((p) => p.content.category.slug));

  return [
    { url: absoluteUrl("/"), lastModified: synced, changeFrequency: "weekly", priority: 1 },
    ...products.map(({ content, record }) => ({
      url: absoluteUrl(`/products/${content.slug}`),
      lastModified: new Date(record.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.9,
      images: record.media
        .filter((m) => m.type === "image")
        .slice(0, 8)
        .map((m) => (m.type === "image" ? m.url.split("?")[0]! : "")),
    })),
    // Launching-soon categories are noindex until they have products.
    ...collections
      .filter((c) => c.categories === "*" || (c.categories as string[]).some((s) => live.has(s)))
      .map((c) => ({ url: absoluteUrl(`/collections/${c.slug}`), lastModified: synced, priority: 0.8 })),
    { url: absoluteUrl("/guides"), priority: 0.6 },
    ...guides.map((g) => ({ url: absoluteUrl(`/guides/${g.slug}`), lastModified: new Date(g.updated), priority: 0.7 })),
    ...contentPages.map((p) => ({ url: absoluteUrl(`/pages/${p.slug}`), priority: 0.4 })),
    { url: absoluteUrl("/pages/faq"), priority: 0.6 },
    ...Object.keys(policyPages).map((slug) => ({ url: absoluteUrl(`/pages/${slug}`), priority: 0.2 })),
  ];
}
