import { NextResponse } from "next/server";

import { isAuthorizedAdminRequest, unauthorizedResponse } from "@/lib/admin/auth";
import { revalidateCatalog } from "@/lib/catalog/tags";
import { syncProducts } from "@/lib/shopify/sync-product";

/**
 * POST /api/admin/sync-product — re-sync every Slumberlush product from Shopify
 * into the catalog (fs in dev, private Blob in production) and purge caches.
 * For when a webhook was missed. Protected by ADMIN_API_KEY (Bearer token).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };

export async function POST(request: Request): Promise<Response> {
  if (!isAuthorizedAdminRequest(request)) return unauthorizedResponse();
  try {
    const result = await syncProducts();
    revalidateCatalog();
    return NextResponse.json({ ok: true, ...result }, { headers });
  } catch (error) {
    console.error("[admin/sync-product] failed:", (error as Error).message);
    return NextResponse.json({ ok: false, error: "Sync failed" }, { status: 500, headers });
  }
}

export async function GET(): Promise<Response> {
  return NextResponse.json({ error: "Use POST" }, { status: 405 });
}
