/**
 * Shopify configuration, loaded from environment variables.
 *
 * Every Shopify call is proxied server-side — no token is ever exposed to the
 * browser. Missing credentials degrade gracefully: storefront + customer
 * account features report "not configured" instead of throwing at build time.
 */

export type ShopifyConfig = {
  storeDomain: string;
  apiVersion: string;
  storefrontToken: string;
  /** Legacy static custom-app token (`shpat_…`) — mutually exclusive with the client-credentials pair. */
  adminToken: string | null;
  adminClientId: string | null;
  adminClientSecret: string | null;
  customerAccountShopId: string;
  customerAccountClientId: string;
  siteUrl: string;
  sessionSecret: string;
};

function env(name: string, fallback = ""): string {
  const value = process.env[name] ?? fallback;
  return value.trim();
}

export function shopifyConfig(): ShopifyConfig {
  const storeDomain = env("SHOPIFY_STORE_DOMAIN")
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");
  return {
    storeDomain,
    apiVersion: env("SHOPIFY_API_VERSION", "2025-10"),
    storefrontToken: env("SHOPIFY_STOREFRONT_API_TOKEN"),
    adminToken: env("SHOPIFY_ADMIN_API_TOKEN") || null,
    adminClientId: env("SHOPIFY_ADMIN_CLIENT_ID") || null,
    adminClientSecret: env("SHOPIFY_ADMIN_CLIENT_SECRET") || null,
    customerAccountShopId: env("SHOPIFY_CUSTOMER_ACCOUNT_SHOP_ID"),
    customerAccountClientId: env("SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID"),
    siteUrl: env("NEXT_PUBLIC_SITE_URL", "http://localhost:3000").replace(/\/+$/, ""),
    sessionSecret: env("SESSION_SECRET"),
  };
}

export function isStorefrontConfigured(cfg: ShopifyConfig = shopifyConfig()): boolean {
  return Boolean(cfg.storeDomain && cfg.storefrontToken);
}

export function isCustomerAccountConfigured(cfg: ShopifyConfig = shopifyConfig()): boolean {
  return Boolean(
    cfg.storeDomain &&
      cfg.customerAccountShopId &&
      cfg.customerAccountClientId &&
      cfg.sessionSecret,
  );
}

export function isAdminConfigured(cfg: ShopifyConfig = shopifyConfig()): boolean {
  return Boolean(
    cfg.storeDomain && (cfg.adminToken || (cfg.adminClientId && cfg.adminClientSecret)),
  );
}

/* ── Endpoints ─────────────────────────────────────────────────────────── */

export function storefrontEndpoint(cfg: ShopifyConfig = shopifyConfig()): string {
  return `https://${cfg.storeDomain}/api/${cfg.apiVersion}/graphql.json`;
}

export function adminEndpoint(cfg: ShopifyConfig = shopifyConfig()): string {
  return `https://${cfg.storeDomain}/admin/api/${cfg.apiVersion}/graphql.json`;
}

export function customerAccountGraphQLEndpoint(cfg: ShopifyConfig = shopifyConfig()): string {
  return `https://shopify.com/${cfg.customerAccountShopId}/account/customer/api/${cfg.apiVersion}/graphql`;
}

export function customerAccountAuthorizeUrl(cfg: ShopifyConfig = shopifyConfig()): string {
  return `https://shopify.com/authentication/${cfg.customerAccountShopId}/oauth/authorize`;
}

export function customerAccountTokenUrl(cfg: ShopifyConfig = shopifyConfig()): string {
  return `https://shopify.com/authentication/${cfg.customerAccountShopId}/oauth/token`;
}

export function customerAccountLogoutUrl(cfg: ShopifyConfig = shopifyConfig()): string {
  return `https://shopify.com/authentication/${cfg.customerAccountShopId}/logout`;
}
