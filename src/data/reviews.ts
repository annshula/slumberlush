/**
 * PLACEHOLDER review sets for the Slumberlush catalogue.
 *
 * These exist so the review surfaces — the rating chip above the title, the
 * buy-box carousel and the review feed with its filters — can be built and
 * demoed before Judge.me has verified-buyer reviews to serve.
 *
 * TWO RULES that must hold while this file exists:
 *  1. **UI only.** Never handed to `productSchema`: no schema.org
 *     `Review`/`AggregateRating` is emitted from placeholder content.
 *  2. **Claim rules.** What a customer noticed — never a medical or sleep
 *     outcome, never an absolute.
 *
 * Delete this file and its call sites once real reviews exist.
 *
 * Generation is deterministic (seeded PRNG, fixed anchor date) so the server
 * and the browser produce identical data and hydration stays clean.
 */

import { summarize, type ProductReviews, type Review } from "@/lib/judgeme/types";

type Rating = Review["rating"];
type Pools = Record<Rating, string[]>;

/** Date of the newest review, fixed so both renderers agree. */
const ANCHOR = Date.UTC(2026, 8, 28, 12, 0, 0);
const DAY = 86_400_000;

/* ── Copy pools ───────────────────────────────────────────────────────── */

const BLANKET_OPENERS: Pools = {
  5: [
    "Genuinely the softest thing I own — I didn't think a blanket could feel like this.",
    "Bought the throw for the sofa and immediately ordered the king for our bed.",
    "My partner and I now fight over it every single night.",
    "It feels like being hugged by a cloud. The stretch is the secret.",
    "Washed it three times now and it's still as soft as the day it arrived.",
    "The colour is even prettier in person, and it's so velvety on both sides.",
    "I'm always cold in the evenings and this has become my permanent sofa companion.",
    "Got it as a gift for my mum and she hasn't stopped texting me about it.",
    "The queen size drapes over the edges of the bed perfectly — no cold spots.",
    "Our dog has claimed one, so we bought a second. Worth every penny.",
    "Heavy enough to feel cosy, light enough that I don't overheat.",
    "Every guest who sits on our sofa asks where it's from.",
  ],
  4: [
    "Incredibly soft. Took a wash or two to fully fluff up, but now it's perfect.",
    "Love it — I'd size up next time, the throw is cosy but I like to cocoon.",
    "Beautiful and warm. A bit warm for summer nights, which is fair.",
    "Very soft, the colour was a touch darker than on my screen.",
    "Great blanket, delivery took a few days longer than I expected.",
  ],
  3: [
    "Soft, but bigger and heavier than I imagined for the sofa.",
    "Nice blanket, though I wish there were more neutral colours.",
    "Good quality, just a little warm for me as I sleep hot.",
  ],
  2: ["The plush flattened in one spot after I used fabric softener — my fault, but be warned."],
  1: ["The parcel was delayed twice and arrived damp. Customer care replaced it though."],
};

const BLANKET_CLOSERS: Pools = {
  5: [
    "Already planning to buy another colour.",
    "Best purchase I've made for the house this year.",
    "Fluffs right back up after the wash.",
    "Ten out of ten, would cocoon again.",
    "Absolutely worth it.",
  ],
  4: ["Would still recommend.", "Very happy overall."],
  3: [],
  2: [],
  1: [],
};

const BLANKET_TITLES: Pools = {
  5: ["Softest blanket ever", "Obsessed", "Cloud in blanket form", "Family favourite", "Worth every penny", "Perfect gift"],
  4: ["Really lovely", "So soft", "Great blanket"],
  3: ["Nice but warm", "Good, not perfect"],
  2: ["Careful with softener"],
  1: ["Delivery trouble"],
};

const WEAR_OPENERS: Pools = {
  5: [
    "The fabric is unreal — buttery and soft without feeling flimsy.",
    "I live in this from the moment I get home until the next morning.",
    "Fits true to size and the colour is gorgeous in person.",
    "Feels like a hotel spa, but in my own living room.",
    "Washed it several times and it still looks brand new.",
    "Bought one for me and one for my sister — we both love them.",
    "The little details like the piping make it feel really special.",
    "Finally something I'm happy to answer the door in.",
  ],
  4: [
    "Lovely and soft, runs slightly roomy — I'd size down next time.",
    "Really comfortable, I wish the pockets were a touch deeper.",
    "Gorgeous colour, needs a low tumble or it creases.",
  ],
  3: ["Comfortable, but the sleeves are longer than I'd like.", "Nice fabric, sizing ran big on me."],
  2: ["Fit wasn't right for me; the exchange was easy though."],
  1: ["Wrong size arrived; support sorted it but it took a week."],
};

const WEAR_CLOSERS: Pools = {
  5: ["Ordering another colour.", "My new favourite thing to wear.", "Can't recommend enough."],
  4: ["Still a great buy."],
  3: [],
  2: [],
  1: [],
};

const WEAR_TITLES: Pools = {
  5: ["Buttery soft", "Living in it", "So comfortable", "Perfect gift", "Love the details"],
  4: ["Runs a little big", "Lovely"],
  3: ["Okay fit"],
  2: ["Sizing"],
  1: ["Wrong size"],
};

const FEET_OPENERS: Pools = {
  5: [
    "Like walking on marshmallows — my feet thank me every morning.",
    "So plush and warm, and the sole means I can take the bins out.",
    "I bought these for winter and now I wear them all year.",
    "True to size and so comfortable straight out of the box.",
    "My whole family has a pair now. Peak cosy.",
    "They match my blanket, which makes me unreasonably happy.",
  ],
  4: ["Very comfy, I'd size up if between sizes.", "Lovely and soft, the faux fur sheds a little at first."],
  3: ["Comfortable, but a bit warm for summer.", "Nice, though the back sits slightly loose on me."],
  2: ["Too narrow for my feet, returned for a bigger size."],
  1: ["The pair arrived in two different sizes. Support fixed it."],
};

const FEET_CLOSERS: Pools = {
  5: ["Best slippers I've owned.", "Buying another pair as a gift.", "Instant comfort."],
  4: ["Would buy again."],
  3: [],
  2: [],
  1: [],
};

const FEET_TITLES: Pools = {
  5: ["Walking on clouds", "So cosy", "Obsessed", "Family favourite"],
  4: ["Comfy", "Size up"],
  3: ["Okay"],
  2: ["Too narrow"],
  1: ["Mixed sizes"],
};

const NAMES = [
  "Emma Collins", "Sophie Turner", "Olivia Hart", "Grace Mitchell", "Hannah Lee", "Chloe Bennett",
  "Amelia Ward", "Isabella Cruz", "Mia Thompson", "Lily Evans", "Zara Khan", "Priya Patel",
  "Nina Petrova", "Laura Schmidt", "Rachel Green", "Jess Morgan", "Ella Watson", "Ava Robinson",
  "Daniel Reid", "James Carter", "Tom Hughes", "Ethan Brooks", "Farah Aziz", "Julia Moreau",
  "Sam Whitaker", "Ingrid Haugen", "Carlos Medina", "Ruth Adeyemi", "Megan Doyle", "Arjun Mehta",
  "Clara Fontaine", "Liam Doherty", "Beatriz Silva", "Katie Nolan", "Sara Kowalski", "Noor Rahman",
  "Emilia Rossi", "Tessa Brandt", "Marta Nowak", "Erin Connolly", "Gemma Wilde", "Lucas Meyer",
];

const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "Ireland", "New Zealand",
  "Germany", "France", "Netherlands", "Sweden",
];

/** Small deterministic PRNG (mulberry32) — same numbers on server and client. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(items: readonly T[], rand: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    const a = out[i]!;
    out[i] = out[j]!;
    out[j] = a;
  }
  return out;
}

/** Walks a pool so a text repeats only after the whole pool is used. */
function pick(pool: string[], n: number): string | null {
  if (pool.length === 0) return null;
  return pool[(n + Math.floor(n / pool.length)) % pool.length]!;
}

type ReviewSet = {
  handle: string;
  seed: number;
  mix: { rating: Rating; count: number }[];
  openers: Pools;
  closers: Pools;
  titles: Pools;
};

function build(set: ReviewSet): Review[] {
  const rand = mulberry32(set.seed);
  const ratings = shuffled(
    set.mix.flatMap(({ rating, count }) => Array.from({ length: count }, () => rating)),
    rand,
  );
  const names = shuffled(NAMES, rand);
  const countries = shuffled(COUNTRIES, rand);
  const openers: Pools = {
    5: shuffled(set.openers[5], rand),
    4: shuffled(set.openers[4], rand),
    3: set.openers[3],
    2: set.openers[2],
    1: set.openers[1],
  };
  const used: Record<Rating, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  return ratings.map((rating, i) => {
    const n = used[rating];
    used[rating] = n + 1;
    const parts = names[i % names.length]!.split(" ");
    const author = `${parts[0]} ${parts[parts.length - 1]![0]!.toUpperCase()}.`;
    const opener = pick(openers[rating], n) ?? "";
    const closer = pick(set.closers[rating], n * 5);
    return {
      id: `demo-${set.handle}-${i + 1}`,
      rating,
      title: rand() < 0.5 ? pick(set.titles[rating], n) : null,
      body: closer ? `${opener} ${closer}` : opener,
      author,
      country: countries[i % countries.length]!,
      createdAt: new Date(ANCHOR - (i * 1.1 + rand()) * DAY).toISOString(),
      images: [],
    };
  });
}

const mix = (five: number, four: number, three: number, two: number, one: number) => [
  { rating: 5 as const, count: five },
  { rating: 4 as const, count: four },
  { rating: 3 as const, count: three },
  { rating: 2 as const, count: two },
  { rating: 1 as const, count: one },
];

const BLANKET = { openers: BLANKET_OPENERS, closers: BLANKET_CLOSERS, titles: BLANKET_TITLES };
const WEAR = { openers: WEAR_OPENERS, closers: WEAR_CLOSERS, titles: WEAR_TITLES };
const FEET = { openers: FEET_OPENERS, closers: FEET_CLOSERS, titles: FEET_TITLES };

const SETS: ReviewSet[] = [
  { handle: "cloud-dreamer-blanket", seed: 20261001, mix: mix(462, 31, 7, 2, 2), ...BLANKET },
  { handle: "weighted-calm-blanket", seed: 20261002, mix: mix(118, 14, 4, 1, 1), ...BLANKET },
  { handle: "ember-heated-blanket", seed: 20261003, mix: mix(86, 9, 3, 1, 1), ...BLANKET },
  { handle: "dreamday-plush-robe", seed: 20261004, mix: mix(204, 18, 5, 2, 1), ...WEAR },
  { handle: "moonlight-lounge-robe", seed: 20261005, mix: mix(77, 9, 3, 1, 0), ...WEAR },
  { handle: "moonlight-pj-set", seed: 20261006, mix: mix(196, 17, 6, 2, 1), ...WEAR },
  { handle: "moonlight-sleep-shirt", seed: 20261007, mix: mix(91, 8, 3, 1, 0), ...WEAR },
  { handle: "cloud-plush-slippers", seed: 20261008, mix: mix(143, 12, 4, 1, 1), ...FEET },
  { handle: "crossover-plush-slippers", seed: 20261009, mix: mix(64, 7, 2, 1, 0), ...FEET },
  { handle: "marshmallow-slides", seed: 20261010, mix: mix(171, 15, 5, 2, 1), ...FEET },
  { handle: "cozy-scrunch-socks", seed: 20261011, mix: mix(52, 6, 2, 0, 0), ...FEET },
];

const cache = new Map<string, ProductReviews>();

/** Placeholder set for a product handle, or null when we don't have one for it. Built lazily. */
export function demoReviewsFor(handle: string): ProductReviews | null {
  const hit = cache.get(handle);
  if (hit) return hit;
  const set = SETS.find((s) => s.handle === handle);
  if (!set) return null;
  const reviews = build(set);
  const value = { reviews, summary: summarize(reviews) };
  cache.set(handle, value);
  return value;
}

/** Store-wide headline numbers for the home page social proof (placeholder). */
export function demoStoreRating(): { average: number; count: number } {
  let total = 0;
  let count = 0;
  for (const s of SETS) {
    for (const m of s.mix) {
      total += m.rating * m.count;
      count += m.count;
    }
  }
  return { average: Math.round((total / count) * 10) / 10, count };
}

/** A few 5★ blanket reviews for the home page wall. */
export function demoHighlights(limit = 6): (Review & { handle: string })[] {
  const out: (Review & { handle: string })[] = [];
  const seen = new Set<string>();
  const handles = ["cloud-dreamer-blanket", "dreamday-plush-robe", "cloud-plush-slippers", "moonlight-pj-set", "weighted-calm-blanket", "marshmallow-slides"];
  for (const handle of handles) {
    const r = demoReviewsFor(handle)?.reviews.find(
      (x) => x.rating === 5 && x.title && !seen.has(x.title) && !seen.has(x.body),
    );
    if (!r) continue;
    seen.add(r.title!);
    seen.add(r.body);
    out.push({ ...r, handle });
  }
  return out.slice(0, limit);
}

/** Back-compat export: the hero product's set. */
export const demoReviews: ProductReviews = demoReviewsFor("cloud-dreamer-blanket")!;
