import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";

import { Faq } from "@/components/content/Faq";
import { SectionHeading } from "@/components/content/SectionHeading";
import { EditorialBands } from "@/components/product/EditorialBands";
import { ProductAccordion } from "@/components/product/ProductAccordion";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductGallery } from "@/components/product/ProductGallery";
import { PurchaseFeedback } from "@/components/product/PurchaseFeedback";
import { PurchasePanel } from "@/components/product/PurchasePanel";
import {
  ProductVideoShowcase,
  type ShowcaseVideo,
} from "@/components/product/ProductVideoShowcase";
import { ReviewsSection } from "@/components/product/ReviewsSection";
import { SaleCountdown } from "@/components/product/SaleCountdown";
import { SizeVisualizer } from "@/components/product/SizeVisualizer";
import { JsonLd } from "@/components/seo/JsonLd";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Stars } from "@/components/ui/Stars";
import { guides } from "@/content/guides";
import {
  products as productContent,
  productContentByLegacySlug,
} from "@/content/products";
import { demoReviewsFor } from "@/data/reviews";
import { getProductBySlug, getProducts, storeCurrency } from "@/lib/catalog";
import { buildProductView, type ProductView } from "@/lib/commerce/product-view";
import { getProductReviews } from "@/lib/judgeme/reviews";
import { productSchema } from "@/lib/seo/product-schema";
import { breadcrumbSchema, faqSchema, graph, howToSchema } from "@/lib/seo/schema";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Recorded clips per product handle, served from `public/videos/<handle>/`.
 * Products without clips get photo tiles (with a slow drift) built from their
 * own gallery — see `showcaseFor`.
 */
const productVideosByHandle: Record<string, ShowcaseVideo[]> = {};

const CAPTIONS = [
  "Sofa nights",
  "Movie marathon",
  "Sunday reset",
  "Slow mornings",
  "Reading nook",
  "Rainy-day nap",
  "Guest-room ready",
  "Lights out",
  "Weekend in",
  "Cosy corner",
];

/** One still per colour (the colour's second shot when it has one), up to ten. */
function showcaseFor(view: ProductView): ShowcaseVideo[] {
  const recorded = productVideosByHandle[view.handle];
  if (recorded?.length) return recorded;
  const byGroup = new Map<string, string[]>();
  for (const m of view.gallery) {
    if (m.type !== "image") continue;
    const key = m.group ?? "_";
    byGroup.set(key, [...(byGroup.get(key) ?? []), m.url]);
  }
  const stills = [...byGroup.values()].map((urls) => urls[1] ?? urls[0]!);
  const pool = stills.length >= 4 ? stills : view.gallery.flatMap((m) => (m.type === "image" ? [m.url] : []));
  return pool.slice(0, 10).map((poster, i) => ({
    poster,
    alt: `${view.name} at home`,
    caption: CAPTIONS[i % CAPTIONS.length],
  }));
}

/** Keyword → icon for the perk list; first match wins, checkmark otherwise. */
const PERK_ICON_RULES: [pattern: RegExp, icon: IconName][] = [
  [/plush|velvet|soft/i, "cloud"],
  [/stretch|hug|drape/i, "feather"],
  [/size|king|queen|throw/i, "ruler"],
  [/wash/i, "wash"],
  [/weight|heavy/i, "weight"],
  [/warm|heat/i, "thermometer"],
  [/gift|match/i, "gift"],
  [/breath|cool/i, "snowflake"],
];

function perkIcon(perk: string): IconName {
  return PERK_ICON_RULES.find(([pattern]) => pattern.test(perk))?.[1] ?? "check";
}

/**
 * PDP — ISR. Static HTML from the cached catalog; the products/* webhook
 * purges the `catalog` tag so price/availability changes land within seconds.
 * Only the purchase controls, gallery and video row hydrate.
 */
export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return productContent.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  const { content, record } = product;
  const image = record.media.find((m) => m.type === "image");
  return {
    title: content.seo.title,
    description: content.seo.description,
    alternates: { canonical: `/products/${content.slug}` },
    openGraph: {
      type: "website",
      url: `/products/${content.slug}`,
      title: `${record.title} · ${site.name}`,
      description: content.seo.description,
      images:
        image && image.type === "image"
          ? [{ url: `${image.url.split("?")[0]}?width=1200`, alt: record.title }]
          : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    const legacy = productContentByLegacySlug(slug);
    if (legacy) permanentRedirect(`/products/${legacy.slug}`);
    notFound();
  }

  const { content, record } = product;
  const [currency, verifiedReviews, all] = await Promise.all([
    storeCurrency(),
    getProductReviews(record.handle),
    getProducts(),
  ]);
  const view = buildProductView(record, content, currency);

  /*
   * Two review sources, deliberately kept apart:
   *  - `verifiedReviews` — Judge.me, verified buyers only. The only source
   *    allowed anywhere near structured data.
   *  - `ratingLine` — what the page shows; falls back to the placeholder set
   *    in data/reviews.ts while Judge.me has nothing.
   */
  const ratingLine =
    verifiedReviews?.summary ?? demoReviewsFor(record.handle)?.summary ?? null;
  const feedbackReviews = (verifiedReviews ?? demoReviewsFor(record.handle))?.reviews
    .filter((r) => r.rating === 5)
    .slice(0, 5);

  const perks = view.perks.map((text) => ({ icon: perkIcon(text), text }));
  const defaultVariant = view.variants.find((v) => v.id === view.defaultVariantId);
  const initialGroup = view.swatchOptionName
    ? (defaultVariant?.options[view.swatchOptionName] ?? null)
    : null;

  const crumbs = [
    { label: "Home", href: "/" },
    { label: content.category.name, href: `/collections/${content.category.slug}` },
    { label: view.name },
  ];
  const relatedGuides = guides.filter((g) => g.products.includes(content.slug)).slice(0, 3);
  const pairsWith = all
    .filter((p) => p.content.handle !== content.handle)
    .sort(
      (a, b) =>
        Number(a.content.category.slug === content.category.slug) -
        Number(b.content.category.slug === content.category.slug),
    )
    .slice(0, 4)
    .map((p) => buildProductView(p.record, p.content, currency));

  return (
    <>
      <JsonLd
        data={graph(
          productSchema(view, content, verifiedReviews?.summary ?? null),
          breadcrumbSchema(
            crumbs.map((c, i) => (i === crumbs.length - 1 ? { label: c.label, href: view.href } : c)),
          ),
          faqSchema(content.faqs),
          howToSchema(
            `How to care for the ${view.name}`,
            content.steps.map((step) => ({ name: step.title, text: step.body })),
          ),
        )}
      />

      {view.saleEndsAt && <SaleCountdown endsAt={view.saleEndsAt} />}

      {/* ── Above the fold ─────────────────────────────────────────────── */}
      <div className="container-page pt-6 pb-10 md:pt-8 lg:pb-14">
        <nav aria-label="Breadcrumb" className="mb-4 hidden text-[0.78rem] text-ink-soft md:block">
          <ol className="flex items-center gap-1.5">
            {crumbs.map((c, i) => (
              <li key={c.label} className="flex items-center gap-1.5">
                {c.href ? (
                  <Link href={c.href} className="hover:text-ink">
                    {c.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="text-ink">
                    {c.label}
                  </span>
                )}
                {i < crumbs.length - 1 && <Icon name="chevron-right" className="size-3" />}
              </li>
            ))}
          </ol>
        </nav>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
          <ProductGallery
            media={view.gallery}
            productName={view.name}
            fit={content.pdp.galleryFit}
            initialGroup={initialGroup}
          />

          <div className="min-w-0 lg:pt-4">
            {content.pdp.trust && (
              <ul className="mb-5 grid grid-cols-3 gap-3 pb-4 font-ui text-caption text-ink-soft">
                {content.pdp.trust.map((t) => (
                  <li
                    key={t.text}
                    className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-2.5"
                  >
                    <Icon name={t.icon} className="size-5 shrink-0 text-sage-600" />
                    {t.text}
                  </li>
                ))}
              </ul>
            )}

            {(() => {
              const hasRating = Boolean(ratingLine && ratingLine.count > 0);
              return (
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
                  {ratingLine && ratingLine.count > 0 && (
                    <a
                      href="#reviews"
                      className="group flex min-w-0 flex-col justify-center gap-1 rounded-2xl bg-paper px-3 py-2.5 font-ui shadow-soft transition-shadow duration-300 hover:shadow-float sm:flex-row sm:items-center sm:gap-2 sm:rounded-pill sm:py-2 sm:pr-3.5 sm:pl-3"
                      aria-label={`Rated ${ratingLine.average.toFixed(1)} out of 5 from ${ratingLine.count.toLocaleString("en-US")} reviews — jump to the reviews`}
                    >
                      <Stars value={ratingLine.average} />
                      <span className="flex items-center gap-1.5 text-[0.8rem] sm:text-body-sm">
                        <span className="font-numeral font-semibold tabular-nums">
                          {ratingLine.average.toFixed(1)}
                        </span>
                        <span className="truncate text-ink-soft">
                          {ratingLine.count.toLocaleString("en-US")} reviews
                        </span>
                        <Icon
                          name="chevron-down"
                          className="hidden size-3.5 shrink-0 text-ink-faint transition-transform duration-300 group-hover:translate-y-0.5 sm:block"
                        />
                      </span>
                    </a>
                  )}
                  <Link
                    href="/pages/shipping"
                    className={cn(
                      "flex min-w-0 items-center gap-2.5 rounded-2xl bg-paper px-3 py-2.5 font-ui shadow-soft transition-shadow duration-300 hover:shadow-float sm:rounded-pill sm:py-2 sm:pr-3.5 sm:pl-3",
                      !hasRating && "col-span-2",
                    )}
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sage-100 sm:size-auto sm:bg-transparent">
                      <Icon name="truck" className="size-4 text-sage-700" />
                    </span>
                    <span className="min-w-0 text-[0.8rem] leading-tight font-medium sm:text-body-sm">
                      {site.freeShippingThreshold
                        ? `Free shipping over $${site.freeShippingThreshold}`
                        : "Tracked delivery"}
                    </span>
                  </Link>
                </div>
              );
            })()}

            <h1 className="mt-4 font-title text-heading-1 font-medium">{view.name}</h1>
            <p className="mt-2 text-body text-ink-soft">{content.benefitLine}</p>

            {perks.length > 0 && (
              <ul
                className={cn(
                  "mt-5 grid grid-cols-1 gap-x-4 gap-y-2",
                  !content.pdp.perksOneColumn && "sm:grid-cols-2",
                )}
              >
                {perks.map((perk) => (
                  <li key={perk.text} className="flex items-start gap-2.5 text-body-sm">
                    <Icon name={perk.icon} className="mt-0.5 size-4 shrink-0 text-sage-600" />
                    {perk.text}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-8">
              <PurchasePanel view={view} packs={content.pdp.packs} />
              {feedbackReviews && feedbackReviews.length > 0 && (
                <PurchaseFeedback reviews={feedbackReviews} className="mt-5" />
              )}
            </div>

            <ProductAccordion
              items={[
                ...(content.sizeGuide
                  ? [
                      {
                        title: "Size guide",
                        body: (
                          <ul className="flex flex-col gap-1.5">
                            {content.sizeGuide.map((s) => (
                              <li key={s.size}>
                                <strong className="font-medium text-ink">{s.size}:</strong> {s.dimensions}
                                {s.weight ? ` · ${s.weight}` : ""} — {s.bestFor}
                              </li>
                            ))}
                          </ul>
                        ),
                      },
                    ]
                  : []),
                {
                  title: "Fabric & care",
                  body: (
                    <>
                      <ul className="flex flex-col gap-1.5">
                        {content.materials.map((m) => (
                          <li key={m.name}>
                            <strong className="font-medium text-ink">{m.name}:</strong> {m.detail}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2">
                        {content.care.do.join(" · ")}. Don&apos;t: {content.care.dont.join(", ").toLowerCase()}.
                      </p>
                    </>
                  ),
                },
                {
                  title: "Shipping & returns",
                  body: (
                    <>
                      <p>
                        Tracked delivery in {site.delivery.minDays}–{site.delivery.maxDays} business days
                        {site.freeShippingThreshold
                          ? `, free on orders over $${site.freeShippingThreshold}`
                          : ""}
                        .
                      </p>
                      <p className="mt-2">
                        Not quite right? Return it within {site.returnWindowDays} days of delivery.
                      </p>
                    </>
                  ),
                },
              ]}
            />

            <ul className="mt-6 space-y-3.5 rounded-card bg-cream/80 p-5 text-body-sm md:p-6">
              <li className="flex gap-3">
                <Icon name="truck" className="size-5 shrink-0" />
                <span>
                  Tracked delivery in {site.delivery.minDays}–{site.delivery.maxDays} days.{" "}
                  <Link href="/pages/shipping" className="link-underline">
                    Shipping details
                  </Link>
                </span>
              </li>
              <li className="flex gap-3">
                <Icon name="refresh" className="size-5 shrink-0" />
                <span>
                  {site.returnWindowDays}-day easy returns.{" "}
                  <Link href="/pages/refund-policy" className="link-underline">
                    Return policy
                  </Link>
                </span>
              </li>
              <li className="flex gap-3">
                <Icon name="shield" className="size-5 shrink-0" />
                <span>Secure checkout by Shopify.</span>
              </li>
            </ul>

            <aside
              className="mt-3 flex gap-3 rounded-card bg-clay-100 p-5 text-body-sm"
              aria-label="Good to know"
            >
              <Icon name="info" className="mt-0.5 size-5 shrink-0 text-clay-600" />
              <p>
                <strong className="font-semibold">{content.pdp.notice.lead}</strong>{" "}
                {content.pdp.notice.text}{" "}
                <a href={content.sizeGuide ? "#size-guide" : "#care"} className="link-underline">
                  {content.sizeGuide ? "See the size guide" : "Care guide"}
                </a>
              </p>
            </aside>
          </div>
        </div>
      </div>

      {/* ── Real homes (video carousel) ───────────────────────────────── */}
      <section className="py-12 lg:py-16" aria-labelledby="videos">
        <div className="container-page">
          <SectionHeading
            eyebrow="#SlumberlushAtHome"
            title="See it in real homes."
            id="videos"
            size="heading"
            align="center"
            titleClassName="font-pdp-heading font-semibold"
            intro={content.pdp.videosIntro ?? `How the ${view.name} looks and feels in everyday life.`}
          />
        </div>
        <ProductVideoShowcase videos={showcaseFor(view)} className="mt-8 px-2 sm:px-3" />
      </section>

      {/* ── Evening ritual + fabric ───────────────────────────────────── */}
      <EditorialBands content={content} view={view} />

      {/* ── Why it feels this good (Shopify feature highlights) ───────── */}
      {view.featureHighlights.length > 0 && (
        <section className="section-y" aria-labelledby="highlights">
          <div className="container-page">
            <div className="mx-auto max-w-2xl text-center">
              <p className="eyebrow eyebrow-dot justify-center">The details</p>
              <h2 id="highlights" className="mt-5 font-serif text-display">
                Why it feels <em>this good.</em>
              </h2>
            </div>
            <div className="mt-16 flex flex-col gap-16 lg:gap-24">
              {view.featureHighlights.map((h, i) => (
                <div key={h.label} className="reveal grid items-center gap-8 lg:grid-cols-2 lg:gap-24">
                  <div className={cn(i % 2 === 0 && "lg:order-2")}>
                    <span className="font-serif text-heading-1 text-honey-500 italic tabular-nums">0{i + 1}</span>
                    <p className="mt-4 font-serif text-heading-1">{h.label}</p>
                    <p className="mt-4 max-w-[46ch] text-body-lg text-ink-soft">{h.body}</p>
                  </div>
                  {h.image && (
                    <div className={cn("arch relative mx-auto aspect-4/5 w-full max-w-md overflow-hidden shadow-float", i % 2 === 0 && "lg:order-1")}>
                      <Image src={h.image} alt={h.label} fill sizes="(min-width: 1024px) 448px, 90vw" className="object-cover" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Size guide — to scale ─────────────────────────────────────── */}
      {content.sizeGuide && (
        <section id="size-guide" className="px-2 sm:px-3" aria-labelledby="size-title">
          <div className="section-y rounded-media bg-dusk-50">
            <div className="container-page">
              <div className="mb-12 grid gap-6 lg:grid-cols-[5fr_7fr] lg:items-end lg:gap-14">
                <div>
                  <p className="eyebrow eyebrow-dot">Find your size</p>
                  <h2 id="size-title" className="mt-5 font-serif text-display">
                    See it on <em>your bed.</em>
                  </h2>
                </div>
                <p className="max-w-xl text-body-lg text-ink-soft">
                  Pick a blanket size and your bed — we&apos;ll draw it to scale, so you know exactly how it
                  drapes before it arrives.
                </p>
              </div>
              <SizeVisualizer
                sizes={content.sizeGuide.map((s) => ({
                  key: s.short.toLowerCase(),
                  label: s.short,
                  width: s.inches[0],
                  length: s.inches[1],
                  weight: s.weight,
                }))}
              />
              <dl className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {content.sizeGuide.map((s) => (
                  <div key={s.size} className="rounded-[26px] bg-cloud p-6 shadow-soft">
                    <dt className="font-serif text-heading-2">{s.short}</dt>
                    <dd className="mt-2 text-body-sm">
                      <span className="block font-bold tabular-nums">{s.dimensions}</span>
                      {s.weight && <span className="block text-ink-soft">{s.weight}</span>}
                      <span className="mt-2 block text-ink-soft">{s.bestFor}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>
      )}

      {/* ── Care, as a ritual ─────────────────────────────────────────── */}
      <section id="care" className="section-y" aria-labelledby="care-title">
        <div className="container-page grid gap-12 lg:grid-cols-[5fr_7fr] lg:gap-20">
          <div className="lg:sticky lg:top-[calc(var(--header-h)+3rem)] lg:self-start">
            <p className="eyebrow eyebrow-dot">Care</p>
            <h2 id="care-title" className="mt-5 font-serif text-display">
              {content.pdp.howTo.heading}
            </h2>
            <p className="mt-5 max-w-md text-body-lg text-ink-soft">
              {content.pdp.howTo.intro}
              {content.pdp.howTo.guide && (
                <>
                  {" "}
                  <Link href={content.pdp.howTo.guide.href} className="link-underline text-ink">
                    Read the full guide
                  </Link>
                  .
                </>
              )}
            </p>
            <div className="mt-8 grid max-w-md grid-cols-2 gap-3 text-body-sm">
              <div className="rounded-[24px] bg-dusk-50 p-5">
                <p className="flex items-center gap-2 font-bold text-success">
                  <Icon name="check" className="size-4" /> Do
                </p>
                <ul className="mt-3 space-y-1.5 text-ink-soft">
                  {content.care.do.map((u) => (
                    <li key={u}>{u}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[24px] bg-honey-50 p-5">
                <p className="flex items-center gap-2 font-bold text-error">
                  <Icon name="close" className="size-4" /> Don&apos;t
                </p>
                <ul className="mt-3 space-y-1.5 text-ink-soft">
                  {content.care.dont.map((u) => (
                    <li key={u}>{u}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <ol className="relative flex flex-col gap-4">
            <span aria-hidden="true" className="absolute top-8 bottom-8 left-[1.9rem] border-l border-dashed border-dusk-300" />
            {content.steps.map((step, i) => (
              <li key={step.title} className="reveal relative flex gap-6 rounded-[28px] bg-cloud p-6 shadow-soft sm:p-7">
                <span
                  aria-hidden="true"
                  className="relative z-10 grid size-12 shrink-0 place-items-center rounded-full bg-night-900 font-serif text-heading-3 text-honey-200 italic tabular-nums"
                >
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-serif text-heading-2">
                    <span className="sr-only">Step {i + 1}: </span>
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-ink-soft">{step.body}</p>
                </div>
              </li>
            ))}
            <li className="flex gap-3 rounded-[24px] bg-oat p-5 text-body-sm">
              <Icon name="info" className="mt-0.5 size-5 shrink-0 text-dusk-600" />
              {content.care.note}
            </li>
          </ol>
        </div>
      </section>

      {/* ── Specifications ────────────────────────────────────────────── */}
      <section className="px-2 sm:px-3" aria-labelledby="details">
        <div className="section-y rounded-media bg-oat">
          <div className="container-page grid gap-12 lg:grid-cols-[5fr_7fr] lg:gap-20">
            <div>
              <p className="eyebrow eyebrow-dot">The fine print</p>
              <h2 id="details" className="mt-5 font-serif text-display">
                Specifications.
              </h2>
              <h3 className="mt-10 eyebrow">What&apos;s in the box</h3>
              <ul className="mt-4 space-y-2">
                {content.inTheBox.map((b) => (
                  <li key={b.item} className="flex items-start gap-3 rounded-[20px] bg-cloud p-4 text-body-sm shadow-soft">
                    <Icon name="package" className="size-5 shrink-0 text-honey-500" />
                    <span>
                      <span className="block font-bold">{b.item}</span>
                      <span className="text-ink-soft">{b.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <dl className="divide-y divide-sand self-start rounded-[28px] bg-cloud px-6 shadow-soft sm:px-8">
              {(view.specs.length ? view.specs : content.specs).map((s) => (
                <div key={s.label} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 py-4 text-body-sm">
                  <dt className="font-bold">{s.label}</dt>
                  <dd className="text-ink-soft">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ── Reviews ───────────────────────────────────────────────────── */}
      <section className="section-y" aria-labelledby="reviews">
        <div className="container-page">
          <div className="mb-10 text-center">
            <p className="eyebrow eyebrow-dot justify-center">Notes on the nightstand</p>
            <h2 id="reviews" className="mt-5 font-serif text-display">
              Reviews
            </h2>
          </div>
          <ReviewsSection data={verifiedReviews} handle={view.handle} />
        </div>
      </section>

      {/* ── FAQ — after dark ──────────────────────────────────────────── */}
      <section className="px-2 sm:px-3" aria-labelledby="faq">
        <div className="night-sky section-y rounded-media text-milk">
          <div className="container-page grid gap-12 lg:grid-cols-[4fr_8fr] lg:gap-20">
            <div>
              <p className="eyebrow eyebrow-dot text-honey-200">Questions</p>
              <h2 id="faq" className="mt-5 font-serif text-display">
                Before you <em className="text-honey-200">sleep on it.</em>
              </h2>
              <p className="mt-5 text-moon-100/80">
                Didn&apos;t find your answer?{" "}
                <a href={`mailto:${site.supportEmail}`} className="link-underline text-milk">
                  {site.supportEmail}
                </a>
              </p>
            </div>
            <div className="rounded-media bg-cloud p-4 text-ink sm:p-6">
              <Faq items={content.faqs} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Complete the cozy ─────────────────────────────────────────── */}
      {pairsWith.length > 0 && (
        <section className="section-y" aria-labelledby="pairs">
          <div className="container-page">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="eyebrow eyebrow-dot">Complete the cozy</p>
                <h2 id="pairs" className="mt-5 font-serif text-display">
                  Pairs <em>beautifully</em> with.
                </h2>
              </div>
              <Link href="/collections/all" className="btn-secondary">
                Shop everything
              </Link>
            </div>
            <ul className="mt-12 grid grid-cols-2 gap-x-4 gap-y-12 lg:grid-cols-4 lg:gap-x-6">
              {pairsWith.map((p) => (
                <li key={p.handle}>
                  <ProductCard product={p} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── Sleep Journal ─────────────────────────────────────────────── */}
      {relatedGuides.length > 0 && (
        <section className="pb-(--section-y)" aria-labelledby="learn">
          <div className="container-page">
            <p className="eyebrow eyebrow-dot">The Sleep Journal</p>
            <h2 id="learn" className="mt-5 font-serif text-heading-1">
              Reading for <em>before bed.</em>
            </h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-3">
              {relatedGuides.map((g) => (
                <li key={g.slug}>
                  <Link
                    href={`/guides/${g.slug}`}
                    className="group block h-full rounded-[28px] bg-cloud p-7 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-float"
                  >
                    <p className="text-[0.72rem] font-bold tracking-[0.16em] text-honey-600 uppercase">
                      {g.topic} · {g.readingMinutes} min
                    </p>
                    <h3 className="mt-4 font-serif text-heading-2">{g.title}</h3>
                    <p className="mt-2 text-body-sm text-ink-soft">{g.description}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
