import { NextResponse } from "next/server";

import { isSignedIn } from "@/lib/shopify/guard";

/**
 * Lightweight sign-in probe for client components (header account icon).
 * Returns whether a valid Customer Account session cookie exists — never any
 * personal data.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const signedIn = await isSignedIn();
  return NextResponse.json({ signedIn });
}
