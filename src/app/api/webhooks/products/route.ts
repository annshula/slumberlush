import { NextRequest, NextResponse } from "next/server";

import { revalidateCatalog } from "@/lib/catalog/tags";
import { isAdminConfigured } from "@/lib/shopify/config";
import { syncProductFromWebhook } from "@/lib/shopify/sync-product";
import { belongsToStore } from "@/lib/catalog/ownership";
import { STORE_HANDLES, productContentByHandle } from "@/content/products";
import {
  describeCaller,
  isDuplicateWebhook,
  verifyWebhookSignature,
} from "@/services/webhooks/verify";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Shopify products/create|update|delete → re-sync that product into the
 * catalog and purge the cached catalog read, so price, availability and media
 * changes reach every page without a redeploy.
 *
 * Order: HMAC (raw body) → topic gate → dedupe → ownership gate (the store is
 * shared with other brands) → sync → revalidate.
 */

const PRODUCT_TOPICS = new Set(["products/create", "products/update", "products/delete"]);

const ack = (extra: Record<string, unknown> = {}) =>
  NextResponse.json({ received: true, ...extra }, { headers: { "Cache-Control": "no-store" } });

export async function POST(request: NextRequest) {
  const webhookId = request.headers.get("x-shopify-webhook-id");
  const topic = request.headers.get("x-shopify-topic") ?? "";

  // Everything below can throw (bad headers, a malformed request, a bug in a
  // helper) — Shopify's delivery log shows an uncaught throw as a silent
  // connection drop (status 0), which it can't tell apart from a real outage
  // and retries harder for. One catch-all guarantees a real HTTP response
  // (or, worst case, Shopify's own 5xx retry) instead of that ambiguity.
  try {
    const rawBody = await request.text();
    if (rawBody.length > 1_000_000) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    if (
      !verifyWebhookSignature(
        rawBody,
        request.headers.get("x-shopify-hmac-sha256"),
        describeCaller(request.headers),
      )
    ) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const shopDomain = request.headers.get("x-shopify-shop-domain");
    if (shopDomain && process.env.SHOPIFY_STORE_DOMAIN && shopDomain !== process.env.SHOPIFY_STORE_DOMAIN.trim()) {
      return NextResponse.json({ error: "Unknown shop" }, { status: 401 });
    }

    if (!PRODUCT_TOPICS.has(topic)) return ack({ topic, ignored: true });

    if (isDuplicateWebhook(webhookId)) {
      console.log(`[webhook/products] ${topic} id=${webhookId} deduped (already processed)`);
      return ack({ topic, deduped: true });
    }

    let payload: { id?: number | string | null; handle?: string | null };
    try {
      payload = JSON.parse(rawBody) as typeof payload;
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const handle = payload.handle ?? null;
    const ours =
      belongsToStore({ productId: payload.id ?? null }) ||
      (handle !== null && STORE_HANDLES.includes(handle));
    if (!ours) return ack({ topic, matched: false });

    if (!isAdminConfigured()) {
      console.error("[webhook/products] Admin API not configured — skipping sync");
      return ack({ topic, synced: false });
    }

    // Deletes carry only an id: re-sync every handle so a removed product drops out.
    const result =
      topic === "products/delete" || !handle
        ? await (await import("@/lib/shopify/sync-product")).syncProducts()
        : await syncProductFromWebhook(handle);
    revalidateCatalog(handle ? productContentByHandle(handle)?.slug : undefined);
    console.log(`[webhook/products] ${topic} id=${webhookId} → synced ${result.handles.join(", ")}`);
    return ack({ topic, ...result });
  } catch (error) {
    console.error(`[webhook/products] ${topic} id=${webhookId} failed:`, (error as Error).message);
    // 500 so Shopify retries a transient failure.
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
