/**
 * Site-wide facts. Everything here is shown to customers and/or emitted as
 * structured data, so each value must be true. Edit here, not in components.
 */

const rawUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";

export const site = {
  name: "Slumberlush",
  url: rawUrl.replace(/\/+$/, ""),
  tagline: "Sleep softer. Live cozier.",
  descriptor: "Sleep & comfort essentials, made to be lived in.",
  description:
    "Slumberlush makes cloud-soft sleep and comfort essentials — plush blankets, weighted blankets, sleepwear, robes and slippers — designed for deeper rest and slower evenings at home.",
  /** Where customers reach a human. */
  supportEmail:
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "hello@slumberlush.com",
  /** Tracked delivery window shown on product pages. */
  delivery: { minDays: 5, maxDays: 9, tracked: true },
  /** Returns are started from the customer's order history (account → orders). */
  returnWindowDays: 30,
  /** Free-shipping threshold in store currency, or null when there is none. */
  freeShippingThreshold: 75 as number | null,
  locale: "en_US",
  social: [] as { label: string; href: string }[],
} as const;

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${site.url}${path.startsWith("/") ? path : `/${path}`}`;
}
