/**
 * Auth guards for server components / route handlers.
 */

import { redirect } from "next/navigation";

import { getValidSession } from "@/lib/shopify/customer-account";
import { isCustomerAccountConfigured } from "@/lib/shopify/config";

export async function isSignedIn(): Promise<boolean> {
  if (!isCustomerAccountConfigured()) return false;
  return (await getValidSession()) !== null;
}

/** Redirects to login when there is no live session. Returns the session. */
export async function requireCustomer(returnTo: string) {
  if (!isCustomerAccountConfigured()) {
    redirect("/account/login?error=unconfigured");
  }
  const session = await getValidSession();
  if (!session) {
    redirect(`/account/login?returnTo=${encodeURIComponent(returnTo)}`);
  }
  return session;
}
