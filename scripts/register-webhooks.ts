/**
 * `npm run shopify:register-webhooks [callback-url]` — register the webhook
 * subscriptions this site needs with the Shopify Admin API, so they are
 * signed with the custom app's client secret (== SHOPIFY_WEBHOOK_SECRET) and
 * the HMAC checks in `src/app/api/webhooks/**` pass.
 *
 * Why not the admin UI? Admin-UI webhooks auto-generate an invisible HMAC
 * secret that can never be matched by SHOPIFY_WEBHOOK_SECRET. App-created
 * webhooks (this script) are signed with the app's client secret instead —
 * which is exactly what SHOPIFY_WEBHOOK_SECRET is set to in `.env`.
 *
 * Idempotent: it lists what exists, deletes subscriptions for these topics
 * that point somewhere else (a stale tunnel or old domain), then creates what
 * is missing. Topics are the same set the reference project registers.
 *
 * Usage:
 *   npm run shopify:register-webhooks                                    # uses $NEXT_PUBLIC_SITE_URL
 *   npm run shopify:register-webhooks -- --website https://your-site.com
 *   npm run shopify:register-webhooks -- --url=https://your-site.com
 *   npm run shopify:register-webhooks -- --list | --list-scopes | --list-topics
 *   npm run shopify:register-webhooks -- --delete=<webhookSubscriptionId>
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { getAdminToken } from "../src/lib/shopify/admin-token";
import { shopifyConfig } from "../src/lib/shopify/config";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

/* ── minimal .env loader (mirrors scripts/sync-product.ts) ────────────── */
function loadEnv(): Record<string, string> {
  const result: Record<string, string> = {};
  try {
    const text = readFileSync(join(ROOT, ".env"), "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      result[key] = value;
    }
  } catch {
    /* no .env — rely on process env */
  }
  return result;
}

const env = loadEnv();
for (const [key, value] of Object.entries(env)) {
  if (process.env[key] === undefined && value !== undefined)
    process.env[key] = value;
}

/* ── Shopify Admin GraphQL ─────────────────────────────────────────────── */

type WebhookSubscription = {
  id: string;
  callbackUrl: string;
  topic: string;
  format: string;
};

/**
 * Which events this site subscribes to, and the route that handles each:
 *  - ORDERS_PAID      → /api/webhooks/shopify-order-paid (server-side Meta/GA4/TikTok Purchase)
 *  - PRODUCTS_CREATE  → /api/webhooks/products (rebuild the static catalog)
 *  - PRODUCTS_UPDATE  → /api/webhooks/products (rebuild the static catalog)
 */
const WEBHOOK_ENDPOINTS: Record<string, string> = {
  ORDERS_PAID: "/api/webhooks/shopify-order-paid",
  PRODUCTS_CREATE: "/api/webhooks/products",
  PRODUCTS_UPDATE: "/api/webhooks/products",
  PRODUCTS_DELETE: "/api/webhooks/products",
};
const REQUIRED_TOPICS = Object.keys(WEBHOOK_ENDPOINTS);

async function graphql<T>(
  token: string,
  endpoint: string,
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  const body = (await response.json().catch(() => ({}))) as {
    data?: T;
    errors?: Array<{ message?: string; extensions?: { code?: string } }>;
  };
  if (body.errors?.length) {
    const message = body.errors.map((e) => e.message).join("; ");
    const code = body.errors[0]?.extensions?.code;
    throw new Error(`${message}${code ? ` (code: ${code})` : ""}`);
  }
  return body.data as T;
}

async function main() {
  const cfg = shopifyConfig();
  if (!cfg.storeDomain) {
    console.error(
      "✖ SHOPIFY_STORE_DOMAIN is not set (e.g. your-store.myshopify.com)",
    );
    process.exit(1);
  }
  const endpoint = `https://${cfg.storeDomain}/admin/api/${cfg.apiVersion}/graphql.json`;
  const token = await getAdminToken();

  /* --list-topics: introspect the valid WebhookSubscriptionTopic enum values
     for this API version (topics can be renamed/deprecated between versions). */
  if (process.argv.includes("--list-topics")) {
    const type = await graphql<{
      __type: { enumValues: Array<{ name: string }> } | null;
    }>(
      token,
      endpoint,
      /* GraphQL */ `
        query WebhookTopicEnum {
          __type(name: "WebhookSubscriptionTopic") {
            enumValues {
              name
            }
          }
        }
      `,
      {},
    );
    const values = (type.__type?.enumValues ?? [])
      .map((v) => v.name)
      .filter((name) => /ORDER|PAYMENT|PAID/i.test(name))
      .sort();
    console.log(
      `Order-related WebhookSubscriptionTopic values (API ${cfg.apiVersion}):`,
    );
    console.log(values.join("\n"));
    return;
  }

  /* --list-scopes: show the Admin API scopes the token actually has, so a
     "cannot create a webhook subscription with the specified topic" error can
     be diagnosed (order topics need read_orders). */
  if (process.argv.includes("--list-scopes")) {
    const result = await graphql<{
      currentAppInstallation: {
        accessScopes: Array<{ handle: string }>;
      } | null;
    }>(
      token,
      endpoint,
      /* GraphQL */ `
        query AppScopes {
          currentAppInstallation {
            accessScopes {
              handle
            }
          }
        }
      `,
      {},
    );
    const scopes = (result.currentAppInstallation?.accessScopes ?? [])
      .map((s) => s.handle)
      .sort();
    console.log(`Active Admin API scopes (${scopes.length}):`);
    console.log(scopes.join("\n"));
    return;
  }

  /* --list: print every webhook subscription (id / topic / callbackUrl) so
     conflicting subscriptions can be spotted and removed with --delete. */
  if (process.argv.includes("--list")) {
    const result = await graphql<{
      webhookSubscriptions: { edges: Array<{ node: WebhookSubscription }> };
    }>(
      token,
      endpoint,
      /* GraphQL */ `
        query WebhookSubscriptions {
          webhookSubscriptions(first: 250) {
            edges {
              node {
                id
                callbackUrl
                topic
                format
              }
            }
          }
        }
      `,
      {},
    );
    const all = result.webhookSubscriptions?.edges.map((e) => e.node) ?? [];
    console.log(`All webhook subscriptions (${all.length}):`);
    for (const sub of all) {
      console.log(`  • ${sub.id}  [${sub.topic}]  ${sub.callbackUrl}`);
    }
    return;
  }

  /* --delete=<webhookId>: delete a webhook subscription by id (e.g. a stale
     admin-UI one that occupies the address you want to register). */
  const deleteId = process.argv
    .find((arg) => arg.startsWith("--delete="))
    ?.slice("--delete=".length);
  if (deleteId) {
    const result = await graphql<{
      webhookSubscriptionDelete: {
        userErrors?: Array<{ field?: string[]; message?: string }>;
      };
    }>(
      token,
      endpoint,
      /* GraphQL */ `
        mutation WebhookSubscriptionDelete($id: ID!) {
          webhookSubscriptionDelete(id: $id) {
            userErrors {
              field
              message
            }
          }
        }
      `,
      { id: deleteId },
    );
    const errors = result.webhookSubscriptionDelete?.userErrors ?? [];
    if (errors.length > 0) {
      console.error(
        "✖ Could not delete:",
        errors
          .map((e) => `${e.field?.join(".") ?? ""} ${e.message}`.trim())
          .join("; "),
      );
      process.exit(1);
    }
    console.log(`✓ Deleted ${deleteId}`);
    return;
  }

  /* Site URL from `--website https://…` (space or `=`), `--url=…`, the first
     positional argument, or NEXT_PUBLIC_SITE_URL — in that order. */
  const urlEquals = process.argv
    .find((arg) => arg.startsWith("--url="))
    ?.slice("--url=".length);
  const websiteEquals = process.argv
    .find((arg) => arg.startsWith("--website="))
    ?.slice("--website=".length);
  const websiteIndex = process.argv.indexOf("--website");
  const websiteValue =
    websiteIndex !== -1 ? process.argv[websiteIndex + 1] : undefined;
  const positional = process.argv[2];
  const siteUrl = (
    websiteEquals ??
    urlEquals ??
    websiteValue ??
    (positional && !positional.startsWith("--") ? positional : undefined) ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    `https://${cfg.storeDomain}`
  ).replace(/\/+$/, "");

  console.log(
    `\nWebhook subscriptions:\n` +
      REQUIRED_TOPICS.map(
        (topic) => `  • ${topic}  →  ${siteUrl}${WEBHOOK_ENDPOINTS[topic]}`,
      ).join("\n") +
      "\n",
  );
  if (siteUrl.includes("localhost")) {
    console.warn(
      "⚠ Shopify cannot deliver webhooks to localhost. Pass a public URL:\n" +
        "  npm run shopify:register-webhooks -- --website https://your-tunnel.example.com\n",
    );
  }

  /* 1. List what already exists so stale admin-UI subscriptions are visible.
     The `topics` filter on webhookSubscriptions throws if the app lacks access
     to the topic, so list all and filter client-side instead. */
  const existing = await graphql<{
    webhookSubscriptions: { edges: Array<{ node: WebhookSubscription }> };
  }>(
    token,
    endpoint,
    /* GraphQL */ `
      query WebhookSubscriptions {
        webhookSubscriptions(first: 250) {
          edges {
            node {
              id
              callbackUrl
              topic
              format
            }
          }
        }
      }
    `,
    {},
  );

  const all = existing.webhookSubscriptions?.edges.map((e) => e.node) ?? [];
  if (all.length === 0) {
    console.log("  (no webhooks registered)");
  } else {
    for (const sub of all) {
      console.log(`  • [${sub.topic}] ${sub.callbackUrl}`);
    }
  }
  console.log(
    `  ${all.length} subscription(s) currently registered on this store\n`,
  );

  /* 2. SHARED STORE: never prune. Other brands' storefronts on this Shopify
     store subscribe to the same topics with their own callback URLs; deleting
     "stale" subscriptions would silently break them. Remove a genuinely stale
     subscription explicitly with --delete=<id> after checking --list. */
  const deleted = 0;
  const registered = new Set(
    all
      .filter((sub) => sub.callbackUrl === `${siteUrl}${WEBHOOK_ENDPOINTS[sub.topic] ?? ""}`)
      .map((sub) => sub.topic),
  );

  /* 3. Create whatever is missing. An already-registered topic is left alone. */
  let created = 0;
  for (const topic of REQUIRED_TOPICS) {
    if (registered.has(topic)) {
      console.log(`  skip     ${topic} (already registered)`);
      continue;
    }

    const callbackUrl = `${siteUrl}${WEBHOOK_ENDPOINTS[topic]}`;
    const result = await graphql<{
      webhookSubscriptionCreate: {
        userErrors?: Array<{ field?: string[]; message?: string }>;
        webhookSubscription?: WebhookSubscription | null;
      };
    }>(
      token,
      endpoint,
      /* GraphQL */ `
        mutation WebhookSubscriptionCreate(
          $topic: WebhookSubscriptionTopic!
          $callbackUrl: URL!
        ) {
          webhookSubscriptionCreate(
            topic: $topic
            webhookSubscription: { callbackUrl: $callbackUrl, format: JSON }
          ) {
            userErrors {
              field
              message
            }
            webhookSubscription {
              id
              callbackUrl
              topic
              format
            }
          }
        }
      `,
      { topic, callbackUrl },
    );
    const errors = result.webhookSubscriptionCreate?.userErrors ?? [];
    if (errors.length > 0) {
      console.error(
        `  error    ${topic}: ${errors
          .map((e) => `${e.field?.join(".") ?? ""} ${e.message}`.trim())
          .join("; ")}`,
      );
      continue;
    }
    const sub = result.webhookSubscriptionCreate?.webhookSubscription;
    console.log(`  created  ${topic} → ${sub?.callbackUrl ?? callbackUrl}`);
    created += 1;
  }

  console.log(
    `\n${created} created, ${deleted} stale deleted, ${REQUIRED_TOPICS.length - created} already present.`,
  );
  console.log(
    `HMAC note: app-created webhooks are signed with the custom app's client secret, ` +
      `which must equal SHOPIFY_WEBHOOK_SECRET on the server. ` +
      `Current: ${Boolean(process.env.SHOPIFY_WEBHOOK_SECRET) ? "set ✔" : "MISSING ✖"}.`,
  );
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("✖", message);
  if (/access|scope|topic/i.test(message)) {
    console.error(
      "\nThe custom app token lacks access to one of the webhook topics.\n" +
        "Fix: Shopify admin → Settings → Apps and sales channels → Develop apps →\n" +
        "your app → Admin API scopes → add read_orders (Orders) and read_products\n" +
        "(Products) → Save → re-authorize.\n" +
        "Then rerun this script.",
    );
  }
  process.exit(1);
});
