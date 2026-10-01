import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { belongsToStore } from "@/lib/catalog/ownership";
import { site } from "@/lib/site";
import {
  isDuplicateWebhook,
  verifyWebhookSignature,
} from "@/services/webhooks/verify";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Shopify `orders/paid` webhook — the only place this site can learn that a
 * purchase actually happened, because the shopper pays on Shopify's hosted
 * checkout domain and never returns to a client-side success page here.
 *
 * The handler verifies Shopify's HMAC, then forwards the order to the
 * server-side conversion endpoints that need a real conversion signal:
 *   • Meta Conversions API (`Purchase`) — the browser pixel cannot see this
 *   • Google Analytics 4 Measurement Protocol (`purchase`)
 *   • TikTok Events API (`Purchase`)
 *
 * Every provider is optional: a missing env config is skipped silently and
 * the webhook still acks Shopify with 200 so it does not retry.
 */

type ShopifyLineItem = {
  id: number;
  product_id?: number | null;
  variant_id?: number | null;
  quantity?: number;
  price?: string | number;
  title?: string;
};

type ShopifyAddress = {
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  city?: string | null;
  province_code?: string | null;
  zip?: string | null;
  country_code?: string | null;
};

type ShopifyOrder = {
  id: number;
  name?: string;
  currency?: string;
  total_price?: string | number;
  current_total_price?: string | number;
  line_items?: ShopifyLineItem[];
  email?: string | null;
  phone?: string | null;
  customer?: { email?: string | null; phone?: string | null } | null;
  billing_address?: ShopifyAddress | null;
  note_attributes?: { name?: string; value?: string }[];
  order_status_url?: string | null;
};

/** Mirrors the cart attribute keys app/api/cart/checkout/route.ts writes at checkout. */
const AD_IDENTITY_ATTRIBUTE_KEYS = {
  fbp: "_fbp",
  fbc: "_fbc",
  externalId: "_external_id",
} as const;

/** Reads back the fbp/fbc/external_id the checkout route put on the cart —
 *  this webhook has no cookies of its own, so note_attributes is the only
 *  way these values survive from the shopper's browser to this
 *  server-to-server call. */
function adIdentityFromOrder(order: ShopifyOrder) {
  const byName = new Map(
    (order.note_attributes ?? []).map((a) => [a.name, a.value]),
  );
  return {
    fbp: byName.get(AD_IDENTITY_ATTRIBUTE_KEYS.fbp) || undefined,
    fbc: byName.get(AD_IDENTITY_ATTRIBUTE_KEYS.fbc) || undefined,
    externalId: byName.get(AD_IDENTITY_ATTRIBUTE_KEYS.externalId) || undefined,
  };
}

/** Meta/TikTok require PII lowercased + trimmed, then SHA-256 hex — never send it raw. */
function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function hashField(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim().toLowerCase();
  return trimmed ? sha256(trimmed) : undefined;
}

/** Digits only (Meta's phone spec drops symbols/leading zeros, keeps the country code). */
function hashPhone(value: string | null | undefined): string | undefined {
  const digits = value?.replace(/[^0-9]/g, "");
  return digits ? sha256(digits) : undefined;
}

/** Advanced-matching fields shared by an order's billing contact, hashed once for reuse across providers. */
function customerMatchData(order: ShopifyOrder) {
  const address = order.billing_address ?? undefined;
  return {
    em: hashField(order.email ?? order.customer?.email),
    ph: hashPhone(order.phone ?? order.customer?.phone ?? address?.phone),
    fn: hashField(address?.first_name),
    ln: hashField(address?.last_name),
    ct: hashField(address?.city),
    st: hashField(address?.province_code),
    zp: hashField(address?.zip),
    country: hashField(address?.country_code),
  };
}

/** True when a webhook line item belongs to Slumberlush (shared store). */
function isOurLineItem(line: ShopifyLineItem): boolean {
  return belongsToStore({ productId: line.product_id, variantId: line.variant_id });
}

const ack = () => NextResponse.json({ received: true });

/** Meta Conversions API `Purchase` event. No-op without a pixel + access token. */
async function sendMetaPurchase(
  order: ShopifyOrder,
  ip: string | null,
  userAgent: string | null,
): Promise<void> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN?.trim();
  const version = process.env.META_GRAPH_API_VERSION?.trim() || "v21.0";
  // Meta Events Manager → Test Events issues a per-account code that tags an
  // event as test traffic: it shows up live in that tool but is excluded
  // from ad optimization and reporting. Unset in production; set locally or
  // in a staging env when verifying this pipeline end-to-end so a manual
  // test never counts as a real conversion.
  const testEventCode = process.env.META_TEST_EVENT_CODE?.trim();
  if (!pixelId || !accessToken) {
    console.log(
      `[webhook] Meta CAPI skipped for order ${order.id}: NEXT_PUBLIC_META_PIXEL_ID or META_CAPI_ACCESS_TOKEN not set in this environment`,
    );
    return;
  }

  const items = (order.line_items ?? []).filter(isOurLineItem);
  if (items.length === 0) {
    console.log(
      `[webhook] Meta CAPI skipped for order ${order.id}: no line items matched this store's catalog`,
    );
    return;
  }

  const value = Number(order.current_total_price ?? order.total_price ?? 0);

  // Meta's advanced-matching fields (em/ph/fn/ln/ct/st/zp/country) are the
  // strongest signals in Event Match Quality — stronger than IP/UA/fbp/fbc
  // combined — and each takes an array of hashed values per Meta's spec.
  const match = customerMatchData(order);
  // fbp/fbc/external_id: read back from the cart's note_attributes (see
  // adIdentityFromOrder above) — the only way this server-to-server call can
  // see the browser's own identifiers, since the shopper pays on Shopify's
  // domain and never returns to a page here with cookies to read.
  // external_id isn't hashed: it's a random per-browser UUID with no
  // personal meaning (see lib/ad-identity.ts), not PII like em/ph.
  const adIdentity = adIdentityFromOrder(order);
  const userData = {
    client_ip_address: ip ?? undefined,
    client_user_agent: userAgent ?? undefined,
    em: match.em ? [match.em] : undefined,
    ph: match.ph ? [match.ph] : undefined,
    fn: match.fn ? [match.fn] : undefined,
    ln: match.ln ? [match.ln] : undefined,
    ct: match.ct ? [match.ct] : undefined,
    st: match.st ? [match.st] : undefined,
    zp: match.zp ? [match.zp] : undefined,
    country: match.country ? [match.country] : undefined,
    fbp: adIdentity.fbp,
    fbc: adIdentity.fbc,
    external_id: adIdentity.externalId ? [adIdentity.externalId] : undefined,
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/${version}/${pixelId}/events`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: accessToken,
          ...(testEventCode ? { test_event_code: testEventCode } : {}),
          data: [
            {
              event_name: "Purchase",
              event_time: Math.floor(Date.now() / 1000),
              event_id: `purchase-${order.id}`,
              action_source: "website",
              // Required for web action_source per Meta's docs. Shopify's
              // own order-status page is the one real, order-specific URL
              // that exists for this purchase — falls back to this
              // storefront's own domain on the rare payload that omits it.
              event_source_url: order.order_status_url || site.url,
              user_data: userData,
              custom_data: {
                currency: order.currency ?? "USD",
                value,
                content_ids: items.map((i) => String(i.variant_id ?? i.id)),
                content_type: "product",
                contents: items.map((i) => ({
                  id: String(i.variant_id ?? i.id),
                  quantity: i.quantity ?? 1,
                  item_price: Number(i.price ?? 0),
                })),
                num_items: items.reduce((n, i) => n + (i.quantity ?? 1), 0),
                order_id: String(order.id),
              },
            },
          ],
        }),
      },
    );
    const text = await response.text();
    console.log(
      `[webhook] Meta CAPI status ${response.status} for order ${order.id}: ${text.slice(0, 500)}`,
    );
  } catch (error) {
    console.error(
      `[webhook] Meta CAPI request failed for order ${order.id}:`,
      error instanceof Error ? error.message : error,
    );
  }
}

/** GA4 Measurement Protocol `purchase` event. No-op without an API secret. */
async function sendGa4Purchase(order: ShopifyOrder): Promise<void> {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const apiSecret = process.env.GA_MP_API_SECRET;
  if (!measurementId || !apiSecret) {
    console.log(
      `[webhook] GA4 MP skipped for order ${order.id}: NEXT_PUBLIC_GA_MEASUREMENT_ID or GA_MP_API_SECRET not set in this environment`,
    );
    return;
  }

  const items = (order.line_items ?? []).filter(isOurLineItem).map((line) => ({
    item_id: String(line.variant_id ?? line.id),
    item_name: line.title ?? "",
    price: Number(line.price ?? 0),
    quantity: line.quantity ?? 1,
  }));
  if (items.length === 0) {
    console.log(
      `[webhook] GA4 MP skipped for order ${order.id}: no line items matched this store's catalog`,
    );
    return;
  }

  try {
    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?api_secret=${encodeURIComponent(apiSecret)}&measurement_id=${encodeURIComponent(measurementId)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          /* One stable server-side client per order, so the purchase is not
             counted as its own brand-new "user". */
          client_id: `order-${order.id}.slumberlush`,
          events: [
            {
              name: "purchase",
              params: {
                currency: order.currency ?? "USD",
                value: Number(
                  order.current_total_price ?? order.total_price ?? 0,
                ),
                transaction_id: String(order.id),
                items,
              },
            },
          ],
        }),
      },
    );
    const text = await response.text();
    console.log(
      `[webhook] GA4 MP status ${response.status} for order ${order.id}: ${text.slice(0, 500)}`,
    );
  } catch (error) {
    console.error(
      `[webhook] GA4 MP request failed for order ${order.id}:`,
      error instanceof Error ? error.message : error,
    );
  }
}

/** TikTok Events API `Purchase` event. No-op without a pixel + access token. */
async function sendTikTokPurchase(
  order: ShopifyOrder,
  ip: string | null,
  userAgent: string | null,
): Promise<void> {
  const pixelId = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID?.trim();
  const accessToken = process.env.TIKTOK_ACCESS_TOKEN?.trim();
  if (!pixelId || !accessToken) {
    console.log(
      `[webhook] TikTok Events API skipped for order ${order.id}: NEXT_PUBLIC_TIKTOK_PIXEL_ID or TIKTOK_ACCESS_TOKEN not set in this environment`,
    );
    return;
  }

  const items = (order.line_items ?? []).filter(isOurLineItem);
  if (items.length === 0) {
    console.log(
      `[webhook] TikTok Events API skipped for order ${order.id}: no line items matched this store's catalog`,
    );
    return;
  }

  const value = Number(order.current_total_price ?? order.total_price ?? 0);

  // Same hashed-identity boost as Meta CAPI above — TikTok's Events API
  // matches on `email`/`phone_number` (each a hashed array) too.
  const match = customerMatchData(order);

  try {
    const response = await fetch(
      "https://business-api.tiktok.com/open_api/v1.3/event/track/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Token": accessToken,
        },
        body: JSON.stringify({
          event_source: "web",
          event_source_id: pixelId,
          data: [
            {
              event: "Purchase",
              event_time: Math.floor(Date.now() / 1000),
              event_id: `purchase-${order.id}`,
              user: {
                ip: ip ?? undefined,
                user_agent: userAgent ?? undefined,
                email: match.em ? [match.em] : undefined,
                phone_number: match.ph ? [match.ph] : undefined,
              },
              properties: {
                contents: items.map((i) => ({
                  content_id: String(i.variant_id ?? i.id),
                  content_type: "product",
                  content_name: i.title,
                  quantity: i.quantity ?? 1,
                  price: Number(i.price ?? 0),
                })),
                content_type: "product",
                currency: order.currency ?? "USD",
                value,
              },
            },
          ],
        }),
      },
    );
    const text = await response.text();
    console.log(
      `[webhook] TikTok Events API status ${response.status} for order ${order.id}: ${text.slice(0, 500)}`,
    );
  } catch (error) {
    console.error(
      `[webhook] TikTok Events API request failed for order ${order.id}:`,
      error instanceof Error ? error.message : error,
    );
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  if (
    !verifyWebhookSignature(
      rawBody,
      request.headers.get("x-shopify-hmac-sha256"),
    )
  ) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Shopify retries and can re-deliver the same event; dedupe on the webhook
  // id so a purchase is never counted twice in Meta / GA4.
  if (isDuplicateWebhook(request.headers.get("x-shopify-webhook-id"))) {
    return ack();
  }

  let order: ShopifyOrder;
  try {
    order = JSON.parse(rawBody) as ShopifyOrder;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Logged unconditionally, before either analytics call: sendMetaPurchase/
  // sendGa4Purchase can both no-op silently (missing env config, or no line
  // item matched this store), which otherwise looks identical in the logs
  // to this route never having been invoked at all.
  console.log(`[webhook] order ${order.id} (${order.name ?? "unnamed"}) received, dispatching analytics`);

  // x-forwarded-for is a comma-separated proxy chain (client, proxy1,
  // proxy2, …) behind any reverse proxy/CDN — Meta's client_ip_address
  // expects a single address, so take just the first hop.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = request.headers.get("user-agent");

  // Fire both analytics beacons in parallel and let them fail independently.
  await Promise.allSettled([
    sendMetaPurchase(order, ip, userAgent),
    sendGa4Purchase(order),
    sendTikTokPurchase(order, ip, userAgent),
  ]);

  return ack();
}
