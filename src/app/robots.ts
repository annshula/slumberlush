import type { MetadataRoute } from "next";

import { site } from "@/lib/site";

/** AI crawlers are allowed on purpose: being cited by answer engines is a goal (blueprint §17). */
export default function robots(): MetadataRoute.Robots {
  const isProd = process.env.VERCEL_ENV ? process.env.VERCEL_ENV === "production" : true;
  if (!isProd) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/account", "/cart", "/api/"] }],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
