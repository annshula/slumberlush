/**
 * One-off: builds a DEMO data/catalog.json from the supplier's public product
 * feed so every page renders before the real Shopify sync has run.
 *
 * It is replaced wholesale the first time `npm run shopify:sync` (or the
 * products webhook) writes the real catalog — the product handles below must
 * match the handles you create in Shopify.
 *
 *   node scripts/seed-demo-catalog.mjs
 */
import fs from "node:fs";

const SOURCE = "https://comfrt.com/products";

/** Slumberlush handle → supplier handle, title, and the colours to keep (first N if omitted). */
const PRODUCTS = [
  {
    handle: "cloud-dreamer-blanket",
    source: "the-dreamer-blanket",
    title: "Cloud Dreamer Blanket",
    productType: "Blanket",
    maxColors: 16,
    perks: [
      "Velvety plush on both sides",
      "Four-way stretch that holds its shape",
      "Four sizes, from throw to king",
      "Stays soft wash after wash",
      "Oversized, drapey weight",
      "Easy to gift, easy to match any room",
    ],
    specs: [
      { label: "Fabric", value: "95% polyester, 5% spandex/elastane" },
      { label: "Feel", value: "Plush and velvety on both sides, four-way stretch" },
      { label: "Medium", value: "50″ × 60″ · approx. 5 lbs" },
      { label: "Large", value: "60″ × 80″ · approx. 7 lbs" },
      { label: "XL (Queen)", value: "90″ × 90″ · approx. 11.5 lbs" },
      { label: "Mega (King)", value: "100″ × 108″ · approx. 15 lbs" },
      { label: "Care", value: "Machine wash cold, hang to dry" },
    ],
    highlights: [
      { label: "Plush that feels the same in every position", body: "Velvety on the inside and the outside, with no rough seams or scratchy edges — whichever way you flip it, it is the soft side." },
      { label: "Four-way stretch, made to hug", body: "The spandex blend moves with you and settles around your shoulders without sagging, bunching or losing its shape." },
      { label: "Comes out of the wash just as soft", body: "Wash cold on its own, hang to dry, then give it a shake. It returns exactly the way you left it." },
    ],
  },
  { handle: "weighted-calm-blanket", source: "cuddlecloud-weighted-blanket", title: "Weighted Calm Blanket", productType: "Weighted Blanket", maxColors: 8 },
  { handle: "ember-heated-blanket", source: "lavender-ember-heated-blanket", title: "Ember Heated Blanket", productType: "Heated Blanket", maxColors: 6 },
  { handle: "dreamday-plush-robe", source: "unisex-dreamday-plush-robe", title: "Dreamday Plush Robe", productType: "Robe", maxColors: 8 },
  { handle: "moonlight-lounge-robe", source: "luna-lounge-robe", title: "Moonlight Lounge Robe", productType: "Robe", maxColors: 6 },
  { handle: "moonlight-pj-set", source: "luna-lounge-pj-set", title: "Moonlight Long Sleeve PJ Set", productType: "Pajamas", maxColors: 8 },
  { handle: "moonlight-sleep-shirt", source: "luna-lounge-sleep-shirt", title: "Moonlight Sleep Shirt", productType: "Pajamas", maxColors: 8 },
  { handle: "cloud-plush-slippers", source: "dreamer-slipper", title: "Cloud Plush Slippers", productType: "Slippers", maxColors: 8 },
  { handle: "crossover-plush-slippers", source: "dreamer-crossover-slipper", title: "Crossover Plush Slippers", productType: "Slippers", maxColors: 8 },
  { handle: "marshmallow-slides", source: "marshmallow-slides", title: "Marshmallow Cloud Slides", productType: "Slides", maxColors: 8 },
  { handle: "cozy-scrunch-socks", source: "scrunch-socks", title: "Cozy Scrunch Socks", productType: "Socks", maxColors: 8 },
];

/* The public .js feed reports prices in hundredths of a cent (970000 → 97.00). */
const money = (raw) => (raw == null ? null : Math.round(raw / 100) / 100);

async function build(p) {
  const res = await fetch(`${SOURCE}/${p.source}.js`, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`${p.source}: ${res.status}`);
  const src = await res.json();

  const colorIdx = src.options.findIndex((o) => /colou?r/i.test(o.name));
  const colorOpt = colorIdx >= 0 ? src.options[colorIdx] : null;
  const keepColors = colorOpt ? colorOpt.values.slice(0, p.maxColors ?? 8) : null;
  const keep = (v) => !keepColors || keepColors.includes(v.options[colorIdx]);

  const options = src.options.map((o, i) => ({
    name: o.name,
    values: i === colorIdx ? keepColors : o.values,
  }));

  const variants = src.variants.filter(keep).map((v) => {
    const price = money(v.price);
    const cmp = money(v.compare_at_price);
    const compareAtPrice = cmp && cmp > price ? cmp : null;
    return {
      id: `gid://shopify/ProductVariant/${v.id}`,
      title: v.title,
      sku: v.sku || null,
      barcode: null,
      price,
      compareAtPrice,
      availableForSale: Boolean(v.available),
      options: Object.fromEntries(src.options.map((o, i) => [o.name, v.options[i]])),
      image: v.featured_image?.src ? v.featured_image.src.replace(/^\/\//, "https://") : null,
      description: null,
      pricesByMarket: { US: { amount: price, compareAtAmount: compareAtPrice, currencyCode: "USD" } },
    };
  });

  const variantByImage = new Map();
  for (const v of src.variants.filter(keep)) {
    const id = v.featured_image?.id;
    if (id && !variantByImage.has(id)) variantByImage.set(id, `gid://shopify/ProductVariant/${v.id}`);
  }

  const keptColorSet = new Set((keepColors ?? []).map((c) => c.toLowerCase()));
  const media = src.media
    .filter((m) => m.media_type === "image")
    // Supplier size-chart graphics carry their branding — our size guide is native HTML.
    .filter((m) => !/size.?chart/i.test(m.src))
    .filter((m) => {
      if (!colorOpt) return true;
      const group = (m.alt ?? "").split(" / ")[0].trim().toLowerCase();
      return !group || keptColorSet.has(group);
    })
    .map((m) => ({
      type: "image",
      url: m.src.replace(/^\/\//, "https://"),
      width: m.width ?? null,
      height: m.height ?? null,
      alt: m.alt ? m.alt.split(" / ")[0].trim() : null,
      variantId: variantByImage.get(m.id) ?? null,
    }));

  const firstImages = media.slice(0, 6).map((m) => m.url);
  const featureHighlights = (p.highlights ?? []).map((h, i) => ({
    label: h.label,
    body: h.body,
    image: firstImages[(i * 2 + 1) % firstImages.length] ?? null,
  }));

  return {
    id: `gid://shopify/Product/${src.id}`,
    handle: p.handle,
    title: p.title,
    vendor: "Slumberlush",
    productType: p.productType,
    status: "ACTIVE",
    updatedAt: new Date().toISOString(),
    seo: { title: null, description: null },
    options,
    availableForSale: variants.some((v) => v.availableForSale),
    variants,
    media,
    specs: (p.specs ?? []).map((s) => ({ ...s, description: null })),
    featureHighlights,
    perks: p.perks ?? [],
    saleEndsAt: null,
  };
}

const products = {};
for (const p of PRODUCTS) {
  try {
    products[p.handle] = await build(p);
    console.log("✓", p.handle, products[p.handle].variants.length, "variants,", products[p.handle].media.length, "images");
  } catch (e) {
    console.error("✗", p.handle, e.message);
  }
}

const doc = {
  version: 6,
  syncedAt: new Date().toISOString(),
  demo: true,
  shop: { domain: "demo.myshopify.com", name: "Slumberlush (demo seed)", currencyCode: "USD" },
  markets: ["US"],
  products,
};
fs.mkdirSync("data", { recursive: true });
fs.writeFileSync("data/catalog.json", JSON.stringify(doc, null, 2));
console.log("wrote data/catalog.json", (JSON.stringify(doc).length / 1024).toFixed(0), "KB");
