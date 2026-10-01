"use server";

import { headers } from "next/headers";

import { getAdminToken } from "@/lib/shopify/admin-token";
import { adminEndpoint, isAdminConfigured } from "@/lib/shopify/config";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

/**
 * Newsletter signup → Shopify customer with email-marketing consent, tagged
 * `slumberlush-newsletter` (the store is shared, so the tag keeps Slumberlush's list
 * separable). Server Action: POST-only with Next's built-in origin check.
 * Errors are generic; nothing from Shopify is echoed to the browser.
 */

export type NewsletterState = { status: "idle" | "success" | "error"; message: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TAG = "slumberlush-newsletter";

async function admin<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(adminEndpoint(), {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": await getAdminToken() },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  const body = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (!res.ok || body.errors?.length) throw new Error(body.errors?.[0]?.message ?? `HTTP ${res.status}`);
  return body.data as T;
}

const consent = () => ({
  marketingState: "SUBSCRIBED",
  marketingOptInLevel: "SINGLE_OPT_IN",
  consentUpdatedAt: new Date().toISOString(),
});

export async function subscribeNewsletter(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  // Honeypot: real people never fill the hidden field.
  if (String(formData.get("company") ?? "").length > 0) {
    return { status: "success", message: "Thank you — you're on the list." };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (email.length > 254 || !EMAIL.test(email)) {
    return { status: "error", message: "Please enter a valid email address." };
  }

  const ip = clientIp(await headers());
  if (!rateLimit(`newsletter:${ip}`, 5, 60 * 60_000)) {
    return { status: "error", message: "Too many attempts. Please try again later." };
  }

  if (!isAdminConfigured()) {
    return { status: "error", message: "Signups are temporarily unavailable. Please try again later." };
  }

  try {
    const created = await admin<{
      customerCreate: { customer: { id: string } | null; userErrors: { field: string[] | null; message: string }[] };
    }>(
      `mutation($input: CustomerInput!) { customerCreate(input: $input) { customer { id } userErrors { field message } } }`,
      { input: { email, tags: [TAG], emailMarketingConsent: consent() } },
    );

    if (!created.customerCreate.customer) {
      // Already a customer: find them, then subscribe + tag.
      const found = await admin<{ customers: { nodes: { id: string }[] } }>(
        `query($q: String!) { customers(first: 1, query: $q) { nodes { id } } }`,
        { q: `email:"${email.replace(/"/g, "")}"` },
      );
      const id = found.customers.nodes[0]?.id;
      if (!id) throw new Error("customer lookup failed");
      await admin(
        `mutation($input: CustomerEmailMarketingConsentUpdateInput!) { customerEmailMarketingConsentUpdate(input: $input) { userErrors { message } } }`,
        { input: { customerId: id, emailMarketingConsent: consent() } },
      );
      await admin(`mutation($id: ID!, $tags: [String!]!) { tagsAdd(id: $id, tags: $tags) { userErrors { message } } }`, {
        id,
        tags: [TAG],
      });
    }
    return { status: "success", message: "Thank you — you're on the list." };
  } catch (error) {
    console.error("[newsletter] subscribe failed:", (error as Error).message);
    return { status: "error", message: "Something went wrong. Please try again in a moment." };
  }
}
