"use client";

/**
 * One call → every configured provider (Meta `fbq`, GA4 `gtag`, TikTok `ttq`).
 * Providers install themselves only when their NEXT_PUBLIC_* id is set and the
 * visitor's consent allows it, so these are silent no-ops otherwise.
 * Purchases are sent server-side from the orders/paid webhook (the browser
 * never sees Shopify's hosted checkout).
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    ttq?: { page: (...args: unknown[]) => void; track: (...args: unknown[]) => void };
  }
}

export type AnalyticsItem = {
  /** Shopify variant GID. */
  id: string;
  name: string;
  variant?: string;
  price: number;
  quantity?: number;
};

const numericId = (gid: string) => gid.split("/").pop() ?? gid;

function ga(event: string, params: Record<string, unknown>) {
  window.gtag?.("event", event, params);
}
function fb(event: string, params: Record<string, unknown>) {
  window.fbq?.("track", event, params);
}
function tt(event: string, params: Record<string, unknown>) {
  window.ttq?.track(event, params);
}

const gaItems = (items: AnalyticsItem[]) =>
  items.map((i) => ({
    item_id: numericId(i.id),
    item_name: i.name,
    item_variant: i.variant,
    price: i.price,
    quantity: i.quantity ?? 1,
  }));

const total = (items: AnalyticsItem[]) =>
  Math.round(items.reduce((s, i) => s + i.price * (i.quantity ?? 1), 0) * 100) / 100;

export function trackViewItem(item: AnalyticsItem, currency: string) {
  if (typeof window === "undefined") return;
  const value = total([item]);
  ga("view_item", { currency, value, items: gaItems([item]) });
  fb("ViewContent", { content_type: "product", content_ids: [numericId(item.id)], content_name: item.name, currency, value });
  tt("ViewContent", { content_type: "product", content_id: numericId(item.id), content_name: item.name, currency, value });
}

export function trackSelectVariant(item: AnalyticsItem) {
  if (typeof window === "undefined") return;
  ga("select_item", { items: gaItems([item]) });
}

export function trackAddToCart(item: AnalyticsItem, currency: string) {
  if (typeof window === "undefined") return;
  const value = total([item]);
  ga("add_to_cart", { currency, value, items: gaItems([item]) });
  fb("AddToCart", { content_type: "product", content_ids: [numericId(item.id)], content_name: item.name, currency, value });
  tt("AddToCart", { content_type: "product", content_id: numericId(item.id), content_name: item.name, quantity: item.quantity ?? 1, currency, value });
}

export function trackRemoveFromCart(item: AnalyticsItem, currency: string) {
  if (typeof window === "undefined") return;
  ga("remove_from_cart", { currency, value: total([item]), items: gaItems([item]) });
}

export function trackBeginCheckout(items: AnalyticsItem[], currency: string) {
  if (typeof window === "undefined") return;
  const value = total(items);
  ga("begin_checkout", { currency, value, items: gaItems(items) });
  fb("InitiateCheckout", {
    content_type: "product",
    content_ids: items.map((i) => numericId(i.id)),
    num_items: items.reduce((n, i) => n + (i.quantity ?? 1), 0),
    currency,
    value,
  });
  tt("InitiateCheckout", {
    content_type: "product",
    contents: items.map((i) => ({ content_id: numericId(i.id), content_name: i.name, quantity: i.quantity ?? 1 })),
    currency,
    value,
  });
}

export function trackSearch(query: string, results: number) {
  if (typeof window === "undefined") return;
  const q = query.trim().toLowerCase().slice(0, 80);
  ga("search", { search_term: q, results });
  fb("Search", { search_string: q });
  tt("Search", { query: q });
}

export function trackViewVideo(videoId: string, percent: number) {
  if (typeof window === "undefined") return;
  ga("video_progress", { video_title: videoId, video_percent: percent });
}
