import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Faq } from "@/components/content/Faq";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageHero } from "@/components/content/PageHero";
import { SectionHeading } from "@/components/content/SectionHeading";
import { contentPageBySlug, contentPages, policyPages } from "@/content/pages";
import { products } from "@/content/products";
import { getPolicy } from "@/lib/shopify/policies";
import { ORG_ID, breadcrumbSchema, faqSchema, graph } from "@/lib/seo/schema";
import { absoluteUrl, site } from "@/lib/site";

/**
 * /pages/* — brand pages from the repo (static), legal policies from Shopify
 * (ISR, 1 day), and the FAQ hub assembled from product + policy answers.
 */
export const revalidate = 86400;
export const dynamicParams = false;

type Props = { params: Promise<{ slug: string }> };

const policySlugs = Object.keys(policyPages) as (keyof typeof policyPages)[];

const faqGroups = [
  {
    title: "The Cloud Dreamer Blanket",
    items: products[0]?.faqs.filter((f) => !/return/i.test(f.q)) ?? [],
  },
  {
    title: "Weighted & heated blankets",
    items: [...(products[1]?.faqs ?? []), ...(products[2]?.faqs ?? [])].filter((f) => !/return/i.test(f.q)),
  },
  {
    title: "Orders, delivery and returns",
    items: [
      {
        q: "How long does delivery take?",
        a: `Orders are delivered in ${site.delivery.minDays}–${site.delivery.maxDays} business days with tracking${site.freeShippingThreshold ? `, free on orders over $${site.freeShippingThreshold}` : ""}. Shipping options and costs are shown at checkout.`,
      },
      {
        q: "How do I track my order?",
        a: "You'll get tracking details by email when your order ships. Signed-in customers can also follow it from Your account → Orders.",
      },
      {
        q: "Can I return a product?",
        a: `Yes. Start a return from your order history within ${site.returnWindowDays} days of delivery. Items should be unwashed, unused and in their original condition. EU customers also have a 14-day right to cancel. See the refund policy for full details.`,
      },
      {
        q: "Is checkout secure?",
        a: "Yes. Checkout is handled by Shopify; your card details are processed by Shopify's payment providers and never reach this website.",
      },
      {
        q: "Can I send something as a gift?",
        a: "Yes — add a gift note at checkout and we'll leave the price out of the parcel.",
      },
    ],
  },
];

export function generateStaticParams() {
  return [
    ...contentPages.map((p) => ({ slug: p.slug })),
    ...policySlugs.map((slug) => ({ slug })),
    { slug: "faq" },
  ];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const canonical = `/pages/${slug}`;
  if (slug === "faq") {
    return {
      title: "FAQs — Products, Delivery and Returns",
      description:
        "Answers to common questions about Slumberlush blankets, sizing, care, delivery and returns.",
      alternates: { canonical },
    };
  }
  const page = contentPageBySlug(slug);
  if (page)
    return {
      title: page.title,
      description: page.description,
      alternates: { canonical },
    };
  const policy = policyPages[slug as keyof typeof policyPages];
  if (policy)
    return {
      title: policy.title,
      description: `${site.name} ${policy.title.toLowerCase()}.`,
      alternates: { canonical },
    };
  return {};
}

function PageShell({
  eyebrow,
  title,
  intro,
  crumbLabel,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  crumbLabel: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <PageHero
        crumbs={[{ label: "Home", href: "/" }, { label: crumbLabel }]}
        eyebrow={eyebrow}
        title={title}
        intro={intro}
      />
      <div className="container-page pt-12 pb-20 md:pt-16">
        <div className="mx-auto max-w-4xl">{children}</div>
      </div>
    </>
  );
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const url = `/pages/${slug}`;

  if (slug === "faq") {
    const all = faqGroups.flatMap((g) => g.items);
    return (
      <>
        <JsonLd
          data={graph(
            faqSchema(all),
            breadcrumbSchema([
              { label: "Home", href: "/" },
              { label: "FAQs", href: url },
            ]),
          )}
        />
        <PageShell
          eyebrow="Help"
          title="Frequently asked questions"
          crumbLabel="FAQs"
          intro="Straight answers about our products, delivery and returns. Can't find yours? Email us."
        >
          <div className="grid gap-16">
            {faqGroups.map((g) => (
              <section key={g.title} aria-labelledby={g.title}>
                <h2
                  id={g.title}
                  className="mb-6 text-center font-serif text-heading-1 lg:text-left"
                >
                  {g.title}
                </h2>
                <Faq items={g.items} />
              </section>
            ))}
            <p className="text-center text-ink-soft lg:text-left">
              Still have a question?{" "}
              <a
                href={`mailto:${site.supportEmail}`}
                className="link-underline text-ink"
              >
                {site.supportEmail}
              </a>
            </p>
          </div>
        </PageShell>
      </>
    );
  }

  const page = contentPageBySlug(slug);
  if (page) {
    const mousse = products[0];
    return (
      <>
        <JsonLd
          data={graph(
            {
              "@type": page.schemaType,
              "@id": `${absoluteUrl(url)}#webpage`,
              name: page.title,
              description: page.description,
              url: absoluteUrl(url),
              ...(page.schemaType === "AboutPage"
                ? { about: { "@id": ORG_ID } }
                : {}),
            },
            breadcrumbSchema([
              { label: "Home", href: "/" },
              { label: page.title, href: url },
            ]),
          )}
        />
        <PageShell
          eyebrow={page.eyebrow}
          title={page.title}
          intro={page.intro}
          crumbLabel={page.title}
        >
          <div className="prose-slumberlush">{page.body}</div>
        </PageShell>

        {slug === "about" && mousse && (
          <section className="px-2 pb-20 sm:px-3" aria-labelledby="story">
            <div className="section-y rounded-media bg-cream">
              <div className="container-page grid gap-10 lg:grid-cols-2 lg:gap-20">
                <SectionHeading
                  eyebrow="The idea"
                  title={mousse.story.heading}
                  id="story"
                />
                <div className="space-y-5 text-body-lg text-ink-soft lg:pt-10">
                  {mousse.story.body.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
              </div>
              <div className="container-page mt-16 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {mousse.highlights.map((h, i) => (
                  <div
                    key={h.title}
                    className="flex min-h-56 flex-col rounded-media bg-porcelain p-7 shadow-soft lg:p-8"
                  >
                    <span
                      className="font-serif text-heading-2 text-clay-300 tabular-nums"
                      aria-hidden="true"
                    >
                      0{i + 1}
                    </span>
                    <h3 className="mt-auto pt-8 font-serif text-heading-2">
                      {h.title}
                    </h3>
                    <p className="mt-3 text-body-sm text-ink-soft">{h.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </>
    );
  }

  const policyMeta = policyPages[slug as keyof typeof policyPages];
  if (!policyMeta) notFound();
  const policy = await getPolicy(policyMeta.key);

  return (
    <PageShell
      eyebrow="Legal"
      title={policy?.title ?? policyMeta.title}
      crumbLabel={policyMeta.title}
    >
      {policy ? (
        <div
          className="prose-slumberlush"
          dangerouslySetInnerHTML={{ __html: policy.body }}
        />
      ) : (
        <p className="text-ink-soft">
          This policy is temporarily unavailable. Please email{" "}
          <a href={`mailto:${site.supportEmail}`} className="link-underline">
            {site.supportEmail}
          </a>{" "}
          or{" "}
          <Link href="/pages/contact" className="link-underline">
            contact us
          </Link>
          .
        </p>
      )}
    </PageShell>
  );
}
