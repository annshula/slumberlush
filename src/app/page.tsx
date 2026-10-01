import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Faq } from "@/components/content/Faq";
import { NewsletterForm } from "@/components/content/NewsletterForm";
import { HeroVideo } from "@/components/home/HeroVideo";
import { SleepFinder, type FinderProfile } from "@/components/home/SleepFinder";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductVideoShowcase } from "@/components/product/ProductVideoShowcase";
import { SizeVisualizer } from "@/components/product/SizeVisualizer";
import { JsonLd } from "@/components/seo/JsonLd";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Stars } from "@/components/ui/Stars";
import { collections } from "@/content/collections";
import { guides } from "@/content/guides";
import { productContentByHandle } from "@/content/products";
import { demoHighlights, demoStoreRating } from "@/data/reviews";
import { getProducts, storeCurrency } from "@/lib/catalog";
import {
  buildProductView,
  type ProductView,
} from "@/lib/commerce/product-view";
import { formatMoney } from "@/lib/money";
import { faqSchema, graph } from "@/lib/seo/schema";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Home — "The Hours of Rest". The page reads as one evening: dusk light in
 * the hero, the hours of a wind-down, midnight for the signature product, and
 * dawn in the footer. Static, refreshed through the `catalog` tag. LCP: the
 * hero photo (priority, sized, no JS dependency). Client islands: the Sleep
 * Finder, the size visualizer, the at-home row and the newsletter form.
 */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: {
    absolute: `${site.name} — Soft Blankets, Sleepwear & Cozy Comfort Essentials`,
  },
  description:
    "Cloud-soft plush blankets, weighted blankets, modal sleepwear, plush robes and slippers — for slower evenings and deeper rest. Free shipping over $75, 30-day returns.",
  alternates: { canonical: "/" },
};

const homeFaqs = [
  {
    q: "What is Slumberlush?",
    a: "Slumberlush is a sleep and comfort brand. We make cloud-soft essentials for the bed and the sofa — plush and weighted blankets, modal sleepwear, robes, slippers and more — designed to make evenings at home slower and cosier.",
  },
  {
    q: "What makes the Cloud Dreamer Blanket so soft?",
    a: "It's a dense plush that feels velvety on both sides, with 5% spandex for a four-way stretch, so it drapes and hugs rather than sitting stiffly. It's machine washable and stays soft when washed cold and hung to dry.",
  },
  {
    q: "Which blanket size should I buy?",
    a: "For the sofa, choose the Throw (50″×60″). For a bed, match the mattress — Twin 60″×80″, Queen 90″×90″ or King 100″×108″. Size up if you share or like to cocoon.",
  },
  {
    q: "How long does delivery take?",
    a: `Orders are delivered in ${site.delivery.minDays}–${site.delivery.maxDays} business days with tracking${site.freeShippingThreshold ? `, and shipping is free on orders over $${site.freeShippingThreshold}` : ""}.`,
  },
  {
    q: "What is your return policy?",
    a: `Sleep on it. If something isn't right, return it within ${site.returnWindowDays} days of delivery — start from your order history.`,
  },
  {
    q: "Do you ship internationally?",
    a: "Yes — we ship to most countries with tracked delivery. Prices are shown in your local currency at checkout.",
  },
];

/** A tiny CSS moon in a given phase (0 = new, 1 = full). */
function Moon({ phase, className }: { phase: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block size-7 rounded-full bg-dusk-200", className)}
      style={{
        boxShadow: `inset ${(phase * 28).toFixed(1)}px 0 0 0 var(--color-honey-300)`,
      }}
    />
  );
}

const promises: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "moon",
    title: "Sleep on it",
    body: `${site.returnWindowDays} days to decide. If it isn't your new favourite, send it back.`,
  },
  {
    icon: "truck",
    title: "Free shipping",
    body: `On every order over $${site.freeShippingThreshold ?? 75}, tracked to your door.`,
  },
  {
    icon: "wash",
    title: "Wash-tested softness",
    body: "Made to come out of the wash as soft as it went in.",
  },
  {
    icon: "gift",
    title: "Gift-ready",
    body: "Add a note and we'll leave the price out of the parcel.",
  },
];

export default async function HomePage() {
  const [products, currency] = await Promise.all([
    getProducts(),
    storeCurrency(),
  ]);
  const views = products.map((p) =>
    buildProductView(p.record, p.content, currency),
  );
  const byHandle = (h: string) => views.find((v) => v.handle === h);
  const img = (v: ProductView | undefined, needle: string) => {
    const m = v?.gallery.find(
      (g) => g.type === "image" && g.url.includes(needle),
    );
    return m?.type === "image" ? m.url : (v?.cardImage?.url ?? null);
  };
  const price = (v: ProductView) =>
    `from ${formatMoney(v.fromPrice, v.currency)}`;

  const dreamer = byHandle("cloud-dreamer-blanket");
  const robe = byHandle("dreamday-plush-robe");
  const weighted = byHandle("weighted-calm-blanket");
  const slippers = byHandle("cloud-plush-slippers");

  const heroPhoto = img(dreamer, "1_637adf0c");
  const texturePhoto = img(dreamer, "4_a5732080");
  const chairPhoto = img(dreamer, "3_-_2026-07-22T103154");

  const hours = [
    {
      time: "8:00 pm",
      phase: 0.25,
      title: "Unwind",
      body: "Shower, robe on, phone down. The day is officially over.",
      v: robe,
    },
    {
      time: "9:30 pm",
      phase: 0.5,
      title: "Settle in",
      body: "The sofa, a film, and the softest blanket in the house.",
      v: dreamer,
      image: chairPhoto,
    },
    {
      time: "10:45 pm",
      phase: 1,
      title: "Lights out",
      body: "Buttery pyjamas and a grounding weight. Darkness does the rest.",
      v: weighted,
    },
    {
      time: "7:00 am",
      phase: 0.1,
      title: "Wake slowly",
      body: "Warm feet first. There is no rush this morning.",
      v: slippers,
    },
  ].filter((h): h is typeof h & { v: ProductView } => Boolean(h.v));

  const pick = (...handles: string[]) =>
    handles
      .map(byHandle)
      .filter((v): v is ProductView => Boolean(v))
      .map((v) => ({
        handle: v.handle,
        name: v.name,
        href: v.href,
        image: v.cardImage?.url ?? null,
        price: price(v),
      }));

  const finderAll: FinderProfile[] = [
    {
      id: "cold",
      label: "I always feel cold",
      icon: "snowflake",
      headline: "Warmth you can dial in.",
      tip: "Layer a plush blanket over your duvet, and warm the bed before you get in. Six heat settings and an auto shut-off mean you can drift off without a second thought.",
      products: pick("ember-heated-blanket", "cloud-dreamer-blanket"),
    },
    {
      id: "hot",
      label: "I sleep hot",
      icon: "sun",
      headline: "Breathe-easy layers.",
      tip: "Swap heavy fabrics for breathable modal and keep a light layer within reach to kick off at 2 a.m.",
      products: pick("moonlight-sleep-shirt", "moonlight-lounge-robe"),
    },
    {
      id: "restless",
      label: "My mind won't switch off",
      icon: "weight",
      headline: "A gentle, grounding weight.",
      tip: "Many people find even, steady pressure feels settling at the end of a long day. Pair it with soft pyjamas and a screen-free half hour.",
      products: pick("weighted-calm-blanket", "moonlight-pj-set"),
    },
    {
      id: "cocoon",
      label: "I love to cocoon",
      icon: "cloud",
      headline: "Wrap yourself in a cloud.",
      tip: "Size up: a Queen Cloud Dreamer on the sofa is a cocoon with room to spare. Finish with the robe you'll never want to take off.",
      products: pick("cloud-dreamer-blanket", "dreamday-plush-robe"),
    },
    {
      id: "feet",
      label: "Cold feet, always",
      icon: "thermometer",
      headline: "Start with warm feet.",
      tip: "Warm feet help your whole body feel warmer. Sherpa-lined slippers by day, the softest socks by night.",
      products: pick("cloud-plush-slippers", "cozy-scrunch-socks"),
    },
  ];
  const finder = finderAll.filter((p) => p.products.length > 0);

  const bestsellers = [
    "cloud-dreamer-blanket",
    "dreamday-plush-robe",
    "weighted-calm-blanket",
    "moonlight-pj-set",
  ]
    .map(byHandle)
    .filter((v): v is ProductView => Boolean(v));
  const more = views.filter((v) => !bestsellers.includes(v)).slice(0, 4);

  const dreamerContent = productContentByHandle("cloud-dreamer-blanket");
  const sizes =
    dreamerContent?.sizeGuide?.map((s) => ({
      key: s.short.toLowerCase(),
      label: s.short,
      width: s.inches[0],
      length: s.inches[1],
      weight: s.weight,
    })) ?? [];

  const liveCats = new Set(products.map((p) => p.content.category.slug));
  const worlds = [
    {
      key: "sleep",
      title: "Sleep",
      line: "For the bed: blankets, pillows, bedding and everything that makes lights-out softer.",
      image: weighted?.cardImage?.url ?? null,
      cats: collections.filter((c) => c.group === "sleep"),
    },
    {
      key: "comfort",
      title: "Comfort",
      line: "For the sofa and the slow hours: throws, cushions, robes and the cosiest slippers.",
      image: robe?.cardImage?.url ?? null,
      cats: collections.filter((c) => c.group === "comfort"),
    },
  ];

  const storeRating = demoStoreRating();
  const notes = demoHighlights(6);
  const nameOf = (handle: string) => byHandle(handle)?.name ?? "";

  const atHome = views
    .flatMap((v) =>
      v.gallery
        .filter((m) => m.type === "image")
        .slice(1, 3)
        .map((m) => (m.type === "image" ? m.url : "")),
    )
    .filter(Boolean)
    .slice(0, 12)
    .map((poster, i) => ({
      poster,
      alt: "Slumberlush at home",
      caption: [
        "Sofa nights",
        "Slow mornings",
        "Weekend in",
        "Cosy corner",
        "Lights out",
        "Movie marathon",
      ][i % 6],
    }));

  const [leadGuide, ...otherGuides] = guides;

  return (
    <>
      <JsonLd data={graph(faqSchema(homeFaqs))} />

      {/* ── 1 · Dusk — hero ─────────────────────────────────────────────
          Pulled up under the transparent header so bar and hero are one
          surface; exactly one viewport tall on desktop. */}
      <section
        data-home-hero
        className="-mt-[calc(var(--header-h)+0.5rem)] sm:-mt-[calc(var(--header-h)+0.75rem)]"
        aria-labelledby="hero-title"
      >
        <div className="cloud-wash relative flex min-h-svh flex-col overflow-hidden lg:h-svh">
          {/* Desktop: the film is the hero. Subject sits on the right of the
              frame; the left is open sky, so the headline reads over it as-is.
              Phones keep the still photo below until a portrait cut exists. */}
          <HeroVideo
            src="/videos/hero-desktop.mp4"
            poster="/videos/hero-desktop-poster.jpg"
            className="absolute inset-0 hidden lg:block"
            position="68% 50%"
          />
          {/* A whisper of milk behind the copy only — keeps contrast on bright
              frames without touching the film itself. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(90deg,rgb(251_248_243/0.38)_0%,rgb(251_248_243/0.14)_36%,transparent_52%)] lg:block"
          />
          {/* Mobile: dusk light, warm at the horizon, cooling upward */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgb(229_234_242/0.55)_0%,transparent_45%,rgb(246_232_211/0.7)_100%)] lg:hidden"
          />

          <div className="container-page relative grid flex-1 items-center gap-10 pt-[calc(var(--header-h)+2rem)] pb-12 lg:grid-cols-[1.1fr_1fr] lg:gap-8 lg:pt-[calc(var(--header-h)+1rem)] lg:pb-14">
            <div className="hero-rise order-2 text-center lg:order-1 lg:text-left">
              {/* <p className="eyebrow eyebrow-dot justify-center lg:justify-start">Sleep &amp; comfort, made slowly</p> */}
              <h1
                id="hero-title"
                className="mt-6 font-serif text-display-xl font-normal"
              >
                Sleep softer.
                <br />
                <em className="text-dusk-600">Live cozier.</em>
              </h1>
              <p className="mx-auto mt-6 max-w-108 text-body text-ink-soft lg:mx-0">
                Cloud-soft blankets, buttery sleepwear and plush little luxuries
                for the hours between the day ending and the night beginning.
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 lg:justify-start">
                <Link
                  href={dreamer?.href ?? "/collections/all"}
                  className="btn-primary"
                >
                  Meet the Cloud Dreamer
                  <Icon name="arrow-right" className="size-4" />
                </Link>
                <Link href="#hours" className="btn-quiet">
                  Find your ritual
                </Link>
              </div>
              <p className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-body-sm text-ink-soft lg:justify-start">
                <span className="flex items-center gap-2">
                  <Stars value={storeRating.average} />
                  <strong className="font-bold text-ink tabular-nums">
                    {storeRating.average.toFixed(1)}
                  </strong>
                  <span>
                    · {storeRating.count.toLocaleString("en-US")} reviews
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <Icon name="moon" className="size-4 text-honey-500" />
                  {site.returnWindowDays}-day sleep-on-it returns
                </span>
              </p>
            </div>

            {/* Mobile: an arch framing the photo, a breathing moon behind it */}
            <div className="relative order-1 lg:hidden">
              <div className="relative mx-auto w-full max-w-[min(28rem,calc((100svh-var(--header-h)-7rem)*0.78))]">
                <div
                  aria-hidden="true"
                  className="breathe absolute -top-[6%] -right-[10%] size-[42%] rounded-full bg-[radial-gradient(circle_at_35%_35%,#fffaf0_0%,var(--color-honey-100)_45%,rgb(237_211_173/0.4)_70%,transparent_72%)] blur-[1px]"
                />
                <div className="arch relative aspect-[4/5.2] overflow-hidden bg-oat shadow-drift">
                  {heroPhoto && (
                    <Image
                      src={heroPhoto}
                      alt="A woman wrapped in the Cloud Dreamer Blanket, smiling on a sofa"
                      fill
                      loading="eager"
                      fetchPriority="high"
                      sizes="86vw"
                      className="object-cover"
                    />
                  )}
                </div>
                {texturePhoto && (
                  <div className="float-slow absolute -bottom-5 -left-5 hidden size-28 overflow-hidden rounded-full shadow-float ring-[6px] ring-milk sm:block lg:-left-16 lg:size-36">
                    <Image
                      src={texturePhoto}
                      alt=""
                      fill
                      sizes="144px"
                      className="object-cover"
                    />
                  </div>
                )}
                {/* Breathing cue, synced to the moon (12 s: in 4 · hold 2 · out 6) */}
                <p
                  aria-hidden="true"
                  className="glass absolute right-4 bottom-6 grid h-10 min-w-36 place-items-center rounded-full px-4 text-[0.78rem] font-bold tracking-[0.04em] text-ink sm:-right-6"
                >
                  <span className="breath-in col-start-1 row-start-1 flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-dusk-500" />
                    Breathe in…
                  </span>
                  <span className="breath-hold col-start-1 row-start-1 flex items-center gap-2 opacity-0">
                    <span className="size-1.5 rounded-full bg-honey-500" />
                    Hold…
                  </span>
                  <span className="breath-out col-start-1 row-start-1 flex items-center gap-2 opacity-0">
                    <span className="size-1.5 rounded-full bg-dusk-300" />
                    And let go…
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2 · The Hours of Rest ───────────────────────────────────────── */}
      <section
        id="hours"
        className="section-y relative overflow-hidden bg-[linear-gradient(180deg,var(--color-honey-50)_0%,var(--color-milk)_40%,var(--color-dusk-50)_100%)]"
        aria-labelledby="hours-title"
      >
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow eyebrow-dot justify-center">
              The Hours of Rest
            </p>
            <h2 id="hours-title" className="mt-5 font-serif text-display">
              A softer evening, <em>hour by hour.</em>
            </h2>
            <p className="mt-5 text-body-lg text-ink-soft">
              Good sleep doesn&apos;t start at lights-out. It starts the moment
              the day lets go of you.
            </p>
          </div>

          <ol className="relative mt-16 grid gap-10 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4 lg:gap-6">
            {/* The night's thread */}
            <span
              aria-hidden="true"
              className="absolute top-3.5 right-[12%] left-[12%] hidden border-t border-dashed border-dusk-300 lg:block"
            />
            {hours.map((h, i) => {
              const photo = h.image ?? h.v.cardImage?.url ?? null;
              return (
                <li
                  key={h.time}
                  className={cn(
                    "reveal relative flex flex-col items-center text-center",
                    i % 2 === 1 && "lg:mt-14",
                  )}
                >
                  <Moon
                    phase={h.phase}
                    className="relative z-10 ring-8 ring-milk"
                  />
                  <p className="mt-4 text-[0.8rem] font-bold tracking-[0.16em] text-honey-600 uppercase">
                    {h.time}
                  </p>
                  <Link href={h.v.href} className="group mt-5 block w-full">
                    <span className="arch relative mx-auto block aspect-3/4 w-full max-w-72 overflow-hidden bg-oat shadow-soft">
                      {photo && (
                        <Image
                          src={photo}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 90vw"
                          className={cn(
                            "media-zoom object-cover",
                            h.title === "Wake slowly" && "object-bottom",
                          )}
                        />
                      )}
                    </span>
                    <span className="mt-6 block font-serif text-heading-1">
                      {h.title}
                    </span>
                    <span className="mx-auto mt-2 block max-w-64 text-ink-soft">
                      {h.body}
                    </span>
                    <span className="mt-4 inline-flex items-center gap-2 text-body-sm font-bold text-dusk-600">
                      {h.v.name}
                      <Icon
                        name="arrow-right"
                        className="size-3.5 transition-transform duration-500 group-hover:translate-x-1"
                      />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ── 3 · How do you sleep? ───────────────────────────────────────── */}
      {finder.length > 0 && (
        <section
          className="section-y bg-dusk-50"
          aria-labelledby="finder-title"
        >
          <div className="container-page">
            <div className="mb-12 grid gap-6 lg:mb-16 lg:grid-cols-[5fr_7fr] lg:items-end lg:gap-14">
              <div>
                <p className="eyebrow eyebrow-dot">The Sleep Finder</p>
                <h2 id="finder-title" className="mt-5 font-serif text-display">
                  How do <em>you</em> sleep?
                </h2>
              </div>
              <p className="max-w-xl text-body-lg text-ink-soft">
                Every sleeper is different. Tell us yours and we&apos;ll show
                you the two pieces made for exactly that kind of night.
              </p>
            </div>
            <SleepFinder profiles={finder} />
          </div>
        </section>
      )}

      {/* ── 4 · Most loved ──────────────────────────────────────────────── */}
      <section className="section-y" aria-labelledby="loved">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow eyebrow-dot">Most loved</p>
              <h2 id="loved" className="mt-5 font-serif text-display">
                Most loved, <em>most slept-in.</em>
              </h2>
            </div>
            <Link href="/collections/all" className="btn-secondary">
              Shop everything
              <Icon name="arrow-right" className="size-4" />
            </Link>
          </div>
          <ul className="mt-12 grid grid-cols-2 gap-x-4 gap-y-12 lg:grid-cols-4 lg:gap-x-6">
            {[...bestsellers, ...more].map((v) => (
              <li key={v.handle}>
                <ProductCard product={v} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── 5 · Midnight — the Cloud Dreamer ────────────────────────────── */}
      {dreamer && (
        <section className="px-2 sm:px-3" aria-labelledby="dreamer-title">
          <div className="night-sky section-y relative overflow-hidden rounded-media text-milk">
            <div className="container-page">
              <div className="grid items-center gap-12 lg:grid-cols-[5fr_6fr] lg:gap-20">
                <div className="relative mx-auto w-full max-w-md">
                  <div
                    aria-hidden="true"
                    className="breathe absolute -inset-8 rounded-full bg-[radial-gradient(circle,rgb(221_178_124/0.28)_0%,transparent_65%)]"
                  />
                  <div className="arch relative aspect-3/4 overflow-hidden shadow-drift">
                    {texturePhoto && (
                      <Image
                        src={texturePhoto}
                        alt="Close-up of the Cloud Dreamer's ruched plush"
                        fill
                        sizes="(min-width: 1024px) 448px, 90vw"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <ul className="glass-dark absolute -bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full p-2">
                    {dreamer.swatches.slice(0, 7).map((s) => (
                      <li
                        key={s.value}
                        title={s.label}
                        className="relative size-8 overflow-hidden rounded-full ring-1 ring-white/20"
                      >
                        {s.image && (
                          <Image
                            src={s.image}
                            alt={s.label}
                            fill
                            sizes="32px"
                            className="scale-[2.3] object-cover"
                          />
                        )}
                      </li>
                    ))}
                    <li className="px-2 text-[0.78rem] font-bold text-moon-100">
                      +{Math.max(0, dreamer.swatches.length - 7)}
                    </li>
                  </ul>
                </div>

                <div>
                  <p className="eyebrow eyebrow-dot text-honey-200">
                    At midnight · the one everyone asks about
                  </p>
                  <h2
                    id="dreamer-title"
                    className="mt-5 font-serif text-display"
                  >
                    The Cloud <em className="text-honey-200">Dreamer.</em>
                  </h2>
                  <p className="mt-6 max-w-lg text-body-lg text-moon-100/85">
                    {dreamer.benefitLine}
                  </p>
                  <ul className="mt-8 grid max-w-lg grid-cols-2 gap-x-6 gap-y-4 text-body-sm text-moon-100">
                    {(
                      [
                        ["cloud", "Velvety on both sides"],
                        ["feather", "Four-way stretch"],
                        ["ruler", "Throw to king"],
                        ["wash", "Machine washable"],
                      ] as [IconName, string][]
                    ).map(([icon, text]) => (
                      <li key={text} className="flex items-center gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/8 text-honey-200">
                          <Icon name={icon} className="size-4.5" />
                        </span>
                        {text}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-10 flex flex-wrap items-center gap-6">
                    <Link href={dreamer.href} className="btn-primary">
                      Shop the Dreamer ·{" "}
                      {formatMoney(dreamer.fromPrice, dreamer.currency)}
                    </Link>
                    <Link
                      href="/guides/blanket-size-guide"
                      className="btn-light"
                    >
                      Size guide
                    </Link>
                  </div>
                </div>
              </div>

              {sizes.length > 0 && (
                <div className="mt-20 rounded-media bg-white/4 p-6 ring-1 ring-white/8 sm:p-10 lg:mt-28">
                  <p className="eyebrow eyebrow-dot text-honey-200">
                    Will it cover my bed?
                  </p>
                  <h3 className="mt-4 mb-10 font-serif text-heading-1">
                    See it on your bed,{" "}
                    <em className="text-honey-200">to scale.</em>
                  </h3>
                  <SizeVisualizer sizes={sizes} tone="dark" />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── 6 · Two worlds ──────────────────────────────────────────────── */}
      <section className="section-y" aria-labelledby="worlds">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow eyebrow-dot justify-center">Shop by world</p>
            <h2 id="worlds" className="mt-5 font-serif text-display">
              For the bed. <em>For the sofa.</em>
            </h2>
          </div>
          <div className="mt-16 grid gap-16 lg:grid-cols-2 lg:gap-12">
            {worlds.map((w) => (
              <article
                key={w.key}
                className="grid gap-8 sm:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] sm:items-start"
              >
                <Link
                  href={`/collections/${w.cats[0]?.slug ?? "all"}`}
                  className="group block sm:sticky sm:top-[calc(var(--header-h)+2rem)]"
                >
                  <span className="arch relative block aspect-3/4 overflow-hidden bg-oat shadow-soft">
                    {w.image && (
                      <Image
                        src={w.image}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 22vw, (min-width: 640px) 40vw, 90vw"
                        className="media-zoom object-cover"
                      />
                    )}
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-night-900/75 to-transparent"
                    />
                    <span className="absolute inset-x-0 bottom-6 text-center font-serif text-heading-1 text-milk italic">
                      {w.title}
                    </span>
                  </span>
                </Link>
                <div>
                  <p className="text-ink-soft">{w.line}</p>
                  <ul className="mt-5">
                    {w.cats.map((c) => {
                      const live = (c.categories as string[]).some((s) =>
                        liveCats.has(s),
                      );
                      return (
                        <li key={c.slug}>
                          <Link
                            href={`/collections/${c.slug}`}
                            className="group/row flex min-h-13 items-center gap-3 border-b border-sand/80 py-2.5 transition-colors hover:text-dusk-600"
                          >
                            <Icon
                              name={c.icon}
                              className="size-4.5 text-honey-500"
                            />
                            <span className="font-serif text-[1.3rem] font-medium">
                              {c.title}
                            </span>
                            {!live && (
                              <span className="rounded-full bg-moon-100 px-2 py-0.5 text-[0.62rem] font-bold tracking-[0.12em] text-dusk-700 uppercase">
                                Soon
                              </span>
                            )}
                            <Icon
                              name="arrow-right"
                              className="ml-auto size-4 -translate-x-2 opacity-0 transition-all duration-500 group-hover/row:translate-x-0 group-hover/row:opacity-100"
                            />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7 · The Slumberlush promise ───────────────────────────────────── */}
      <section className="px-2 sm:px-3" aria-labelledby="promise">
        <div className="rounded-media bg-oat py-14 lg:py-20">
          <div className="container-page">
            <h2 id="promise" className="sr-only">
              The Slumberlush promise
            </h2>
            <ul className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              {promises.map((p) => (
                <li
                  key={p.title}
                  className="flex flex-col items-center text-center lg:items-start lg:text-left"
                >
                  <span className="grid size-14 place-items-center rounded-full bg-cloud text-dusk-600 shadow-soft">
                    <Icon name={p.icon} className="size-5.5" />
                  </span>
                  <h3 className="mt-5 font-serif text-heading-2">{p.title}</h3>
                  <p className="mt-2 max-w-64 text-body-sm text-ink-soft">
                    {p.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── 8 · Notes on the nightstand ─────────────────────────────────── */}
      <section
        className="section-y relative overflow-hidden"
        aria-labelledby="notes"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-24 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-moon-100/70 blur-3xl"
        />
        <div className="container-page relative">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow eyebrow-dot justify-center">
              Notes on the nightstand
            </p>
            <h2 id="notes" className="mt-5 font-serif text-display">
              {storeRating.count.toLocaleString("en-US")} people,{" "}
              <em>sleeping softer.</em>
            </h2>
            <p className="mt-5 flex items-center justify-center gap-2 text-ink-soft">
              <Stars value={storeRating.average} />
              <strong className="font-bold text-ink tabular-nums">
                {storeRating.average.toFixed(1)}
              </strong>{" "}
              out of 5
            </p>
          </div>
          <ul className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {notes.map((r, i) => (
              <li
                key={r.id}
                className={cn(
                  "reveal relative flex flex-col rounded-[22px] bg-cloud p-8 shadow-float transition-transform duration-700 ease-out-soft hover:rotate-0",
                  [
                    "-rotate-1",
                    "rotate-[0.8deg]",
                    "-rotate-[0.5deg]",
                    "rotate-1",
                    "-rotate-[0.8deg]",
                    "rotate-[0.4deg]",
                  ][i % 6],
                )}
              >
                <span
                  aria-hidden="true"
                  className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 rotate-[-2deg] rounded-sm bg-honey-100/90"
                />
                <Stars value={r.rating} starClassName="size-3.5" />
                {r.title && (
                  <p className="mt-5 font-serif text-heading-2 italic">
                    “{r.title}”
                  </p>
                )}
                <p className="mt-3 flex-1 font-serif text-[1.2rem] leading-snug text-ink-soft">
                  {r.body}
                </p>
                <p className="mt-6 flex items-center justify-between gap-3 text-[0.8rem]">
                  <span className="font-bold">
                    {r.author}
                    <span className="ml-2 inline-flex items-center gap-1 font-semibold text-success">
                      <Icon name="check" className="size-3.5" /> Verified
                    </span>
                  </span>
                  <Link
                    href={`/products/${r.handle}`}
                    className="link-underline text-ink-soft"
                  >
                    {nameOf(r.handle)}
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── 9 · #SlumberlushAtHome ────────────────────────────────────────── */}
      <section className="pb-(--section-y)" aria-labelledby="at-home">
        <div className="container-page flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow eyebrow-dot">#SlumberlushAtHome</p>
            <h2 id="at-home" className="mt-5 font-serif text-display">
              Real homes, <em>real cozy.</em>
            </h2>
          </div>
          <p className="max-w-sm text-ink-soft">
            Share your softest corner with @slumberlush for a chance to be
            featured here.
          </p>
        </div>
        <ProductVideoShowcase videos={atHome} className="mt-12 px-2 sm:px-3" />
      </section>

      {/* ── 10 · The Sleep Journal ──────────────────────────────────────── */}
      {leadGuide && (
        <section className="px-2 sm:px-3" aria-labelledby="journal">
          <div className="section-y rounded-media bg-[linear-gradient(160deg,var(--color-honey-50),var(--color-oat))]">
            <div className="container-page">
              <div className="flex flex-wrap items-end justify-between gap-6">
                <div>
                  <p className="eyebrow eyebrow-dot">The Sleep Journal</p>
                  <h2 id="journal" className="mt-5 font-serif text-display">
                    Reading for <em>before bed.</em>
                  </h2>
                </div>
                <Link href="/guides" className="btn-quiet">
                  All articles
                </Link>
              </div>
              <div className="mt-14 grid gap-6 lg:grid-cols-[7fr_5fr] lg:gap-10">
                <Link
                  href={`/guides/${leadGuide.slug}`}
                  className="group night-sky relative flex min-h-104 flex-col justify-end overflow-hidden rounded-media p-8 text-milk sm:p-12"
                >
                  <div
                    aria-hidden="true"
                    className="breathe absolute top-10 right-10 size-28 rounded-full shadow-[inset_-22px_-6px_0_0_var(--color-honey-200)]"
                  />
                  <p className="eyebrow text-honey-200">
                    {leadGuide.topic} · {leadGuide.readingMinutes} min
                  </p>
                  <h3 className="mt-4 max-w-xl font-serif text-heading-1">
                    {leadGuide.title}
                  </h3>
                  <p className="mt-4 max-w-lg text-moon-100/80">
                    {leadGuide.summary}
                  </p>
                  <span className="mt-6 inline-flex items-center gap-2 text-body-sm font-bold text-honey-200">
                    Read the article{" "}
                    <Icon
                      name="arrow-right"
                      className="size-4 transition-transform duration-500 group-hover:translate-x-1"
                    />
                  </span>
                </Link>
                <ol className="flex flex-col gap-4">
                  {otherGuides.slice(0, 4).map((g, i) => (
                    <li key={g.slug}>
                      <Link
                        href={`/guides/${g.slug}`}
                        className="group flex gap-5 rounded-[28px] bg-cloud/80 p-6 shadow-soft transition-all duration-500 hover:-translate-y-0.5 hover:shadow-float"
                      >
                        <span className="font-serif text-heading-2 text-honey-500 italic tabular-nums">
                          0{i + 2}
                        </span>
                        <span>
                          <span className="block text-[0.72rem] font-bold tracking-[0.16em] text-ink-faint uppercase">
                            {g.topic} · {g.readingMinutes} min
                          </span>
                          <span className="mt-1 block font-serif text-heading-3 font-medium">
                            {g.title}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 11 · Questions ──────────────────────────────────────────────── */}
      <section className="section-y" aria-labelledby="home-faq">
        <div className="container-page max-w-4xl">
          <div className="text-center">
            <p className="eyebrow eyebrow-dot justify-center">
              Before you sleep on it
            </p>
            <h2 id="home-faq" className="mt-5 font-serif text-display">
              Good <em>to know.</em>
            </h2>
          </div>
          <div className="mt-12">
            <Faq items={homeFaqs} />
          </div>
          <p className="mt-8 text-center text-body-sm text-ink-soft">
            More questions?{" "}
            <Link href="/pages/faq" className="link-underline text-ink">
              Read all FAQs
            </Link>{" "}
            or write to{" "}
            <a
              href={`mailto:${site.supportEmail}`}
              className="link-underline text-ink"
            >
              {site.supportEmail}
            </a>
          </p>
        </div>
      </section>

      {/* ── 12 · Bedtime letters ────────────────────────────────────────── */}
      <section className="px-2 pb-3 sm:px-3" aria-labelledby="newsletter">
        <div className="night-sky relative overflow-hidden rounded-media py-16 text-milk md:py-24">
          <div
            aria-hidden="true"
            className="breathe absolute -top-24 -right-24 size-80 rounded-full bg-[radial-gradient(circle_at_35%_35%,#fff6e6_0%,var(--color-honey-200)_40%,transparent_70%)] opacity-60"
          />
          <div className="container-page relative grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-24">
            <div>
              <p className="eyebrow eyebrow-dot text-honey-200">
                Bedtime letters
              </p>
              <h2 id="newsletter" className="mt-5 font-serif text-display">
                First to know,{" "}
                <em className="text-honey-200">first to rest.</em>
              </h2>
              <p className="mt-5 max-w-md text-moon-100/80">
                New colours before they sell out, restocks, and the occasional
                sleep note. A couple of letters a month — never spam.
              </p>
            </div>
            <div className="rounded-media bg-white/6 p-6 ring-1 ring-white/10 backdrop-blur md:p-8 [&_.eyebrow]:text-moon-100 [&_p]:text-moon-100/80">
              <NewsletterForm tone="dark" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
