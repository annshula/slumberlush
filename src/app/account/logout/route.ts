import { NextRequest, NextResponse } from "next/server";

import {
  clearSession,
  readSession,
} from "@/lib/shopify/customer-account";
import { customerAccountLogoutUrl, shopifyConfig } from "@/lib/shopify/config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Signs the customer out. The local session cookie is cleared first so a
 * failure on Shopify's side can never leave the customer signed in; then the
 * browser is pointed at Shopify's hosted logout to revoke the tokens.
 */
export async function GET(request: NextRequest) {
  const session = await readSession();
  await clearSession();

  const cfg = shopifyConfig();
  const postLogout = cfg.siteUrl;
  const target =
    session?.idToken && cfg.customerAccountShopId
      ? `${customerAccountLogoutUrl(cfg)}?id_token_hint=${encodeURIComponent(
          session.idToken,
        )}&post_logout_redirect_uri=${encodeURIComponent(postLogout)}`
      : postLogout;

  return NextResponse.redirect(new URL(target, request.url));
}

export async function POST(request: NextRequest) {
  return GET(request);
}
