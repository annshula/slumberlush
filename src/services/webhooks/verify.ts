import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Shopify webhook HMAC verification + idempotency — ported from the Trackify
 * reference (`reference/services/webhooks/verify.ts`).
 *
 * Verification MUST run against the raw request body — any JSON round-trip
 * changes the bytes and invalidates the signature.
 */

/**
 * Best-effort identification of who called, for the 401 logs. Shopify ALWAYS
 * signs its deliveries, so a 401 for a *missing* header means the request did
 * not come from Shopify's webhook system (a bot, a scanner, or a manual probe)
 * — not a misconfigured webhook. A real Shopify delivery that fails says
 * "HMAC mismatch" instead. Without this, both look identical in the logs.
 */
export function describeCaller(headers: Headers): string {
  const topic = headers.get("x-shopify-topic") ?? "none";
  const webhookId = headers.get("x-shopify-webhook-id") ?? "none";
  const ip = headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const userAgent = (headers.get("user-agent") ?? "none").slice(0, 120);
  return `topic=${topic} id=${webhookId} ip=${ip} ua="${userAgent}"`;
}

export function verifyWebhookSignature(
  rawBody: string | Buffer,
  headerSignature: string | null,
  /** Who called — see describeCaller(). Included in the 401 logs only. */
  caller?: string,
): boolean {
  const context = caller ? ` — caller: ${caller}` : "";
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    console.error(
      "[webhook] 401: SHOPIFY_WEBHOOK_SECRET is not set on this environment",
    );
    return false;
  }
  if (!headerSignature) {
    console.error(
      `[webhook] 401: missing x-shopify-hmac-sha256 header${context}` +
        " (Shopify always signs its deliveries, so this request did not come from Shopify)",
    );
    return false;
  }

  const computed = createHmac("sha256", secret)
    .update(
      typeof rawBody === "string" ? Buffer.from(rawBody, "utf8") : rawBody,
    )
    .digest();

  let provided: Buffer;
  try {
    provided = Buffer.from(headerSignature, "base64");
  } catch {
    return false;
  }

  // timingSafeEqual throws on length mismatch, so check length first — the
  // length of a signature is not a secret.
  if (provided.length !== computed.length) return false;
  const match = timingSafeEqual(provided, computed);
  if (!match) {
    console.error(
      `[webhook] 401: HMAC mismatch — the secret registered in Shopify does not match SHOPIFY_WEBHOOK_SECRET${context}`,
    );
  }
  return match;
}

/**
 * Bounded LRU of processed webhook IDs.
 *
 * Shopify retries aggressively and can deliver the same event more than once;
 * replaying a purchase would over-count conversions in Meta / GA4.
 */
const MAX_SEEN = 2000;
const seen = new Map<string, number>();

export function isDuplicateWebhook(webhookId: string | null): boolean {
  if (!webhookId) return false;
  if (seen.has(webhookId)) {
    seen.delete(webhookId);
    seen.set(webhookId, Date.now());
    return true;
  }
  seen.set(webhookId, Date.now());
  if (seen.size > MAX_SEEN) {
    const oldest = seen.keys().next().value;
    if (oldest !== undefined) seen.delete(oldest);
  }
  return false;
}

/** Test seam — resets the dedupe cache. */
export function resetWebhookDedupe(): void {
  seen.clear();
}
