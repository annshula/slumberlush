import type { NextConfig } from "next";

import { products } from "./src/content/products";

/**
 * Static security headers. The Content-Security-Policy is set per request in
 * src/middleware.ts (it depends on which integrations are configured).
 */
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), usb=(), interest-cohort=(), browsing-topics=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    loader: "custom",
    loaderFile: "./src/lib/media/image-loader.ts",
    deviceSizes: [360, 480, 640, 828, 1080, 1280, 1600, 1920, 2400],
    imageSizes: [64, 96, 128, 200, 320],
  },
  // Not using experimental.inlineCss: it duplicates the stylesheet inside the
  // RSC payload of every page. One cached ~12 KB (gzip) file is cheaper.
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/(account|cart|search)(.*)",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      ...products.flatMap((p) =>
        p.legacySlugs.map((legacy) => ({
          source: `/products/${legacy}`,
          destination: `/products/${p.slug}`,
          permanent: true,
        })),
      ),
      { source: "/blog", destination: "/guides", permanent: true },
      { source: "/blog/:slug", destination: "/guides/:slug", permanent: true },
      { source: "/checkout", destination: "/cart", permanent: false },
      { source: "/products", destination: "/collections/all", permanent: true },
      { source: "/collections", destination: "/collections/all", permanent: true },
    ];
  },
};

export default nextConfig;
