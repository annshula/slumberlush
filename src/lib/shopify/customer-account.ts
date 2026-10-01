/**
 * Shopify Customer Account API — OAuth 2.0 + PKCE sign-in, session storage and
 * the customer-scoped GraphQL client.
 *
 * The app stores no customer records. Every `customerRequest` call is scoped by
 * the signed-in customer's own access token, so Shopify enforces that a
 * customer can only ever read or mutate their own data.
 */

import { randomBytes } from "crypto";
import { cache } from "react";

import { graphqlRequest } from "@/lib/shopify/client";
import {
  customerAccountGraphQLEndpoint,
  customerAccountTokenUrl,
  customerAccountAuthorizeUrl,
  isCustomerAccountConfigured,
  shopifyConfig,
} from "@/lib/shopify/config";
import {
  OAUTH_STATE_COOKIE,
  SESSION_COOKIE,
  readEncrypted,
  writeEncrypted,
  deleteEncrypted,
} from "@/lib/shopify/session";

const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const OAUTH_MAX_AGE = 60 * 10; // 10 minutes
const REFRESH_SKEW_MS = 60_000; // refresh 60s before expiry

/* ── Types ─────────────────────────────────────────────────────────────── */

export type OAuthTransaction = {
  codeVerifier: string;
  state: string;
  nonce: string;
  redirectTo: string;
};

export type CustomerSession = {
  accessToken: string;
  refreshToken: string | null;
  /** Epoch ms. */
  expiresAt: number;
  idToken: string | null;
  sessionId: string;
  customerId: string | null;
};

export class CustomerAccountError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CustomerAccountError";
  }
}

/* ── base64url / PKCE ──────────────────────────────────────────────────── */

function base64Url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function randomBase64Url(bytes: number): string {
  return base64Url(randomBytes(bytes));
}

export async function createCodeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );
  return base64Url(Buffer.from(digest));
}

/** Only allow same-origin path redirects — blocks `//evil.com` and backslash tricks. */
export function safeReturnTo(input: string | null | undefined): string {
  if (!input) return "/account";
  if (!input.startsWith("/") || input.startsWith("//")) return "/account";
  if (/[\\]/.test(input)) return "/account";
  return input;
}

/* ── OAuth transaction cookie ──────────────────────────────────────────── */

export async function writeOAuthTransaction(
  tx: OAuthTransaction,
): Promise<void> {
  await writeEncrypted(OAUTH_STATE_COOKIE, tx, OAUTH_MAX_AGE);
}

/** Single-use: reads and deletes. */
export async function consumeOAuthTransaction(): Promise<OAuthTransaction | null> {
  const tx = await readEncrypted<OAuthTransaction>(OAUTH_STATE_COOKIE);
  if (tx) await deleteEncrypted(OAUTH_STATE_COOKIE);
  return tx;
}

/* ── Session cookie ────────────────────────────────────────────────────── */

export async function writeSession(session: CustomerSession): Promise<void> {
  await writeEncrypted(SESSION_COOKIE, session, SESSION_MAX_AGE);
}
export async function readSession(): Promise<CustomerSession | null> {
  return readEncrypted<CustomerSession>(SESSION_COOKIE);
}
export async function clearSession(): Promise<void> {
  await deleteEncrypted(SESSION_COOKIE);
}

/* ── Authorize URL ─────────────────────────────────────────────────────── */

export function buildAuthorizeUrl(tx: OAuthTransaction): Promise<string> {
  return createCodeChallenge(tx.codeVerifier).then((challenge) => {
    const cfg = shopifyConfig();
    const params = new URLSearchParams({
      client_id: cfg.customerAccountClientId,
      response_type: "code",
      redirect_uri: `${cfg.siteUrl}/account/callback`,
      scope: "openid email customer-account-api:full",
      state: tx.state,
      nonce: tx.nonce,
      code_challenge: challenge,
      code_challenge_method: "S256",
    });
    return `${customerAccountAuthorizeUrl(cfg)}?${params.toString()}`;
  });
}

export function beginOAuth(redirectTo: string): {
  tx: OAuthTransaction;
  authorizeUrl: Promise<string>;
} {
  const tx: OAuthTransaction = {
    codeVerifier: base64Url(randomBytes(32)).slice(0, 43),
    state: randomBase64Url(24),
    nonce: randomBase64Url(16),
    redirectTo: safeReturnTo(redirectTo),
  };
  return { tx, authorizeUrl: buildAuthorizeUrl(tx) };
}

/* ── Token exchange ────────────────────────────────────────────────────── */

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  id_token?: string;
  error?: string;
  error_description?: string;
};

export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
): Promise<CustomerSession> {
  const cfg = shopifyConfig();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: cfg.customerAccountClientId,
    redirect_uri: `${cfg.siteUrl}/account/callback`,
    code,
    code_verifier: codeVerifier,
  });

  const response = await fetch(customerAccountTokenUrl(cfg), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  });

  // The request body contains the code — never log it.
  const data = (await response.json().catch(() => ({}))) as TokenResponse;

  if (!response.ok || !data.access_token) {
    throw new CustomerAccountError(
      data.error_description ?? data.error ?? "Sign-in exchange failed",
    );
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    idToken: data.id_token ?? null,
    sessionId: randomBytes(16).toString("hex"),
    customerId: null,
  };
}

async function refreshTokens(
  session: CustomerSession,
): Promise<CustomerSession | null> {
  if (!session.refreshToken) return null;
  const cfg = shopifyConfig();
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: cfg.customerAccountClientId,
    refresh_token: session.refreshToken,
  });
  const response = await fetch(customerAccountTokenUrl(cfg), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  });
  const data = (await response.json().catch(() => ({}))) as TokenResponse;
  if (!response.ok || !data.access_token) return null;
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? session.refreshToken,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    idToken: data.id_token ?? session.idToken,
    sessionId: session.sessionId,
    customerId: session.customerId,
  };
}

/**
 * Returns a live session, refreshing it in place when close to expiry.
 *
 * Memoised per request: the layout guard, the page guard and every
 * `customerRequest` all ask for the session while rendering one page. Without
 * this each of them decrypted the cookie again — and on an expiring token each
 * would have fired its own refresh round trip to Shopify, serially, before the
 * page could start fetching anything.
 */
export const getValidSession = cache(
  async (): Promise<CustomerSession | null> => {
    if (!isCustomerAccountConfigured()) return null;
    const session = await readSession();
    if (!session) return null;
    if (session.expiresAt - REFRESH_SKEW_MS > Date.now()) return session;

    const refreshed = await refreshTokens(session);
    if (!refreshed) {
      await persist(clearSession);
      return null;
    }
    await persist(() => writeSession(refreshed));
    return refreshed;
  },
);

/**
 * Saves the session if the current context is allowed to set cookies.
 *
 * A token can fall due mid-render, and Next only permits `cookies().set()` in
 * a Server Action, Route Handler or middleware — so a refresh triggered by a
 * page render would otherwise throw and take the whole page down with it. The
 * refresh itself already succeeded at that point: the new tokens are live and
 * this render uses them. Only writing them back is deferred, to the next
 * request that runs somewhere allowed to write.
 *
 * The cost of that deferral is one extra refresh round trip per read-only
 * render, which Shopify permits — losing the page does not.
 */
async function persist(write: () => Promise<void>): Promise<void> {
  try {
    await write();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("can only be modified in a Server Action")) {
      // Expected on a read-only render — see above.
      return;
    }
    throw error;
  }
}

/* ── Customer-scoped GraphQL client ────────────────────────────────────── */

export async function customerRequest<T>(options: {
  query: string;
  variables?: Record<string, unknown>;
  retries?: number;
}): Promise<T> {
  const session = await getValidSession();
  if (!session)
    throw new CustomerAccountError("You need to sign in to do that.");
  return graphqlRequest<T>({
    endpoint: customerAccountGraphQLEndpoint(),
    query: options.query,
    variables: options.variables,
    bearerToken: session.accessToken,
    timeoutMs: 20_000,
    retries: options.retries ?? 2,
  });
}
