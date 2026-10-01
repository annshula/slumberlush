/**
 * Slumberlush product line — editorial layer on top of the Shopify catalog.
 *
 * Shopify owns: price, variants, availability, media (data/catalog.json).
 * This file owns: naming, copy, materials, sizing, care and FAQs.
 *
 * CLAIMS RULE: every statement comes from the supplier's specification (fabric
 * composition, dimensions, weights, care label). No medical or sleep-outcome
 * claims — a weighted blanket "feels calming", it does not "treat anxiety".
 * Unknowns go in `contentGaps` and are never rendered.
 */

export type ProductFaq = { q: string; a: string };

export type PdpIcon =
  | "leaf"
  | "star"
  | "droplet"
  | "flower"
  | "heart"
  | "feather"
  | "globe"
  | "shield"
  | "clock"
  | "moon"
  | "cloud"
  | "thermometer"
  | "wash"
  | "ruler"
  | "sparkle"
  | "sun"
  | "bed"
  | "gift"
  | "snowflake"
  | "weight"
  | "users";

export type Material = { name: string; detail: string };

export type SizeRow = {
  size: string;
  /** Short label for chips, e.g. "Queen". */
  short: string;
  dimensions: string;
  /** [width, length] in inches — drives the to-scale bed visualizer. */
  inches: [number, number];
  weight?: string;
  bestFor: string;
};

export type ProductContent = {
  /** Shopify product handle (source of truth for the catalog). */
  handle: string;
  /** Public URL slug: /products/{slug}. Always equal to `handle`. */
  slug: string;
  /** Old slugs that 301-redirect to this product (see the [slug] route). */
  legacySlugs: string[];
  name: string;
  /** Short format line for cards, e.g. "Plush throw · 4 sizes". */
  format: string;
  category: { slug: string; name: string };
  benefitLine: string;
  /** Brand shown in Product schema. */
  manufacturer: string;
  /** Small merchandising tag on cards ("Bestseller", "New"). */
  badge?: string;
  seo: { title: string; description: string };
  /** Shopify option name → display label, and value → display label. */
  optionLabels: Record<string, { label: string; values: Record<string, string> }>;
  /** Option whose values are pack sizes, mapped to unit counts. */
  packOption?: { name: string; units: Record<string, number> };
  /** Option rendered as photo swatches; the gallery follows the chosen value. */
  swatchOption?: string;
  story: { heading: string; body: string[] };
  highlights: { title: string; body: string }[];
  /** Care routine — also emitted as HowTo structured data. */
  steps: { title: string; body: string }[];
  materials: Material[];
  sizeGuide?: SizeRow[];
  specs: { label: string; value: string }[];
  inTheBox: { item: string; detail: string }[];
  care: { note: string; do: string[]; dont: string[] };
  faqs: ProductFaq[];
  /** Google product category for Product JSON-LD. */
  googleCategory: string;
  pdp: {
    /** Three icon + text items above the H1. */
    trust?: { icon: PdpIcon; text: string }[];
    perksOneColumn?: boolean;
    galleryFit?: "contain" | "flush" | "cover";
    packs?: "list" | "cards";
    /** Editorial band with a photo and three benefits (EditorialBands). */
    dailyStep?: {
      eyebrow: string;
      heading: string;
      body: string;
      /** Substring of the image URL (or its alt) to use as the band photo; hidden if no match. */
      mediaFile: string;
      imagePosition?: "right" | "top" | "center";
      benefits: { icon: PdpIcon; title: string; body: string }[];
    };
    /** Only products with an intro show the video showcase. */
    videosIntro?: string;
    howTo: { heading: string; intro: string; guide?: { href: string } };
    /** Callout under the buy box. */
    notice: { lead: string; text: string };
  };
  /** Items still needed from the supplier before the content is complete. */
  contentGaps: string[];
};

const RETURNS_FAQ: ProductFaq = {
  q: "Can I return it?",
  a: "Yes. If it isn't right, start a return from your order history within 30 days of delivery. Items should be unwashed and in their original condition. EU customers also have a 14-day right to cancel.",
};

export const products: ProductContent[] = [
  /* ── The hero product ──────────────────────────────────────────────── */
  {
    handle: "cloud-dreamer-blanket",
    slug: "cloud-dreamer-blanket",
    legacySlugs: ["dreamer-blanket", "the-dreamer-blanket"],
    name: "Cloud Dreamer Blanket",
    format: "Plush stretch blanket · 4 sizes",
    category: { slug: "blankets", name: "Blankets" },
    badge: "Bestseller",
    benefitLine:
      "An oversized, cloud-soft plush blanket — velvety on both sides, with a four-way stretch that hugs you and a softness that lasts wash after wash.",
    manufacturer: "Slumberlush",
    seo: {
      title: "Cloud Dreamer Blanket — Super Soft Oversized Plush Blanket",
      description:
        "The softest oversized plush blanket: velvety on both sides, four-way stretch, machine washable. Four sizes from 50″×60″ throw to 100″×108″ king, in 16 colours.",
    },
    optionLabels: {
      Color: { label: "Colour", values: {} },
      Size: {
        label: "Size",
        values: {
          Medium: "Throw · 50″×60″",
          Large: "Twin · 60″×80″",
          "XL Dreamer": "Queen · 90″×90″",
          "Mega Dreamer": "King · 100″×108″",
        },
      },
    },
    swatchOption: "Color",
    story: {
      heading: "The blanket everyone on your sofa will ask about.",
      body: [
        "Some blankets are warm. Some are soft. The Cloud Dreamer is the one you end up carrying from the bed to the sofa and back again. It's an oversized plush blanket with a velvety feel on both sides, so there is no 'wrong' side and no scratchy back.",
        "A touch of spandex gives it a four-way stretch: it drapes over your shoulders and settles around you instead of sliding off. Four sizes take it from a personal throw to full king-bed coverage, and it comes out of a cold wash exactly as soft as it went in.",
      ],
    },
    highlights: [
      { title: "Soft on both sides", body: "Velvety plush inside and out — every position feels the same." },
      { title: "Four-way stretch", body: "Moves with you and settles around you without losing its shape." },
      { title: "Throw to king", body: "Four sizes, from a 50″×60″ sofa throw to 100″×108″ king coverage." },
      { title: "Stays soft", body: "Wash cold, hang to dry, shake it out. It comes back just as soft." },
    ],
    steps: [
      { title: "Bag it", body: "Place the blanket in a large mesh laundry bag to protect the plush." },
      { title: "Wash cold, alone", body: "Machine wash on a cold, gentle cycle with no other items." },
      { title: "Skip the extras", body: "No bleach and no fabric softener — softener coats the fibres and flattens the plush." },
      { title: "Hang to dry", body: "Hang or lay flat to dry. Avoid high tumble heat." },
      { title: "Fluff it up", body: "Once dry, shake it out and brush the plush with your hand or a soft brush to restore the texture." },
    ],
    materials: [
      { name: "95% polyester plush", detail: "A dense, velvety microfibre pile on both faces — soft against skin and quick to dry." },
      { name: "5% spandex / elastane", detail: "Gives the four-way stretch, so the blanket drapes and hugs without sagging." },
    ],
    sizeGuide: [
      { size: "Throw (Medium)", short: "Throw", inches: [50, 60], dimensions: "50″ × 60″ · 127 × 152 cm", weight: "≈ 5 lbs", bestFor: "Sofa, reading chair, one person" },
      { size: "Twin (Large)", short: "Twin", inches: [60, 80], dimensions: "60″ × 80″ · 152 × 203 cm", weight: "≈ 7 lbs", bestFor: "Twin bed, sharing the sofa" },
      { size: "Queen (XL)", short: "Queen", inches: [90, 90], dimensions: "90″ × 90″ · 229 × 229 cm", weight: "≈ 11.5 lbs", bestFor: "Queen bed, two people" },
      { size: "King (Mega)", short: "King", inches: [100, 108], dimensions: "100″ × 108″ · 254 × 274 cm", weight: "≈ 15 lbs", bestFor: "King bed, full coverage" },
    ],
    specs: [
      { label: "Fabric", value: "95% polyester, 5% spandex/elastane" },
      { label: "Feel", value: "Velvety plush on both sides, four-way stretch" },
      { label: "Sizes", value: "Throw, Twin, Queen, King" },
      { label: "Care", value: "Machine wash cold, hang to dry" },
    ],
    inTheBox: [{ item: "Cloud Dreamer Blanket", detail: "In your chosen size and colour" }],
    care: {
      note: "Follow the care label sewn into your blanket. These steps keep the plush soft for years.",
      do: ["Machine wash cold, on its own", "Use a mesh laundry bag", "Hang or lay flat to dry", "Shake and brush to re-fluff"],
      dont: ["Bleach", "Fabric softener", "Iron", "Dry clean"],
    },
    faqs: [
      { q: "What size should I choose?", a: "For the sofa, the Throw (50″×60″) is the classic. For a bed, match the bed: Twin (60″×80″), Queen (90″×90″) or King (100″×108″). If you like to cocoon, size up — the extra fabric is half the fun." },
      { q: "Is it heavy like a weighted blanket?", a: "No. It has a satisfying, drapey weight — about 5 lbs for the Throw up to 15 lbs for the King — but it isn't a therapeutic weighted blanket. For that, see the Weighted Calm Blanket." },
      { q: "Does it shed or pill?", a: "The plush is a dense microfibre. Washing it in a mesh bag on cold, without softener, is the best way to keep the surface smooth." },
      { q: "Is it warm enough for winter?", a: "Yes — plush traps warmth well. If you sleep very hot, the Throw size on top of your sheet is a good way to start." },
      { q: "How do I wash it?", a: "Machine wash cold on its own (a mesh laundry bag helps), hang to dry, then shake it out and fluff it with your hands. No bleach, no ironing, no dry cleaning." },
      { q: "Does it make a good gift?", a: "It's our most-gifted piece. Add a gift note at checkout and we'll leave the price out of the parcel." },
      RETURNS_FAQ,
    ],
    googleCategory: "Home & Garden > Linens & Bedding > Bedding > Blankets",
    pdp: {
      galleryFit: "cover",
      trust: [
        { icon: "cloud", text: "Velvety on both sides" },
        { icon: "wash", text: "Machine washable" },
        { icon: "ruler", text: "Throw to king sizes" },
      ],
      videosIntro: "Real homes, real sofas — see how the Cloud Dreamer drapes, stretches and wraps.",
      dailyStep: {
        eyebrow: "Your evening ritual",
        heading: "The softest place in the room.",
        body: "Turn any bed or sofa into the place everyone wants to be. Velvety plush, a gentle stretch, and a size for every space.",
        mediaFile: "Cappuccino",
        imagePosition: "center",
        benefits: [
          { icon: "cloud", title: "Cloud-like plush", body: "Velvety on both sides — no rough edges, no wrong side." },
          { icon: "feather", title: "Four-way stretch", body: "Drapes, hugs and holds its shape." },
          { icon: "wash", title: "Easy care", body: "Wash cold, hang dry, shake to fluff." },
        ],
      },
      howTo: {
        heading: "Keep it cloud-soft.",
        intro: "The short version: mesh bag, cold wash, no softener, hang dry, shake it out.",
        guide: { href: "/guides/how-to-wash-a-plush-blanket" },
      },
      notice: { lead: "Sized to your bed.", text: "Throw for the sofa, Twin/Queen/King to match your mattress." },
    },
    contentGaps: ["GTIN / barcode", "OEKO-TEX or other fabric certification, if any"],
  },

  /* ── Sleep ─────────────────────────────────────────────────────────── */
  {
    handle: "weighted-calm-blanket",
    slug: "weighted-calm-blanket",
    legacySlugs: [],
    name: "Weighted Calm Blanket",
    format: "Hand-knitted cotton · 20 lb",
    category: { slug: "weighted-blankets", name: "Weighted Blankets" },
    badge: "New",
    benefitLine:
      "A chunky, hand-knitted cotton weighted blanket. Twenty pounds of even, grounding weight for winding down — no beads, no filling.",
    manufacturer: "Slumberlush",
    seo: {
      title: "Weighted Calm Blanket — 20 lb Hand-Knitted Cotton Weighted Blanket",
      description:
        "A 20 lb hand-knitted cotton weighted blanket with an open chunky knit — even weight, no beads, oversized. Nine calm colours.",
    },
    optionLabels: { Color: { label: "Colour", values: {} }, Size: { label: "Weight", values: { "20lb": "20 lb" } } },
    swatchOption: "Color",
    story: {
      heading: "Heavy in the best way.",
      body: [
        "The Weighted Calm Blanket is knitted by hand from thick cotton tubes, so the weight comes from the knit itself — there are no glass beads to shift, clump or rattle.",
        "Twenty pounds spread evenly from shoulders to feet gives that sink-in, settled feeling many people love at the end of the day. The open knit lets air through, so it feels heavy without feeling stuffy.",
      ],
    },
    highlights: [
      { title: "No beads", body: "The weight is the knit — nothing to shift or leak." },
      { title: "Breathable knit", body: "Open chunky loops let air circulate." },
      { title: "Even 20 lb weight", body: "Spread from shoulders to toes." },
      { title: "Oversized", body: "Generous enough to curl up under." },
    ],
    steps: [
      { title: "Spot clean first", body: "Treat small marks with a damp cloth and mild soap." },
      { title: "Gentle wash", body: "If needed, wash cold on a gentle cycle in a large-capacity machine." },
      { title: "Lay flat to dry", body: "Dry flat to keep the knit in shape — never hang a wet weighted blanket." },
    ],
    materials: [{ name: "Cotton chunky knit", detail: "Thick, hand-knitted cotton tubes; the weight is the fabric itself." }],
    specs: [
      { label: "Weight", value: "20 lb" },
      { label: "Construction", value: "Hand-knitted chunky cotton" },
      { label: "Filling", value: "None — no beads" },
    ],
    inTheBox: [{ item: "Weighted Calm Blanket", detail: "20 lb, in your chosen colour" }],
    care: {
      note: "A 20 lb blanket is heavy when wet — check your machine's capacity first.",
      do: ["Spot clean where you can", "Wash cold, gentle cycle", "Lay flat to dry"],
      dont: ["Hang to dry", "Tumble dry hot", "Bleach"],
    },
    faqs: [
      { q: "Who is a 20 lb blanket for?", a: "A common rule of thumb is around 10% of body weight, so 20 lb suits many adults. It isn't suitable for young children, and anyone with a medical condition should check with their doctor first." },
      { q: "Does it have beads inside?", a: "No. It is a chunky hand-knit — the weight comes from the cotton itself." },
      { q: "Is it hot?", a: "The open knit lets air through, so it sleeps cooler than most bead-filled weighted blankets." },
      RETURNS_FAQ,
    ],
    googleCategory: "Home & Garden > Linens & Bedding > Bedding > Blankets",
    pdp: {
      galleryFit: "cover",
      trust: [
        { icon: "weight", text: "Even 20 lb weight" },
        { icon: "leaf", text: "Hand-knitted cotton" },
        { icon: "cloud", text: "No beads, no filling" },
      ],
      howTo: { heading: "Care for the knit.", intro: "Spot clean, wash cold and gentle, always dry flat." },
      notice: { lead: "Not for young children.", text: "Check with a doctor first if you have a medical condition." },
    },
    contentGaps: ["Exact dimensions", "Cotton percentage", "GTIN / barcode"],
  },
  {
    handle: "ember-heated-blanket",
    slug: "ember-heated-blanket",
    legacySlugs: [],
    name: "Ember Heated Blanket",
    format: "Faux-fur heated blanket · lavender panel",
    category: { slug: "warming-cooling", name: "Warming & Cooling" },
    benefitLine:
      "Plush faux fur, six heat settings and a removable panel of real dried lavender that releases its scent as the blanket warms.",
    manufacturer: "Slumberlush",
    seo: {
      title: "Ember Heated Blanket — Faux Fur, 6 Heat Settings, Lavender",
      description:
        "A plush faux-fur heated blanket with six heat settings, 1–10 hour auto shut-off and a removable panel of natural dried lavender. Removable panels for easy washing.",
    },
    optionLabels: { Color: { label: "Colour", values: {} }, Size: { label: "Size", values: {} } },
    swatchOption: "Color",
    story: {
      heading: "Warmth, softness and a little lavender.",
      body: [
        "The Ember wraps you in plush vegan faux fur with six heat settings, so you choose exactly how warm it gets. Inside, a separate panel holds 100% natural dried lavender flowers that release a gentle scent as the blanket warms.",
        "Both the heating panel and the lavender panel are removable, so the cover goes in the wash on its own. A smart shut-off (1–10 hours) means you can drift off without a second thought.",
      ],
    },
    highlights: [
      { title: "Six heat settings", body: "Find the warmth that feels right." },
      { title: "Real lavender", body: "Dried lavender flowers in a removable panel." },
      { title: "Auto shut-off", body: "Set from 1 to 10 hours." },
      { title: "Washable cover", body: "Remove both panels and wash the cover." },
    ],
    steps: [
      { title: "Unplug and cool", body: "Disconnect the controller and let the blanket cool completely." },
      { title: "Remove the panels", body: "Unzip and take out the heating panel and the lavender panel." },
      { title: "Wash the cover", body: "Wash the faux-fur cover cold on a gentle cycle." },
      { title: "Dry fully", body: "Air dry completely before re-inserting the panels." },
    ],
    materials: [
      { name: "Vegan faux fur", detail: "100% polyester, cruelty-free plush." },
      { name: "Natural dried lavender", detail: "100% lavender flowers sewn into a removable inner panel." },
    ],
    specs: [
      { label: "Heat settings", value: "6" },
      { label: "Auto shut-off", value: "Adjustable, 1–10 hours" },
      { label: "Power cord", value: "9 ft" },
      { label: "Cover", value: "Faux fur, 100% polyester" },
    ],
    inTheBox: [
      { item: "Faux-fur cover", detail: "With removable heating and lavender panels" },
      { item: "Controller", detail: "With 9 ft power cord" },
    ],
    care: {
      note: "Always read the safety leaflet supplied with electrical products.",
      do: ["Unplug before cleaning", "Remove both panels before washing", "Dry completely before use"],
      dont: ["Wash the heating panel", "Use while wet", "Fold or crease while switched on"],
    },
    faqs: [
      { q: "Can I wash it?", a: "Yes — remove the heating and lavender panels and wash the cover on its own, cold and gentle. Never wash the heating panel." },
      { q: "Does the lavender scent fade?", a: "Natural lavender softens over time. The panel is removable so it stays out of the wash." },
      { q: "Does it switch itself off?", a: "Yes. Set the auto shut-off anywhere from 1 to 10 hours." },
      RETURNS_FAQ,
    ],
    googleCategory: "Home & Garden > Linens & Bedding > Bedding > Blankets > Electric Blankets",
    pdp: {
      galleryFit: "cover",
      trust: [
        { icon: "thermometer", text: "6 heat settings" },
        { icon: "flower", text: "Natural lavender" },
        { icon: "clock", text: "1–10 h auto off" },
      ],
      howTo: { heading: "Wash the cover, not the heater.", intro: "Unplug, remove both panels, wash the cover cold, dry fully." },
      notice: { lead: "Electrical product.", text: "Read the safety leaflet before first use." },
    },
    contentGaps: ["Exact dimensions per size", "Voltage / plug type per market", "Safety certifications"],
  },
  {
    handle: "moonlight-pj-set",
    slug: "moonlight-pj-set",
    legacySlugs: [],
    name: "Moonlight Long Sleeve PJ Set",
    format: "Modal jersey pyjamas · top + pant",
    category: { slug: "sleepwear", name: "Sleepwear" },
    badge: "Bestseller",
    benefitLine:
      "Buttery-soft modal jersey pyjamas with a notched collar and contrast piping — stretchy, breathable, second-skin soft from lights out to lazy morning.",
    manufacturer: "Slumberlush",
    seo: {
      title: "Moonlight Long Sleeve PJ Set — Buttery-Soft Modal Pyjamas",
      description:
        "Modal/spandex jersey pyjama set: notched-collar button-front top with contrast piping and relaxed drawstring pants. Breathable, stretchy, soft.",
    },
    optionLabels: { Color: { label: "Colour", values: {} }, Size: { label: "Size", values: {} } },
    swatchOption: "Color",
    story: {
      heading: "For people who take bedtime seriously.",
      body: [
        "Cut in a buttery modal/spandex jersey that stretches with you and breathes all night, with the details of a proper pyjama: notched collar, button front, patch pocket and contrast piping.",
        "A modesty button keeps the top closed, and the matching pants have a relaxed fit with an elasticated drawstring waist.",
      ],
    },
    highlights: [
      { title: "Second-skin modal", body: "Soft, stretchy and breathable jersey." },
      { title: "Classic details", body: "Notched collar, piping, patch pocket." },
      { title: "Modesty button", body: "Keeps the top closed while you sleep." },
      { title: "Drawstring pant", body: "Relaxed fit, elasticated waist." },
    ],
    steps: [
      { title: "Turn inside out", body: "Protects the surface of the jersey." },
      { title: "Wash cold", body: "Gentle cycle with similar colours." },
      { title: "Low or line dry", body: "Tumble dry low or hang to keep the fit." },
    ],
    materials: [{ name: "Modal/spandex jersey", detail: "A naturally soft, breathable modal blend with stretch." }],
    specs: [
      { label: "Fabric", value: "Modal/spandex jersey knit" },
      { label: "Top", value: "Notched collar, button front, modesty button, patch pocket" },
      { label: "Pant", value: "Relaxed fit, elasticated drawstring waist" },
    ],
    inTheBox: [
      { item: "Long sleeve top", detail: "Button front with contrast piping" },
      { item: "Pant", detail: "Drawstring waist" },
    ],
    care: { note: "Follow the care label.", do: ["Wash cold, inside out", "Tumble dry low or hang"], dont: ["Bleach", "High heat"] },
    faqs: [
      { q: "How does it fit?", a: "True to size with a relaxed, easy fit. Between sizes and like it roomy? Size up." },
      { q: "Is modal breathable?", a: "Yes — modal is a naturally breathable fibre, which is why it's a favourite for sleepwear." },
      RETURNS_FAQ,
    ],
    googleCategory: "Apparel & Accessories > Clothing > Sleepwear & Loungewear > Pajamas",
    pdp: {
      galleryFit: "cover",
      trust: [
        { icon: "moon", text: "Made for bedtime" },
        { icon: "feather", text: "Breathable modal" },
        { icon: "heart", text: "Second-skin stretch" },
      ],
      howTo: { heading: "Keep it buttery.", intro: "Inside out, cold wash, low dry." },
      notice: { lead: "Relaxed fit.", text: "Between sizes? Size up for a roomier feel." },
    },
    contentGaps: ["Exact modal/spandex percentage", "Size chart measurements"],
  },
  {
    handle: "moonlight-sleep-shirt",
    slug: "moonlight-sleep-shirt",
    legacySlugs: [],
    name: "Moonlight Sleep Shirt",
    format: "96% modal · extended length",
    category: { slug: "sleepwear", name: "Sleepwear" },
    benefitLine:
      "A long-sleeve, extended-length sleep shirt in 96% modal — naturally breathable, silky drape, and impossible to take off.",
    manufacturer: "Slumberlush",
    seo: {
      title: "Moonlight Sleep Shirt — 96% Modal Long Sleeve Nightshirt",
      description:
        "Long-sleeve sleep shirt in 96% modal, 4% spandex: extended length, notched collar, button front, patch pocket and contrast piping.",
    },
    optionLabels: { Color: { label: "Colour", values: {} }, Size: { label: "Size", values: {} } },
    swatchOption: "Color",
    story: {
      heading: "The upgrade from your old t-shirt.",
      body: [
        "96% modal and 4% spandex: naturally breathable, lightweight and silky, with a drape that gets better every wear.",
        "Long sleeves and a longer cut give full coverage without weight, finished with a notched collar, button front, chest pocket and contrast piping.",
      ],
    },
    highlights: [
      { title: "96% modal", body: "Breathable, lightweight, silky." },
      { title: "Extended length", body: "Covers more and moves better." },
      { title: "Long sleeve", body: "Coverage without the weight." },
      { title: "Contrast piping", body: "The detail that makes it." },
    ],
    steps: [
      { title: "Wash cold", body: "Gentle cycle, inside out." },
      { title: "Dry low", body: "Tumble low or hang." },
    ],
    materials: [{ name: "96% modal, 4% spandex", detail: "Naturally soft and breathable with a silky drape." }],
    specs: [
      { label: "Fabric", value: "96% modal, 4% spandex" },
      { label: "Details", value: "Notched collar, button front, patch pocket, contrast piping" },
    ],
    inTheBox: [{ item: "Sleep shirt", detail: "In your chosen size and colour" }],
    care: { note: "Follow the care label.", do: ["Wash cold, inside out", "Dry low or hang"], dont: ["Bleach", "High heat"] },
    faqs: [{ q: "How long is it?", a: "It's an extended-length cut designed to fall around mid-thigh, depending on height." }, RETURNS_FAQ],
    googleCategory: "Apparel & Accessories > Clothing > Sleepwear & Loungewear > Nightgowns",
    pdp: {
      galleryFit: "cover",
      trust: [
        { icon: "feather", text: "96% modal" },
        { icon: "moon", text: "Extended length" },
        { icon: "heart", text: "Silky drape" },
      ],
      howTo: { heading: "Easy care.", intro: "Cold wash, low dry." },
      notice: { lead: "Relaxed fit.", text: "Size down for a closer fit." },
    },
    contentGaps: ["Size chart measurements"],
  },

  /* ── Comfort ───────────────────────────────────────────────────────── */
  {
    handle: "dreamday-plush-robe",
    slug: "dreamday-plush-robe",
    legacySlugs: [],
    name: "Dreamday Plush Robe",
    format: "Calf-length plush robe · unisex",
    category: { slug: "robes", name: "Robes" },
    badge: "Bestseller",
    benefitLine:
      "An ultra-soft, calf-length plush robe with deep pockets and an adjustable tie — everyday luxury from the morning coffee to the evening wind-down.",
    manufacturer: "Slumberlush",
    seo: {
      title: "Dreamday Plush Robe — Ultra-Soft Calf-Length Unisex Robe",
      description:
        "Ultra-soft plush robe, calf length, adjustable tie waist and deep front pockets. Unisex fit in ten colours.",
    },
    optionLabels: { Color: { label: "Colour", values: {} }, Size: { label: "Size", values: {} } },
    swatchOption: "Color",
    story: {
      heading: "Like stepping into a warm towel that never gets cold.",
      body: [
        "Ultra-soft plush in a calf-length cut that hits past the knee for real coverage. The relaxed, unisex silhouette, adjustable tie and deep front pockets make it the robe you'll live in.",
      ],
    },
    highlights: [
      { title: "Ultra-soft plush", body: "Warm, cosy and heavy enough to feel special." },
      { title: "Calf length", body: "Hits past the knee." },
      { title: "Deep pockets", body: "Phone, remote, hands." },
      { title: "Unisex fit", body: "Relaxed silhouette for everyone." },
    ],
    steps: [
      { title: "Wash cold", body: "Gentle cycle with similar colours." },
      { title: "Tumble low", body: "Low heat keeps the plush fluffy." },
    ],
    materials: [{ name: "Plush fleece", detail: "Ultra-soft, warm polyester plush." }],
    specs: [
      { label: "Length", value: "Calf length" },
      { label: "Closure", value: "Adjustable tie waist" },
      { label: "Pockets", value: "Two deep front pockets" },
      { label: "Fit", value: "Unisex" },
    ],
    inTheBox: [{ item: "Robe", detail: "With matching tie belt" }],
    care: { note: "Follow the care label.", do: ["Wash cold", "Tumble dry low"], dont: ["Bleach", "Fabric softener", "Iron"] },
    faqs: [{ q: "How does the unisex sizing work?", a: "It's a relaxed unisex fit — choose your usual size; size down for a closer fit." }, RETURNS_FAQ],
    googleCategory: "Apparel & Accessories > Clothing > Sleepwear & Loungewear > Robes",
    pdp: {
      galleryFit: "cover",
      trust: [
        { icon: "cloud", text: "Ultra-soft plush" },
        { icon: "users", text: "Unisex fit" },
        { icon: "gift", text: "Our top gift" },
      ],
      howTo: { heading: "Keep it fluffy.", intro: "Cold wash, low tumble, no softener." },
      notice: { lead: "Relaxed unisex fit.", text: "Size down for a closer fit." },
    },
    contentGaps: ["Fabric composition", "Size chart measurements"],
  },
  {
    handle: "moonlight-lounge-robe",
    slug: "moonlight-lounge-robe",
    legacySlugs: [],
    name: "Moonlight Lounge Robe",
    format: "Lightweight modal jersey robe",
    category: { slug: "robes", name: "Robes" },
    benefitLine:
      "A silky, lightweight modal-jersey robe with a double-tie closure and contrast piping — the robe for warmer nights and getting ready.",
    manufacturer: "Slumberlush",
    seo: {
      title: "Moonlight Lounge Robe — Lightweight Silky Modal Robe",
      description:
        "Lightweight modal/spandex jersey robe: dropped shoulder, inner and outer tie, side pockets, contrast piping, calf length.",
    },
    optionLabels: { Color: { label: "Colour", values: {} }, Size: { label: "Size", values: {} } },
    swatchOption: "Color",
    story: {
      heading: "A second skin for slow mornings.",
      body: [
        "Cut in a lightweight, stretchy modal/spandex jersey with a silky hand. A dropped shoulder layers easily, and an inner plus outer tie keeps it closed while you move.",
      ],
    },
    highlights: [
      { title: "Silky modal", body: "Light, stretchy, breathable." },
      { title: "Double tie", body: "Inner and outer ties stay put." },
      { title: "Side pockets", body: "For hands or a phone." },
      { title: "Calf length", body: "Below the knee." },
    ],
    steps: [
      { title: "Wash cold", body: "Gentle cycle." },
      { title: "Dry low", body: "Tumble low or hang." },
    ],
    materials: [{ name: "Modal/spandex jersey", detail: "Lightweight, stretchy, silky." }],
    specs: [
      { label: "Fabric", value: "Modal/spandex jersey" },
      { label: "Closure", value: "Interior tie + outer tie belt" },
      { label: "Length", value: "Calf length" },
    ],
    inTheBox: [{ item: "Robe", detail: "With tie belt" }],
    care: { note: "Follow the care label.", do: ["Wash cold", "Dry low"], dont: ["Bleach", "High heat"] },
    faqs: [RETURNS_FAQ],
    googleCategory: "Apparel & Accessories > Clothing > Sleepwear & Loungewear > Robes",
    pdp: {
      galleryFit: "cover",
      trust: [
        { icon: "feather", text: "Lightweight modal" },
        { icon: "sun", text: "For warmer nights" },
        { icon: "heart", text: "Silky drape" },
      ],
      howTo: { heading: "Easy care.", intro: "Cold wash, low dry." },
      notice: { lead: "Lightweight robe.", text: "Want warmth? See the Dreamday Plush Robe." },
    },
    contentGaps: ["Exact fabric percentage", "Size chart measurements"],
  },
  {
    handle: "cloud-plush-slippers",
    slug: "cloud-plush-slippers",
    legacySlugs: [],
    name: "Cloud Plush Slippers",
    format: "Faux-fur slip-on · sherpa lined",
    category: { slug: "slippers-socks", name: "Slippers & Socks" },
    benefitLine:
      "Faux-fur plush slip-ons with a sherpa-lined sole and a hard outsole for the quick step outside.",
    manufacturer: "Slumberlush",
    seo: {
      title: "Cloud Plush Slippers — Faux Fur, Sherpa Lined Slip-On Slippers",
      description: "Faux-fur plush slip-on slippers with sherpa-lined inner sole, closed toe, open back and a hard outsole.",
    },
    optionLabels: { Color: { label: "Colour", values: {} }, Size: { label: "Size", values: {} } },
    swatchOption: "Color",
    story: {
      heading: "Built for the days that call for staying in.",
      body: ["A faux-fur upper that feels like sinking into a cloud, a warm sherpa footbed, and just enough sole to grab the post."],
    },
    highlights: [
      { title: "Faux-fur upper", body: "Plush and cloud-soft." },
      { title: "Sherpa footbed", body: "Warm cushioning underfoot." },
      { title: "Hard sole", body: "Fine for a quick step outside." },
      { title: "Slip-on", body: "Closed toe, open back." },
    ],
    steps: [{ title: "Spot clean", body: "Use a damp cloth and mild soap; air dry." }],
    materials: [{ name: "Faux fur + sherpa", detail: "Plush upper, sherpa-lined footbed." }],
    specs: [
      { label: "Upper", value: "Faux-fur plush" },
      { label: "Footbed", value: "Sherpa lined" },
      { label: "Sole", value: "Hard outsole" },
    ],
    inTheBox: [{ item: "Slippers", detail: "One pair" }],
    care: { note: "Spot clean only.", do: ["Spot clean", "Air dry"], dont: ["Machine wash", "Tumble dry"] },
    faqs: [{ q: "How do sizes work?", a: "Sizes are listed in women's (W) and men's (M) US sizes. Between sizes? Size up." }, RETURNS_FAQ],
    googleCategory: "Apparel & Accessories > Shoes > Slippers",
    pdp: {
      galleryFit: "cover",
      trust: [
        { icon: "cloud", text: "Faux-fur plush" },
        { icon: "thermometer", text: "Sherpa lined" },
        { icon: "shield", text: "Hard outsole" },
      ],
      howTo: { heading: "Spot clean only.", intro: "Damp cloth, mild soap, air dry." },
      notice: { lead: "US sizing.", text: "Between sizes? Size up." },
    },
    contentGaps: ["Size chart in cm"],
  },
  {
    handle: "crossover-plush-slippers",
    slug: "crossover-plush-slippers",
    legacySlugs: [],
    name: "Crossover Plush Slippers",
    format: "Open-toe faux-fur slipper",
    category: { slug: "slippers-socks", name: "Slippers & Socks" },
    benefitLine: "A crisscross faux-fur strap, a plush-lined footbed and a sturdy sole — open enough to breathe, plush enough to disappear into.",
    manufacturer: "Slumberlush",
    seo: {
      title: "Crossover Plush Slippers — Open-Toe Faux Fur Slippers",
      description: "Open-toe crossover faux-fur slippers with plush-lined footbed and a hard sole.",
    },
    optionLabels: { Color: { label: "Colour", values: {} }, Size: { label: "Size", values: {} } },
    swatchOption: "Color",
    story: { heading: "Pedicure-day approved.", body: ["A crossover strap keeps it secure while your toes stay free."] },
    highlights: [
      { title: "Crossover strap", body: "Open toe, secure fit." },
      { title: "Plush footbed", body: "Warm cushioning." },
      { title: "Hard sole", body: "Indoors and out." },
    ],
    steps: [{ title: "Spot clean", body: "Damp cloth, mild soap, air dry." }],
    materials: [{ name: "Faux fur", detail: "Plush crossover strap and lining." }],
    specs: [{ label: "Style", value: "Open toe crossover" }, { label: "Sole", value: "Hard outsole" }],
    inTheBox: [{ item: "Slippers", detail: "One pair" }],
    care: { note: "Spot clean only.", do: ["Spot clean", "Air dry"], dont: ["Machine wash"] },
    faqs: [RETURNS_FAQ],
    googleCategory: "Apparel & Accessories > Shoes > Slippers",
    pdp: {
      galleryFit: "cover",
      trust: [
        { icon: "cloud", text: "Faux-fur plush" },
        { icon: "sun", text: "Open toe" },
        { icon: "shield", text: "Hard outsole" },
      ],
      howTo: { heading: "Spot clean only.", intro: "Damp cloth, mild soap, air dry." },
      notice: { lead: "Women's sizing.", text: "S 5–6 · M 7–8 · L 9–10 · XL 11–12." },
    },
    contentGaps: [],
  },
  {
    handle: "marshmallow-slides",
    slug: "marshmallow-slides",
    legacySlugs: [],
    name: "Marshmallow Cloud Slides",
    format: "1.4″ cushioned EVA slides",
    category: { slug: "slippers-socks", name: "Slippers & Socks" },
    benefitLine: "Pillowy 1.4-inch EVA cushioning in a lightweight slip-on — the recovery slide you'll reach for every day.",
    manufacturer: "Slumberlush",
    seo: {
      title: "Marshmallow Cloud Slides — 1.4″ Cushioned Recovery Slides",
      description: "Lightweight slides with 1.4 inches of flexible EVA cushioning. Unisex sizing, dust bag included.",
    },
    optionLabels: { Color: { label: "Colour", values: {} }, Size: { label: "Size", values: {} } },
    swatchOption: "Color",
    story: { heading: "Step into something softer.", body: ["1.4 inches of flexible EVA cushion, no straps to fuss with, and a barely-there weight."] },
    highlights: [
      { title: "1.4″ cushion", body: "Flexible EVA foam." },
      { title: "Lightweight", body: "Barely-there feel." },
      { title: "Unisex sizing", body: "Women's and men's sizes." },
      { title: "Dust bag", body: "Included." },
    ],
    steps: [{ title: "Rinse", body: "Rinse with water and mild soap; air dry out of direct sun." }],
    materials: [{ name: "EVA foam", detail: "Lightweight, flexible, water-friendly." }],
    specs: [{ label: "Cushion", value: "1.4″ EVA" }, { label: "Fit", value: "Unisex" }],
    inTheBox: [
      { item: "Slides", detail: "One pair" },
      { item: "Dust bag", detail: "For storage and travel" },
    ],
    care: { note: "Water-friendly EVA.", do: ["Rinse clean", "Air dry in shade"], dont: ["Leave in direct sun or a hot car"] },
    faqs: [{ q: "Can I wear them in the shower?", a: "Yes — EVA is water-friendly. Rinse and air dry." }, RETURNS_FAQ],
    googleCategory: "Apparel & Accessories > Shoes > Sandals",
    pdp: {
      galleryFit: "cover",
      trust: [
        { icon: "cloud", text: "1.4″ cushioning" },
        { icon: "feather", text: "Lightweight" },
        { icon: "droplet", text: "Water friendly" },
      ],
      howTo: { heading: "Rinse and go.", intro: "Rinse with mild soap, air dry in shade." },
      notice: { lead: "Unisex sizing.", text: "Each size covers a women's and men's range." },
    },
    contentGaps: [],
  },
  {
    handle: "cozy-scrunch-socks",
    slug: "cozy-scrunch-socks",
    legacySlugs: [],
    name: "Cozy Scrunch Socks",
    format: "Soft stretch cotton blend",
    category: { slug: "slippers-socks", name: "Slippers & Socks" },
    benefitLine: "Ultra-soft, stretchy cotton-blend socks to wear pulled up, slouched or scrunched.",
    manufacturer: "Slumberlush",
    seo: { title: "Cozy Scrunch Socks — Soft Stretch Cotton Blend", description: "Ultra-soft stretch cotton-blend scrunch socks. Wear scrunched, slouched or straight." },
    optionLabels: { Color: { label: "Colour", values: {} }, Size: { label: "Size", values: {} } },
    swatchOption: "Color",
    story: { heading: "Basics should never be boring.", body: ["Soft, stretchy and cosy enough for a duvet day."] },
    highlights: [
      { title: "Soft stretch", body: "Cotton-blend comfort." },
      { title: "Wear it your way", body: "Scrunched, slouched or straight." },
    ],
    steps: [{ title: "Wash warm", body: "Machine wash, tumble dry low." }],
    materials: [{ name: "Cotton blend", detail: "Ultra-soft, stretchy." }],
    specs: [{ label: "Fabric", value: "Stretch cotton blend" }],
    inTheBox: [{ item: "Socks", detail: "One pair" }],
    care: { note: "Follow the care label.", do: ["Machine wash", "Tumble low"], dont: ["Bleach"] },
    faqs: [RETURNS_FAQ],
    googleCategory: "Apparel & Accessories > Clothing > Underwear & Socks > Socks",
    pdp: {
      galleryFit: "cover",
      trust: [
        { icon: "cloud", text: "Ultra-soft" },
        { icon: "heart", text: "Stretchy fit" },
        { icon: "wash", text: "Machine washable" },
      ],
      howTo: { heading: "Easy care.", intro: "Machine wash, tumble low." },
      notice: { lead: "A perfect add-on.", text: "Pairs with any slipper." },
    },
    contentGaps: ["Exact fibre composition"],
  },
];

export const STORE_HANDLES: readonly string[] = products.map((p) => p.handle);

export function productContentBySlug(slug: string): ProductContent | undefined {
  return products.find((p) => p.slug === slug);
}

/** A legacy slug's canonical product, for a 301 redirect — undefined if `slug` is current or unknown. */
export function productContentByLegacySlug(slug: string): ProductContent | undefined {
  return products.find((p) => p.legacySlugs.includes(slug));
}

export function productContentByHandle(handle: string): ProductContent | undefined {
  return products.find((p) => p.handle === handle);
}
