import { NextRequest, NextResponse } from "next/server";

import { storeVariantIndex } from "@/lib/catalog";
import { resolveEffectiveCountry } from "@/lib/localization/country";
import { getLocalizedVariantPrices } from "@/lib/shopify/localization-service";

/**
 * POST /api/localization/prices — given a batch of variant IDs, returns each
 * one's price *as Shopify itself reports it* for the visitor's effective
 * country (their explicit choice, or the same edge-geolocated country an
 * overlay would show as detected). No conversion happens in this app. Before
 * a country is available, pages keep showing the cached base-currency price
 * and never call this at all.
 *
 * Only ids already in Slumberlush's own synced catalog are accepted — the store
 * is shared with other brands (see lib/catalog/ownership.ts).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GID = /^gid:\/\/shopify\/ProductVariant\/\d{1,20}$/;
const MAX_IDS = 60;

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store, private", "X-Robots-Tag": "noindex, nofollow" } });

export async function POST(request: NextRequest) {
  const country = await resolveEffectiveCountry();
  if (!country) return json({ prices: {} });

  const raw = await request.text();
  if (raw.length > 8_000) return json({ error: "Request too large." }, 413);

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  const input = (body as { variantIds?: unknown })?.variantIds;
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_IDS) {
    return json({ error: "Invalid variant ids." }, 400);
  }

  const known = await storeVariantIndex();
  const ids = input.filter((id): id is string => typeof id === "string" && GID.test(id) && known.has(id));
  if (ids.length === 0) return json({ prices: {} });

  try {
    const priceMap = await getLocalizedVariantPrices(ids, country);
    return json({ prices: Object.fromEntries(priceMap), country });
  } catch {
    // A failed live-price fetch should never break the page — callers fall
    // back to the base-currency price already shown.
    return json({ prices: {} });
  }
}
