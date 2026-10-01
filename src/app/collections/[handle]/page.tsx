import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Faq } from "@/components/content/Faq";
import { NewsletterForm } from "@/components/content/NewsletterForm";
import { Icon } from "@/components/ui/Icon";
import { ProductCard } from "@/components/product/ProductCard";
import { JsonLd } from "@/components/seo/JsonLd";
import Image from "next/image";
import { type Crumb } from "@/components/ui/Breadcrumbs";
import { cn } from "@/lib/utils";
import { collectionBySlug, collections } from "@/content/collections";
import { getProducts, storeCurrency } from "@/lib/catalog";
import { buildProductView } from "@/lib/commerce/product-view";
import { breadcrumbSchema, faqSchema, graph } from "@/lib/seo/schema";
import { absoluteUrl } from "@/lib/site";

/** Collections — ISR, refreshed with the catalog tag. LCP: first product image. */
export const revalidate = 3600;

type Props = { params: Promise<{ handle: string }> };

export function generateStaticParams() {
  return collections.map((c) => ({ handle: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const c = collectionBySlug(handle);
  if (!c) return {};
  const all = await getProducts();
  const live =
    c.categories === "*" ||
    all.some((p) => (c.categories as string[]).includes(p.content.category.slug));
  return {
    title: c.seoTitle,
    description: c.description,
    alternates: { canonical: `/collections/${c.slug}` },
    // A launching-soon category is reachable from the menu but kept out of
    // the index until it has products (no thin pages).
    robots: live ? undefined : { index: false, follow: true },
    openGraph: {
      url: `/collections/${c.slug}`,
      title: c.seoTitle,
      description: c.description,
    },
  };
}

export default async function CollectionPage({ params }: Props) {
  const { handle } = await params;
  const collection = collectionBySlug(handle);
  if (!collection) notFound();

  const [all, currency] = await Promise.all([getProducts(), storeCurrency()]);
  const items = all
    .filter(
      (p) =>
        collection.categories === "*" ||
        collection.categories.includes(p.content.category.slug),
    )
    .map((p) => buildProductView(p.record, p.content, currency));
  const suggestions =
    items.length === 0
      ? all.slice(0, 4).map((p) => buildProductView(p.record, p.content, currency))
      : [];

  const siblings =
    collection.group === "all"
      ? collections.filter((c) => c.group !== "all").slice(0, 8)
      : collections.filter((c) => c.group === collection.group);

  const url = `/collections/${collection.slug}`;
  const crumbs: Crumb[] =
    collection.slug === "all"
      ? [{ label: "Home", href: "/" }, { label: "Shop" }]
      : [
          { label: "Home", href: "/" },
          { label: "Shop", href: "/collections/all" },
          { label: collection.title },
        ];

  return (
    <>
      <JsonLd
        data={graph(
          {
            "@type": "CollectionPage",
            "@id": `${absoluteUrl(url)}#collection`,
            name: collection.title,
            description: collection.description,
            url: absoluteUrl(url),
            mainEntity: {
              "@type": "ItemList",
              itemListElement: items.map((p, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: absoluteUrl(p.href),
                name: p.name,
              })),
            },
          },
          breadcrumbSchema(
            crumbs.map((c, i) =>
              i === crumbs.length - 1 ? { ...c, href: url } : c,
            ),
          ),
          ...(collection.faqs ? [faqSchema(collection.faqs)] : []),
        )}
      />

      {/* ── Collection hero: dusk wash, arch photo, sibling categories ── */}
      <section className="px-2 pt-2 sm:px-3" aria-labelledby="collection-title">
        <div className="cloud-wash relative overflow-hidden rounded-media">
          <div className="container-page grid items-center gap-10 py-12 lg:grid-cols-[7fr_4fr] lg:py-16">
            <div>
              <nav aria-label="Breadcrumb" className="text-[0.8rem] text-ink-soft">
                <ol className="flex flex-wrap items-center gap-2">
                  {crumbs.map((c, i) => (
                    <li key={c.label} className="flex items-center gap-2">
                      {c.href ? <Link href={c.href} className="hover:text-ink">{c.label}</Link> : <span aria-current="page" className="text-ink">{c.label}</span>}
                      {i < crumbs.length - 1 && <span aria-hidden="true" className="size-1 rounded-full bg-honey-300" />}
                    </li>
                  ))}
                </ol>
              </nav>
              <p className="eyebrow eyebrow-dot mt-8">
                {collection.group === "all" ? "Everything" : collection.group === "sleep" ? "Sleep" : "Comfort"}
                {items.length > 0 && ` · ${items.length} piece${items.length === 1 ? "" : "s"}`}
              </p>
              <h1 id="collection-title" className="mt-4 font-serif text-display">
                {collection.title}
              </h1>
              <p className="mt-5 max-w-xl text-body-lg text-ink-soft">{collection.intro}</p>
              <ul className="mt-8 flex flex-wrap gap-2">
                {siblings.map((s) => (
                  <li key={s.slug}>
                    <Link
                      href={`/collections/${s.slug}`}
                      aria-current={s.slug === collection.slug ? "page" : undefined}
                      className={cn(
                        "inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-body-sm font-semibold transition-all duration-300",
                        s.slug === collection.slug ? "bg-night-900 text-milk" : "bg-cloud/90 text-ink shadow-soft hover:shadow-float",
                      )}
                    >
                      <Icon name={s.icon} className="size-4" />
                      {s.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative mx-auto hidden w-full max-w-xs lg:block">
              <div aria-hidden="true" className="breathe absolute -top-6 -right-8 size-32 rounded-full bg-[radial-gradient(circle_at_35%_35%,#fffaf0_0%,var(--color-honey-100)_50%,transparent_72%)]" />
              <div className="arch relative grid aspect-3/4 place-items-center overflow-hidden bg-linear-to-b from-dusk-100 to-honey-100 shadow-float">
                {items[0]?.cardImage ? (
                  <Image src={items[0].cardImage.url} alt="" fill sizes="320px" className="object-cover" />
                ) : (
                  <Icon name={collection.icon} className="size-14 text-dusk-500" strokeWidth={1.2} />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container-page pt-12 md:pt-16">
        {items.length > 0 ? (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-12 pb-16 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
            {items.map((p, i) => (
              <li key={p.handle}>
                <ProductCard product={p} priority={i === 0} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mb-14 grid gap-8 overflow-hidden rounded-media bg-linear-to-br from-sage-100 via-sage-50 to-clay-50 p-8 sm:p-12 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-16">
            <div>
              <span className="grid size-16 place-items-center rounded-full bg-porcelain text-sage-600 shadow-soft">
                <Icon name={collection.icon} className="size-7" strokeWidth={1.4} />
              </span>
              <p className="eyebrow eyebrow-dot mt-8">Launching soon</p>
              <h2 className="mt-4 font-serif text-display font-normal">
                {collection.title} <em>are on their way.</em>
              </h2>
              <p className="mt-4 max-w-md text-ink-soft">{collection.description}</p>
              {collection.includes && (
                <ul className="mt-6 flex flex-wrap gap-2">
                  {collection.includes.map((item) => (
                    <li key={item} className="rounded-full bg-porcelain/90 px-3.5 py-1.5 text-body-sm shadow-soft">
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-media bg-porcelain/85 p-6 shadow-float backdrop-blur md:p-8">
              <p className="font-serif text-heading-2">Be first to know.</p>
              <p className="mt-2 mb-5 text-body-sm text-ink-soft">
                Join the Cozy List and we&apos;ll email you the day they launch.
              </p>
              <NewsletterForm compact />
            </div>
          </div>
        )}

        {items.length === 0 && suggestions.length > 0 && (
          <div className="pb-14">
            <h2 className="eyebrow eyebrow-dot">In the meantime</h2>
            <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
              {suggestions.map((p) => (
                <li key={p.handle}>
                  <ProductCard product={p} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {collection.education && (
        <section className="px-2 sm:px-3" aria-labelledby="edu">
          <div className="night-sky section-y rounded-media text-milk">
            <div className="container-page grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-20">
              <div>
                <p className="eyebrow eyebrow-dot text-honey-200">Good to know</p>
                <h2 id="edu" className="mt-5 font-serif text-display">
                  {collection.education.heading}
                </h2>
              </div>
              <div className="space-y-5 text-body-lg text-moon-100/85 lg:pt-12">
                {collection.education.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {collection.faqs && (
        <section className="section-y" aria-labelledby="c-faq">
          <div className="container-page grid gap-10 lg:grid-cols-[4fr_8fr] lg:gap-20">
            <div>
              <p className="eyebrow eyebrow-dot">Questions</p>
              <h2 id="c-faq" className="mt-5 font-serif text-display">
                Asked <em>before bed.</em>
              </h2>
            </div>
            <Faq items={collection.faqs} />
          </div>
        </section>
      )}

      <section className="pb-(--section-y)" aria-labelledby="related">
        <div className="container-page flex flex-wrap items-center gap-3 rounded-media bg-oat p-6 md:p-8">
          <h2 id="related" className="eyebrow eyebrow-dot mr-4">
            From the Sleep Journal
          </h2>
          {collection.related.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-cloud px-5 text-body-sm font-semibold shadow-soft transition-shadow hover:shadow-float"
            >
              {r.label}
              <Icon name="arrow-right" className="size-3.5" />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
