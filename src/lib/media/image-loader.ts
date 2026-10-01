/**
 * next/image loader. Shopify's CDN resizes on the fly (`?width=`) and
 * negotiates WebP/AVIF from the Accept header, so product and editorial images
 * are served straight from cdn.shopify.com — no second optimisation hop.
 * Local /public images are small brand assets and pass through unchanged.
 */
export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }): string {
  if (src.startsWith("https://cdn.shopify.com/")) {
    const url = new URL(src);
    url.searchParams.set("width", String(width));
    return url.toString();
  }
  return `${src}${src.includes("?") ? "&" : "?"}w=${width}`;
}
