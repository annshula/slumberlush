# Slumberlush

A headless Next.js storefront for Slumberlush (beauty and wellness), powered by Shopify. The strategy and architecture are in [docs/blueprint/](docs/blueprint/00-README.md).

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 15.5 App Router, React 19, TypeScript strict |
| Styling | Tailwind CSS v4, with design tokens in `src/app/globals.css` |
| Fonts | Newsreader and Hanken Grotesk: self-hosted variable WOFF2 files, no external requests |
| Commerce | Shopify on the shared Trackify store. Slumberlush products are filtered by handle and product id |
| Catalog | Shopify Admin API → `data/catalog.json` (dev) or private Vercel Blob (prod), refreshed by webhook |
| Cart | Bag kept in the browser. `/api/cart/checkout` creates a Storefront cart server-side and redirects to Shopify Checkout |
| Accounts | Shopify Customer Account API (OAuth + PKCE) with encrypted session cookies |
| Reviews | Judge.me. Only verified buyers are shown, and imported reviews are excluded |
| Analytics | GA4, GTM, Meta, TikTok and Clarity. Each needs its env id, waits for consent where the law requires it, and loads when the page is idle. Purchases are sent server-side from the `orders/paid` webhook |

## Commands

```bash
npm run dev                          # dev server
npm run build && npm start           # production build
npm run typecheck && npm run lint
npm run check:claims                 # fails on banned claim language (pain-free, FDA approved, …)
npm run shopify:sync                 # re-sync every Slumberlush product into the catalog
npm run shopify:register-webhooks -- --website https://belurae.com
```

## Adding a product

1. Create it in Shopify and publish it to the Headless channel.
2. Add an entry to `src/content/products.ts`. This covers the handle, URL slug, copy, directions, safety, FAQs and gallery curation.
3. Run `npm run shopify:sync`. After that, the webhook keeps it current.

Every claim must come from the manufacturer's packaging or documentation. Put anything missing in `contentGaps`. Never fill a gap with a guess.

## Where things live

```
src/app/            routes (pages, API route handlers, sitemap, robots, llms.txt)
src/components/     layout, product, cart, content, analytics, account, ui
src/content/        products, guides, ingredients, collections, pages, navigation (human-edited)
src/lib/catalog/    catalog read model, storage (fs/Blob), cache tags, brand ownership
src/lib/shopify/    Storefront/Admin/Customer Account clients, sync engine, policies
src/lib/commerce/   product view (variant matrix + honest savings), bag catalog
src/lib/seo/        JSON-LD builders
src/middleware.ts   CSP, consent geo cookie, /account guard
```

## Deploy checklist

- Set `NEXT_PUBLIC_SITE_URL` to the Slumberlush domain. The copied `.env` still points at crawlandcuddle.com.
- Link a **private** Vercel Blob store (`BLOB_READ_WRITE_TOKEN`), so webhook syncs persist.
- Unset `META_TEST_EVENT_CODE` in production.
- Run `npm run shopify:register-webhooks -- --website https://<domain>`. The script adds subscriptions and never deletes other brands' subscriptions.
- Add `https://<domain>/account/callback` to the Customer Account API callback URIs in Shopify.
