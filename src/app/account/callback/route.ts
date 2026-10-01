import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import {
  consumeOAuthTransaction,
  exchangeCodeForTokens,
  writeSession,
} from "@/lib/shopify/customer-account";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ERROR_REDIRECTS: Record<string, string> = {
  cancelled: "cancelled",
  access_denied: "cancelled",
  expired: "expired",
};

/**
 * Completes the Shopify Customer Account OAuth exchange. Reads the single-use
 * transaction cookie, verifies `state` (CSRF) and swaps `code` for tokens.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const providerError = params.get("error");

  const loginUrl = (error: string, returnTo: string) => {
    const u = new URL("/account/login", request.url);
    u.searchParams.set("error", error);
    if (returnTo && returnTo.startsWith("/"))
      u.searchParams.set("returnTo", returnTo);
    return u;
  };

  const tx = await consumeOAuthTransaction();

  if (providerError) {
    const key = ERROR_REDIRECTS[providerError] ?? "provider";
    return NextResponse.redirect(loginUrl(key, tx?.redirectTo ?? "/account"));
  }

  if (!tx || !code || !state) {
    return NextResponse.redirect(
      loginUrl("missing_code", tx?.redirectTo ?? "/account"),
    );
  }

  // Constant-time CSRF check against the state we issued.
  const a = Buffer.from(state);
  const b = Buffer.from(tx.state);
  const stateOk = a.length === b.length && timingSafeEqual(a, b);
  if (!stateOk) {
    return NextResponse.redirect(loginUrl("state_mismatch", tx.redirectTo));
  }

  try {
    const session = await exchangeCodeForTokens(code, tx.codeVerifier);
    await writeSession(session);
  } catch {
    return NextResponse.redirect(loginUrl("exchange_failed", tx.redirectTo));
  }

  const target = tx.redirectTo.startsWith("/") ? tx.redirectTo : "/account";
  return NextResponse.redirect(new URL(target, request.url));
}
