import { NextRequest, NextResponse } from "next/server";

import {
  beginOAuth,
  writeOAuthTransaction,
} from "@/lib/shopify/customer-account";
import { isCustomerAccountConfigured } from "@/lib/shopify/config";
import { isSignedIn } from "@/lib/shopify/guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Starts the Shopify Customer Account OAuth 2.0 + PKCE flow. A plain redirect
 * (not a mutation) — the browser is pointed at Shopify's hosted sign-in.
 */
export async function GET(request: NextRequest) {
  const returnTo = request.nextUrl.searchParams.get("returnTo") ?? "/account";

  if (await isSignedIn()) {
    return NextResponse.redirect(new URL(returnTo, request.url));
  }

  if (!isCustomerAccountConfigured()) {
    return NextResponse.redirect(
      new URL("/account/login?error=unconfigured", request.url),
    );
  }

  const { tx, authorizeUrl } = beginOAuth(returnTo);
  await writeOAuthTransaction(tx);
  const url = await authorizeUrl;
  return NextResponse.redirect(url);
}
