/**
 * Judge.me configuration, loaded from environment variables. Reuses
 * SHOPIFY_STORE_DOMAIN (same store) rather than a second domain var.
 *
 * Never exposed to the browser — every call is server-only (a Server
 * Component or a route handler), same convention as lib/shopify/config.ts.
 * Missing credentials degrade gracefully: the page falls back to the local
 * reviews section is simply omitted.
 */

export type JudgemeConfig = {
  shopDomain: string;
  apiToken: string;
};

function env(name: string, fallback = ""): string {
  return (process.env[name] ?? fallback).trim();
}

export function judgemeConfig(): JudgemeConfig {
  return {
    shopDomain: env("SHOPIFY_STORE_DOMAIN")
      .replace(/^https?:\/\//, "")
      .replace(/\/+$/, ""),
    apiToken: env("JUDGEME_API_TOKEN"),
  };
}

export function isJudgemeConfigured(cfg: JudgemeConfig = judgemeConfig()): boolean {
  return Boolean(cfg.shopDomain && cfg.apiToken);
}

export const JUDGEME_REVIEWS_ENDPOINT = "https://judge.me/api/v1/reviews";
