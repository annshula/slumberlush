import { NextRequest, NextResponse } from "next/server";

import { detectVisitorCountry } from "@/lib/localization/geo";
import { readSelectedCountry } from "@/lib/localization/country";
import { getLocalization } from "@/lib/shopify/localization-service";

/**
 * GET /api/localization — the real list of countries/currencies Shopify has
 * configured (Shopify Markets), the shop's default market for this visitor's
 * detected country (from the hosting edge's own geolocation, resolved
 * through Shopify's own currency data — never computed here), and whichever
 * one this visitor has already chosen. Powers the currency overlay; nothing
 * here is a hardcoded list or a local conversion.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store, private", "X-Robots-Tag": "noindex, nofollow" } });

export async function GET(request: NextRequest) {
  try {
    const [localization, selected] = await Promise.all([
      getLocalization(detectVisitorCountry(request.headers)),
      readSelectedCountry(),
    ]);
    return json({
      defaultCountry: localization.defaultCountry,
      countries: localization.availableCountries,
      selected,
    });
  } catch {
    return json({ defaultCountry: null, countries: [], selected: null });
  }
}
