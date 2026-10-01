"use client";

/**
 * A stable per-browser id, generated once and persisted in localStorage —
 * sent to Meta as `external_id` on the server-side Purchase event (see
 * api/webhooks/shopify-order-paid/route.ts). Not tied to a real account
 * (checkout is not login-gated), so it's a random id, not a customer id;
 * Meta's docs accept any stable advertiser-chosen identifier here — its job
 * is linking the same browser's ViewContent → AddToCart → Purchase into one
 * match, not carrying PII, so a random UUID needs no hashing.
 *
 * Ported from the AccuPenPro reference (`reference/lib/ad-identity.ts`),
 * scoped down to just this id: Slumberlush already reads `_fbp`/`_fbc` straight
 * from document.cookie at checkout (see CartProvider.checkout), so only the
 * externalId half of that file is needed here.
 */

const EXTERNAL_ID_KEY = "slumberlush.external_id.v1";

/** Generated once per browser, then reused for the life of that browser's storage. */
export function getExternalId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const existing = window.localStorage.getItem(EXTERNAL_ID_KEY);
    if (existing) return existing;
    const fresh = crypto.randomUUID();
    window.localStorage.setItem(EXTERNAL_ID_KEY, fresh);
    return fresh;
  } catch {
    // Private browsing / storage blocked — degrade to no external_id rather
    // than crash checkout over an analytics nicety.
    return null;
  }
}
