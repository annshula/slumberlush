/**
 * `npm run shopify:test-webhook -- [--url=...] [--bad-hmac] [--repeat=N]`
 *
 * Signs a realistic orders/paid payload with SHOPIFY_WEBHOOK_SECRET and posts
 * it to the webhook endpoint, so the whole path (HMAC → dedupe → Purchase
 * forwarding) can be exercised locally without waiting for a real order.
 *
 * Ported from the Trackify reference (`reference/scripts/test-webhook.ts`).
 */
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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

/* ── numeric ids from the synced catalog, so the line item matches ─────── */
type Catalog = {
  products?: Record<string, { id: string; title: string; variants?: Array<{ id: string }> }>;
};
function numericIds(): { productId: number; variantId: number } {
  try {
    const catalog = JSON.parse(
      readFileSync(join(ROOT, "data", "catalog.json"), "utf8"),
    ) as Catalog;
    const product = Object.values(catalog.products ?? {})[0];
    const productId = Number(product?.id.split("/").pop() ?? 0);
    const variantId = Number(product?.variants?.[0]?.id.split("/").pop() ?? 0);
    return { productId, variantId };
  } catch {
    return { productId: 0, variantId: 0 };
  }
}

type Args = { url: string; badHmac: boolean; repeat: number };
function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const flag = (name: string): string | undefined =>
    argv
      .find((arg) => arg.startsWith(`--${name}=`))
      ?.split("=")
      .slice(1)
      .join("=");
  return {
    url:
      flag("url") ??
      `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/webhooks/shopify-order-paid`,
    badHmac: argv.includes("--bad-hmac"),
    repeat: Number.parseInt(flag("repeat") ?? "1", 10) || 1,
  };
}

function buildOrderPayload(): Record<string, unknown> {
  const { productId, variantId } = numericIds();
  const id = 9000000000000;
  return {
    id,
    name: `#TEST${String(id).slice(-5)}`,
    currency: "USD",
    total_price: "45.99",
    current_total_price: "45.99",
    line_items: [
      {
        id: id + 1,
        product_id: productId || 1234567890123,
        variant_id: variantId || 4567890123456,
        quantity: 1,
        price: "45.99",
        title: "Test order — delete me",
      },
    ],
  };
}

async function main(): Promise<void> {
  const args = parseArgs();
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  const shopDomain = (process.env.SHOPIFY_STORE_DOMAIN || "").replace(
    /^https?:\/\//,
    "",
  );

  if (!secret) {
    console.error(
      "✖ SHOPIFY_WEBHOOK_SECRET is not set in .env — cannot sign a test webhook.",
    );
    process.exit(1);
  }

  console.log(`Test webhook → ${args.url}`);
  if (args.badHmac)
    console.warn("⚠ Sending a deliberately INVALID signature — expect 401");

  const body = JSON.stringify(buildOrderPayload());
  const signature = args.badHmac
    ? Buffer.from("not-a-valid-signature-not-a-valid-sig").toString("base64")
    : createHmac("sha256", secret).update(body, "utf8").digest("base64");

  // A fixed id across repeats is what proves the dedupe cache works.
  const webhookId = "test-webhook-" + Date.now();

  for (let attempt = 1; attempt <= args.repeat; attempt += 1) {
    const started = Date.now();
    let response: Response;
    try {
      response = await fetch(args.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Topic": "orders/paid",
          "X-Shopify-Hmac-Sha256": signature,
          "X-Shopify-Shop-Domain": shopDomain,
          "X-Shopify-Webhook-Id": webhookId,
          "X-Shopify-API-Version": process.env.SHOPIFY_API_VERSION || "2025-10",
        },
        body,
      });
    } catch (error) {
      console.error("✖ Request failed:", (error as Error).message);
      console.error("  Is the dev server running? `npm run dev`");
      process.exit(1);
    }

    const text = await response.text();
    console.log(
      `  ${response.status} in ${Date.now() - started}ms` +
        (args.repeat > 1 ? `  (attempt ${attempt}/${args.repeat})` : ""),
    );
    console.log(`  ${text.slice(0, 400)}`);
  }

  if (args.badHmac) {
    console.log(
      "\nDone — a 401 above means signature verification is working.",
    );
  } else if (args.repeat > 1) {
    console.log(
      "\nDone — the second attempt should be deduped (no new Purchase).",
    );
  } else {
    console.log(
      "\nDone — check Vercel logs / Meta Events Manager for the Purchase.",
    );
  }
}

main().catch((error) => {
  console.error("✖", error instanceof Error ? error.message : error);
  process.exit(1);
});
