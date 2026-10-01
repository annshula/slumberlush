/**
 * Encrypted server-side cookies (AES-256-GCM) for the Shopify session,
 * the OAuth handshake, and the Storefront cart id.
 *
 * The cart id is encrypted rather than merely httpOnly because a Shopify cart
 * GID embeds its own access token (`gid://shopify/Cart/<id>?key=<token>`),
 * which Shopify only enforces on mutations — making the id itself unforgeable
 * keeps it tamper-proof in transit.
 */

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";

import { shopifyConfig } from "@/lib/shopify/config";

const IV_LENGTH = 12;
const TAG_LENGTH = 16;

export const SESSION_COOKIE = "_bl_session";
export const OAUTH_STATE_COOKIE = "_bl_oauth";
export const CART_COOKIE = "_bl_cart";

function keyFrom(secret: string): Buffer {
  return createHash("sha256").update(secret).digest();
}

/** base64url of `iv (12) + authTag (16) + ciphertext`. */
export function encryptJson<T>(value: T, secret: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", keyFrom(secret), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString("base64url");
}

/** Reverses `encryptJson`. Returns `null` on any tamper / truncation / key rotation. */
export function decryptJson<T>(payload: string, secret: string): T | null {
  try {
    const raw = Buffer.from(payload, "base64url");
    if (raw.length < IV_LENGTH + TAG_LENGTH + 1) return null;
    const iv = raw.subarray(0, IV_LENGTH);
    const tag = raw.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const ciphertext = raw.subarray(IV_LENGTH + TAG_LENGTH);
    const decipher = createDecipheriv("aes-256-gcm", keyFrom(secret), iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return JSON.parse(plain.toString("utf8")) as T;
  } catch {
    return null;
  }
}

function secret(): string {
  return shopifyConfig().sessionSecret;
}

export type SetCookieOptions = {
  maxAgeSeconds: number;
};

function cookieOptions(maxAgeSeconds: number) {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

/* ── Typed cookie wrappers ─────────────────────────────────────────────── */

export async function readEncrypted<T>(name: string): Promise<T | null> {
  const jar = await cookies();
  const value = jar.get(name)?.value;
  if (!value) return null;
  return decryptJson<T>(value, secret());
}

export async function writeEncrypted<T>(
  name: string,
  value: T,
  maxAgeSeconds: number,
): Promise<void> {
  const jar = await cookies();
  const payload = encryptJson(value, secret());
  jar.set(name, payload, cookieOptions(maxAgeSeconds));
}

export async function deleteEncrypted(name: string): Promise<void> {
  const jar = await cookies();
  jar.delete(name);
}

/* ── Domain helpers ────────────────────────────────────────────────────── */

export async function readCartId(): Promise<string | null> {
  return readEncrypted<string>(CART_COOKIE);
}
export async function writeCartId(cartId: string): Promise<void> {
  return writeEncrypted(CART_COOKIE, cartId, 60 * 60 * 24 * 30);
}
export async function clearCartId(): Promise<void> {
  return deleteEncrypted(CART_COOKIE);
}
