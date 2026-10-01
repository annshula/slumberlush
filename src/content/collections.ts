/**
 * Collection pages. Each category belongs to one of two worlds — Sleep or
 * Comfort. A category with no live products yet still gets a page (so the
 * navigation is complete) but renders a "coming soon" state and is excluded
 * from the sitemap until it has products (no thin pages indexed).
 */

import type { PdpIcon } from "@/content/products";

export type CollectionGroup = "sleep" | "comfort";

export type CollectionContent = {
  slug: string;
  title: string;
  /** Short line for menus and tiles. */
  tagline: string;
  seoTitle: string;
  description: string;
  intro: string;
  group: CollectionGroup | "all";
  icon: PdpIcon;
  /** Category slug(s) whose products belong here; "*" for all. */
  categories: string[] | "*";
  /** What the category will include, for the coming-soon state and the mega menu. */
  includes?: string[];
  education?: { heading: string; paragraphs: string[] };
  faqs?: { q: string; a: string }[];
  related: { label: string; href: string }[];
};

export const collections: CollectionContent[] = [
  /* ── Sleep ─────────────────────────────────────────────────────────── */
  {
    slug: "blankets",
    title: "Blankets",
    tagline: "Plush, oversized, impossible to put down",
    seoTitle: "Soft Blankets — Plush, Oversized & Machine Washable",
    description:
      "Super-soft plush blankets in every size from sofa throw to king, velvety on both sides and machine washable.",
    intro:
      "A good blanket is the most-used thing in the house. Ours are plush on both sides, generously sized, and made to come out of the wash just as soft as they went in.",
    group: "sleep",
    icon: "cloud",
    categories: ["blankets"],
    includes: ["Plush blankets", "Oversized throws", "Kids' blankets"],
    education: {
      heading: "How to choose a blanket size",
      paragraphs: [
        "For the sofa, a 50″×60″ throw covers one person from shoulders to toes. For a bed, match the mattress: Twin 60″×80″, Queen 90″×90″, King 100″×108″.",
        "If you love to cocoon or share, size up — extra fabric drapes over the sides rather than leaving a cold edge.",
      ],
    },
    faqs: [
      { q: "What is the softest blanket material?", a: "Dense microfibre plush is among the softest — velvety, warm and quick to dry. A little spandex adds stretch so it drapes and hugs." },
      { q: "How often should I wash a blanket?", a: "Every two to four weeks if you use it daily, more often with pets. Wash cold, skip the softener and hang to dry." },
    ],
    related: [
      { label: "How to wash a plush blanket", href: "/guides/how-to-wash-a-plush-blanket" },
      { label: "Blanket size guide", href: "/guides/blanket-size-guide" },
    ],
  },
  {
    slug: "weighted-blankets",
    title: "Weighted Blankets",
    tagline: "Even, grounding weight for winding down",
    seoTitle: "Weighted Blankets — Hand-Knitted, No Beads",
    description: "Hand-knitted cotton weighted blankets with even weight and no beads — breathable, calming and oversized.",
    intro:
      "Weighted blankets spread gentle pressure across your body — a settled, hugged feeling many people love at the end of the day. Ours are hand-knitted, so the weight is the fabric itself: no beads to shift or rattle.",
    group: "sleep",
    icon: "weight",
    categories: ["weighted-blankets"],
    faqs: [
      { q: "What weight should I choose?", a: "A common guide is around 10% of your body weight. Weighted blankets aren't suitable for young children; if you have a medical condition, ask your doctor first." },
    ],
    related: [{ label: "Choosing a weighted blanket", href: "/guides/choosing-a-weighted-blanket" }],
  },
  {
    slug: "pillows",
    title: "Pillows",
    tagline: "Bed, body and lounging pillows",
    seoTitle: "Pillows — Bed Pillows, Body Pillows & Lounge Pillows",
    description: "Supportive bed pillows, full-length body pillows and lounging pillows. Launching soon at Slumberlush.",
    intro: "Support for side, back and stomach sleepers, plus full-length body pillows and plump lounging pillows.",
    group: "sleep",
    icon: "bed",
    categories: ["pillows", "body-pillows"],
    includes: ["Bed pillows", "Body pillows", "Pillowcases"],
    related: [{ label: "Better sleep guide", href: "/guides/better-sleep-routine" }],
  },
  {
    slug: "bedding",
    title: "Bedding",
    tagline: "Sheets, duvets, quilts & pillowcases",
    seoTitle: "Bedding — Bedsheets, Duvets, Comforters & Quilts",
    description: "Breathable bedsheets, comforters, duvets and quilts. Launching soon at Slumberlush.",
    intro: "The foundation of a good night: breathable sheets, cloud-light duvets and layered quilts.",
    group: "sleep",
    icon: "moon",
    categories: ["bedding"],
    includes: ["Bedsheets", "Pillowcases", "Comforters & duvets", "Quilts"],
    related: [{ label: "Better sleep guide", href: "/guides/better-sleep-routine" }],
  },
  {
    slug: "mattress",
    title: "Mattress Toppers",
    tagline: "Toppers and protectors",
    seoTitle: "Mattress Toppers & Mattress Protectors",
    description: "Plush mattress toppers and breathable mattress protectors. Launching soon at Slumberlush.",
    intro: "Give a tired mattress a second life with a plush topper, and protect it with a breathable cover.",
    group: "sleep",
    icon: "bed",
    categories: ["mattress"],
    includes: ["Mattress toppers", "Mattress protectors"],
    related: [{ label: "Better sleep guide", href: "/guides/better-sleep-routine" }],
  },
  {
    slug: "warming-cooling",
    title: "Warming & Cooling",
    tagline: "Heated blankets and cooling sleep",
    seoTitle: "Heated Blankets & Cooling Sleep Products",
    description: "Heated blankets for cold nights and cooling sleep products for hot sleepers.",
    intro: "Run cold? A heated blanket with adjustable settings. Run hot? Breathable, cooling layers are on the way.",
    group: "sleep",
    icon: "thermometer",
    categories: ["warming-cooling"],
    includes: ["Heated blankets", "Cooling sleep products"],
    related: [{ label: "Sleeping hot or cold?", href: "/guides/sleeping-hot-or-cold" }],
  },
  {
    slug: "sleepwear",
    title: "Sleepwear",
    tagline: "Buttery modal pyjamas & sleep shirts",
    seoTitle: "Sleepwear — Soft Modal Pyjamas & Sleep Shirts",
    description: "Buttery-soft modal pyjama sets and sleep shirts — breathable, stretchy and made for bedtime.",
    intro: "Breathable modal jersey cut with proper pyjama details: notched collars, piping and pockets.",
    group: "sleep",
    icon: "moon",
    categories: ["sleepwear"],
    related: [{ label: "Better sleep guide", href: "/guides/better-sleep-routine" }],
  },
  {
    slug: "sleep-masks",
    title: "Sleep Masks",
    tagline: "Blackout, silky, contoured",
    seoTitle: "Sleep Masks — Blackout & Silky Eye Masks",
    description: "Soft blackout sleep masks for travel, naps and light sleepers. Launching soon at Slumberlush.",
    intro: "Total darkness, wherever you sleep — contoured and silky so nothing presses on your eyes.",
    group: "sleep",
    icon: "sparkle",
    categories: ["sleep-masks"],
    includes: ["Blackout masks", "Silk masks", "Travel sets"],
    related: [{ label: "Better sleep guide", href: "/guides/better-sleep-routine" }],
  },

  /* ── Comfort ───────────────────────────────────────────────────────── */
  {
    slug: "throws-cushions",
    title: "Throws & Cushions",
    tagline: "Cozy throws, cushions, floor cushions, bolsters",
    seoTitle: "Cozy Throws, Cushions, Floor Cushions & Bolsters",
    description: "Cozy throws, cushions, floor cushions, bolsters and lounging pillows. Launching soon at Slumberlush.",
    intro: "Soft layers for the sofa and the floor — the pieces that make a room feel like home.",
    group: "comfort",
    icon: "heart",
    categories: ["throws-cushions"],
    includes: ["Cozy throws", "Cushions", "Floor cushions", "Bolsters", "Lounging pillows"],
    related: [{ label: "Shop blankets", href: "/collections/blankets" }],
  },
  {
    slug: "wearable-blankets",
    title: "Wearable Blankets",
    tagline: "A blanket with sleeves",
    seoTitle: "Wearable Blankets — Oversized Blanket Hoodies",
    description: "Oversized wearable blankets and blanket hoodies. Launching soon at Slumberlush.",
    intro: "All the softness of a blanket, with sleeves and a hood. Launching soon.",
    group: "comfort",
    icon: "users",
    categories: ["wearable-blankets"],
    includes: ["Blanket hoodies", "Wearable throws"],
    related: [{ label: "Shop robes", href: "/collections/robes" }],
  },
  {
    slug: "robes",
    title: "Robes",
    tagline: "Plush and silky robes",
    seoTitle: "Robes — Ultra-Soft Plush & Silky Modal Robes",
    description: "Ultra-soft plush robes and lightweight modal robes with deep pockets and calf-length cuts.",
    intro: "From thick, warm plush to silky modal jersey — the robe you'll live in from the morning coffee to the evening wind-down.",
    group: "comfort",
    icon: "feather",
    categories: ["robes"],
    related: [{ label: "Shop sleepwear", href: "/collections/sleepwear" }],
  },
  {
    slug: "slippers-socks",
    title: "Slippers & Socks",
    tagline: "Faux fur, sherpa, cloud-cushioned",
    seoTitle: "Slippers & Cozy Socks — Plush, Faux Fur & Cloud Slides",
    description: "Faux-fur plush slippers, cushioned cloud slides and cozy socks.",
    intro: "Warm feet, happy everything. Plush faux-fur slippers, pillowy slides and the softest socks.",
    group: "comfort",
    icon: "cloud",
    categories: ["slippers-socks"],
    related: [{ label: "Shop robes", href: "/collections/robes" }],
  },

  /* ── Everything ────────────────────────────────────────────────────── */
  {
    slug: "all",
    title: "Shop all",
    tagline: "Every Slumberlush piece",
    seoTitle: "Shop All Sleep & Comfort Products",
    description: "Every Slumberlush sleep and comfort product — blankets, sleepwear, robes, slippers and more.",
    intro: "Everything we make to help you rest, lounge and slow down.",
    group: "all",
    icon: "sparkle",
    categories: "*",
    related: [
      { label: "Bestsellers", href: "/collections/blankets" },
      { label: "All guides", href: "/guides" },
    ],
  },
];

export function collectionBySlug(slug: string) {
  return collections.find((c) => c.slug === slug);
}

export const sleepCollections = collections.filter((c) => c.group === "sleep");
export const comfortCollections = collections.filter((c) => c.group === "comfort");
