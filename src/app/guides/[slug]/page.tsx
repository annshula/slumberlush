import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Faq } from "@/components/content/Faq";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Icon } from "@/components/ui/Icon";
import { guideBySlug, guides, type GuideBlock } from "@/content/guides";
import { productContentBySlug } from "@/content/products";
import { ORG_ID, breadcrumbSchema, faqSchema, graph } from "@/lib/seo/schema";
import { absoluteUrl, site } from "@/lib/site";

/** Guides — static (content in repo). LCP: the H1. */
export const dynamicParams = false;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const g = guideBySlug(slug);
  if (!g) return {};
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: `/guides/${g.slug}` },
    openGraph: {
      type: "article",
      url: `/guides/${g.slug}`,
      title: g.title,
      description: g.description,
      publishedTime: g.published,
      modifiedTime: g.updated,
    },
  };
}

function Block({ block }: { block: GuideBlock }) {
  switch (block.type) {
    case "p":
      return <p>{block.text}</p>;
    case "ul":
      return (
        <ul>
          {block.items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol>
          {block.items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ol>
      );
    case "note":
      return (
        <aside
          role="note"
          className="flex gap-3 rounded-card bg-clay-100 p-6 text-body"
        >
          <Icon name="info" className="mt-0.5 size-5 shrink-0 text-clay-600" />
          <span>
            <strong className="font-semibold">{block.title}. </strong>
            {block.text}
          </span>
        </aside>
      );
  }
}

const toId = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = guideBySlug(slug);
  if (!guide) notFound();

  const url = `/guides/${guide.slug}`;
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Guides", href: "/guides" },
    { label: guide.title },
  ];
  const featured = guide.products.map(productContentBySlug).filter(Boolean);
  const related = guide.related.map(guideBySlug).filter(Boolean);

  return (
    <article>
      <JsonLd
        data={graph(
          {
            "@type": "Article",
            "@id": `${absoluteUrl(url)}#article`,
            headline: guide.title,
            description: guide.description,
            datePublished: guide.published,
            dateModified: guide.updated,
            author: {
              "@type": "Organization",
              name: `${site.name} Editorial`,
              url: site.url,
            },
            publisher: { "@id": ORG_ID },
            mainEntityOfPage: absoluteUrl(url),
            inLanguage: "en",
          },
          breadcrumbSchema(
            crumbs.map((c, i) => (i === 2 ? { ...c, href: url } : c)),
          ),
          ...(guide.faqs ? [faqSchema(guide.faqs)] : []),
        )}
      />

      <header className="container-page pt-6 md:pt-10">
        <Breadcrumbs items={crumbs} />
        <div className="mx-auto mt-10 max-w-3xl text-center lg:mx-0 lg:text-left">
          <p className="eyebrow eyebrow-dot">
            {guide.topic} · {guide.readingMinutes} min read
          </p>
          <h1 className="mt-5 font-serif text-heading-1 font-normal">
            {guide.title}
          </h1>
          <p className="mt-4 text-body-sm text-ink-soft">
            By the {site.name} editorial team · Updated{" "}
            <time dateTime={guide.updated}>
              {new Date(guide.updated).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </p>
        </div>
      </header>

      <div className="container-page grid gap-12 py-12 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-20 lg:py-16">
        <div className="min-w-0">
          <section
            aria-label="Summary"
            className="max-w-[68ch] rounded-media bg-sage-100 p-7 text-body-lg md:p-9"
          >
            <p className="eyebrow mb-2">The short answer</p>
            <p>{guide.summary}</p>
          </section>

          <div className="prose-slumberlush mt-10">
            {guide.sections.map((section) => (
              <section
                key={section.heading}
                aria-labelledby={toId(section.heading)}
              >
                <h2 id={toId(section.heading)}>{section.heading}</h2>
                {section.blocks.map((block, i) => (
                  <Block key={i} block={block} />
                ))}
              </section>
            ))}
          </div>

          {guide.faqs && (
            <section className="mt-16 max-w-[68ch]" aria-labelledby="guide-faq">
              <h2
                id="guide-faq"
                className="mb-6 text-center font-serif text-heading-2 lg:text-left"
              >
                Quick questions
              </h2>
              <Faq items={guide.faqs} />
            </section>
          )}

          <p className="mt-12 max-w-[68ch] text-body-sm text-ink-soft">
            This guide is general information, not medical advice. Always follow
            the directions on your product&apos;s pack, and speak to a doctor or
            pharmacist about any skin concern.
          </p>
        </div>

        <aside className="space-y-10 lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
          <nav aria-label="On this page">
            <p className="eyebrow">On this page</p>
            <ul className="mt-3 space-y-2 text-body-sm">
              {guide.sections.map((s) => (
                <li key={s.heading}>
                  <a
                    href={`#${toId(s.heading)}`}
                    className="text-ink-soft hover:text-ink hover:underline"
                  >
                    {s.heading}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          {featured.length > 0 && (
            <div>
              <p className="eyebrow">Products in this guide</p>
              <ul className="mt-3 space-y-2">
                {featured.map((p) => (
                  <li key={p!.slug}>
                    <Link
                      href={`/products/${p!.slug}`}
                      className="block rounded-card bg-porcelain p-5 shadow-soft transition-shadow hover:shadow-float"
                    >
                      <span className="block font-medium">{p!.name}</span>
                      <span className="text-body-sm text-ink-soft">
                        {p!.format}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>

      {related.length > 0 && (
        <section className="px-2 pb-3 sm:px-3" aria-labelledby="related-guides">
          <div className="section-y rounded-media bg-cream">
            <div className="container-page">
              <h2
                id="related-guides"
                className="text-center font-serif text-heading-1 lg:text-left"
              >
                Keep reading
              </h2>
              <ul className="mt-10 grid gap-3 md:grid-cols-3">
                {related.map((g) => (
                  <li key={g!.slug}>
                    <Link
                      href={`/guides/${g!.slug}`}
                      className="group block h-full rounded-media bg-porcelain p-7 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-float lg:p-8"
                    >
                      <p className="eyebrow">{g!.topic}</p>
                      <h3 className="mt-3 font-serif text-heading-2 group-hover:underline">
                        {g!.title}
                      </h3>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
