import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/seo/JsonLd";
import { PageHero } from "@/components/content/PageHero";
import { guides } from "@/content/guides";
import { breadcrumbSchema, graph } from "@/lib/seo/schema";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sleep Journal — Better Sleep, Bedding Sizes & Blanket Care",
  description:
    "Practical guides to better sleep routines, choosing blanket and weighted-blanket sizes, layering for hot or cold sleepers and caring for plush fabrics.",
  alternates: { canonical: "/guides" },
};

export default function GuidesIndex() {
  const topics = [...new Set(guides.map((g) => g.topic))];
  return (
    <>
      <JsonLd
        data={graph(
          {
            "@type": "CollectionPage",
            name: "Slumberlush Sleep Journal",
            url: absoluteUrl("/guides"),
            mainEntity: {
              "@type": "ItemList",
              itemListElement: guides.map((g, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: absoluteUrl(`/guides/${g.slug}`),
                name: g.title,
              })),
            },
          },
          breadcrumbSchema([
            { label: "Home", href: "/" },
            { label: "Sleep Journal", href: "/guides" },
          ]),
        )}
      />
      <PageHero
        tone="sage"
        crumbs={[{ label: "Home", href: "/" }, { label: "Sleep Journal" }]}
        eyebrow="Sleep Journal"
        title={
          <>
            Notes for <em>softer nights.</em>
          </>
        }
        intro="Practical, unhurried guidance — better wind-downs, the right blanket size, layering for hot and cold sleepers, and keeping plush fabrics soft. No miracle claims; just what helps."
      />
      <div className="container-page pb-20">
        {topics.map((topic) => (
          <section key={topic} className="mt-16" aria-labelledby={`t-${topic}`}>
            <h2
              id={`t-${topic}`}
              className="eyebrow eyebrow-dot flex justify-center lg:justify-start"
            >
              {topic}
            </h2>
            <ul className="mt-6 grid auto-rows-fr gap-3 md:grid-cols-2">
              {guides
                .filter((g) => g.topic === topic)
                .map((g) => (
                  <li key={g.slug}>
                    <Link
                      href={`/guides/${g.slug}`}
                      className="group flex h-full min-h-64 flex-col rounded-media bg-porcelain p-8 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-float"
                    >
                      <span className="self-start rounded-tag bg-cream px-2.5 py-1 text-[0.75rem] text-ink-soft">
                        {g.readingMinutes} min read
                      </span>
                      <span className="mt-10 min-h-[2lh] font-serif text-heading-2">
                        {g.title}
                      </span>
                      <span className="mt-3 text-ink-soft">
                        {g.description}
                      </span>
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
