/**
 * The Sleep Journal (/guides/[slug]). Evergreen, practical guides written to
 * the claims rules: general advice, no medical claims. Each guide opens with
 * a 2–4 sentence direct answer (the AEO summary that answer engines quote).
 */

export type GuideBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "note"; title: string; text: string };

export type GuideSection = { heading: string; blocks: GuideBlock[] };

export type Guide = {
  slug: string;
  title: string;
  description: string;
  /** 2–4 sentence direct answer shown at the top. */
  summary: string;
  readingMinutes: number;
  published: string;
  updated: string;
  topic: "Better sleep" | "Bedding & sizing" | "Care";
  sections: GuideSection[];
  faqs?: { q: string; a: string }[];
  /** Product slugs featured in the guide. */
  products: string[];
  related: string[];
};

export const guides: Guide[] = [
  {
    slug: "better-sleep-routine",
    title: "A calmer wind-down: building a better sleep routine",
    description:
      "A simple, realistic evening routine for winding down — light, temperature, screens and the comfort cues that tell your body it's time to rest.",
    summary:
      "A good wind-down starts 60–90 minutes before bed: dim the lights, keep the bedroom cool (around 16–19 °C / 60–67 °F), put screens away and repeat the same small cues every night — a warm shower, soft sleepwear, a favourite blanket. Consistency matters more than any single trick.",
    readingMinutes: 6,
    published: "2026-09-30",
    updated: "2026-09-30",
    topic: "Better sleep",
    sections: [
      {
        heading: "Why a routine helps",
        blocks: [
          { type: "p", text: "Your body likes patterns. When the same small actions happen in the same order each evening, they become cues that the day is ending. You don't need a long ritual — you need a repeatable one." },
        ],
      },
      {
        heading: "The 60-minute wind-down",
        blocks: [
          {
            type: "ol",
            items: [
              "60 minutes before bed: dim the main lights and switch to lamps.",
              "45 minutes: a warm shower or bath, then change into soft, breathable sleepwear.",
              "30 minutes: screens away. Read, stretch, journal or listen to something calm.",
              "15 minutes: prepare the bed — cool room, fresh pillow, blanket within reach.",
              "Lights out at roughly the same time every night, weekends included where you can.",
            ],
          },
          { type: "note", title: "Start with one change", text: "Pick the step that feels easiest and do it for a week before adding another. Routines stick when they feel effortless." },
        ],
      },
      {
        heading: "Make the bedroom feel like rest",
        blocks: [
          {
            type: "ul",
            items: [
              "Temperature: slightly cool is usually most comfortable. Layer blankets so you can adjust in the night.",
              "Darkness: blackout curtains or a soft sleep mask block early light.",
              "Texture: soft, breathable fabrics against your skin feel calmer than scratchy or synthetic-heavy ones.",
              "Clutter: a tidy, simple space reads as restful.",
            ],
          },
        ],
      },
      {
        heading: "When to ask for help",
        blocks: [
          { type: "p", text: "If you regularly struggle to fall or stay asleep, or feel exhausted despite a full night in bed, talk to a doctor. Comfort products can make the bedroom more pleasant, but they are not a treatment for sleep conditions." },
        ],
      },
    ],
    faqs: [
      { q: "What is the best temperature for sleep?", a: "Many people sleep best in a slightly cool room, around 16–19 °C (60–67 °F). Layering lets you adjust without getting up." },
      { q: "How long before bed should I stop using screens?", a: "Around 30–60 minutes is a common recommendation; swap scrolling for reading, stretching or music." },
    ],
    products: ["cloud-dreamer-blanket", "moonlight-pj-set", "weighted-calm-blanket"],
    related: ["sleeping-hot-or-cold", "choosing-a-weighted-blanket"],
  },
  {
    slug: "blanket-size-guide",
    title: "Blanket size guide: throw, twin, queen or king?",
    description: "How to choose the right blanket size for your sofa or bed, with exact dimensions and when to size up.",
    summary:
      "For the sofa, a throw (about 50″×60″) covers one person. For a bed, match your mattress: twin 60″×80″, queen 90″×90″, king 100″×108″. Size up if you share, love to cocoon, or want the blanket to drape over the sides of the bed.",
    readingMinutes: 3,
    published: "2026-09-30",
    updated: "2026-09-30",
    topic: "Bedding & sizing",
    sections: [
      {
        heading: "The sizes at a glance",
        blocks: [
          {
            type: "ul",
            items: [
              "Throw — 50″ × 60″ (127 × 152 cm): sofa, reading chair, one person.",
              "Twin — 60″ × 80″ (152 × 203 cm): twin beds, sharing the sofa.",
              "Queen — 90″ × 90″ (229 × 229 cm): queen beds, two people.",
              "King — 100″ × 108″ (254 × 274 cm): king beds, full coverage with drape.",
            ],
          },
        ],
      },
      {
        heading: "When to size up",
        blocks: [
          { type: "p", text: "Blankets that only just cover the mattress top leave cold edges and get pulled off in the night. If you share, toss and turn, or like to tuck in, choose one size larger than your mattress." },
        ],
      },
    ],
    faqs: [
      { q: "What size is a throw blanket?", a: "Most throws are around 50″ × 60″ (127 × 152 cm) — big enough to cover one adult on a sofa." },
      { q: "Can I use a queen blanket on a king bed?", a: "It will cover the top of the mattress, but won't drape over the sides. For full coverage choose a king." },
    ],
    products: ["cloud-dreamer-blanket"],
    related: ["how-to-wash-a-plush-blanket", "better-sleep-routine"],
  },
  {
    slug: "choosing-a-weighted-blanket",
    title: "How to choose a weighted blanket",
    description: "Weight, size and fabric: a straightforward guide to picking a weighted blanket you'll actually use.",
    summary:
      "A common guide is a weighted blanket around 10% of your body weight, sized to cover you rather than the whole bed. Knitted blankets breathe better than bead-filled ones. Weighted blankets aren't suitable for young children, and anyone with a medical condition should check with a doctor first.",
    readingMinutes: 4,
    published: "2026-09-30",
    updated: "2026-09-30",
    topic: "Better sleep",
    sections: [
      {
        heading: "Pick the weight",
        blocks: [
          { type: "p", text: "Most people start around 10% of their body weight, then adjust for preference. If you're between weights, the lighter option is easier to get used to." },
        ],
      },
      {
        heading: "Knit vs bead-filled",
        blocks: [
          {
            type: "ul",
            items: [
              "Chunky knit: the weight is the yarn itself, the open loops breathe, nothing can shift or leak.",
              "Bead-filled: glass or plastic beads in quilted pockets — even weight, but can feel warm and may rustle.",
            ],
          },
        ],
      },
      {
        heading: "Safety first",
        blocks: [
          { type: "note", title: "Not for young children", text: "Weighted blankets are not suitable for babies or young children. If you have a medical, circulatory or breathing condition, ask your doctor before using one." },
        ],
      },
    ],
    faqs: [
      { q: "What weight should my weighted blanket be?", a: "Around 10% of your body weight is a common starting point." },
      { q: "Are weighted blankets hot?", a: "Bead-filled ones can be; open chunky knits are more breathable." },
    ],
    products: ["weighted-calm-blanket"],
    related: ["better-sleep-routine", "sleeping-hot-or-cold"],
  },
  {
    slug: "how-to-wash-a-plush-blanket",
    title: "How to wash a plush blanket (and keep it soft)",
    description: "The simple way to wash a plush or microfibre blanket so it stays velvety soft for years.",
    summary:
      "Wash a plush blanket on its own in cold water on a gentle cycle, ideally in a large mesh laundry bag. Skip bleach and fabric softener, hang or lay flat to dry, then shake it out and brush the pile with your hand to restore the softness.",
    readingMinutes: 3,
    published: "2026-09-30",
    updated: "2026-09-30",
    topic: "Care",
    sections: [
      {
        heading: "Step by step",
        blocks: [
          {
            type: "ol",
            items: [
              "Shake the blanket outside to remove loose fluff and pet hair.",
              "Place it in a large mesh laundry bag.",
              "Wash cold on a gentle cycle, on its own, with a small amount of mild detergent.",
              "Skip fabric softener — it coats the fibres and flattens the plush.",
              "Hang or lay flat to dry, away from direct heat.",
              "Once dry, shake it out and brush the pile with your hand or a soft brush.",
            ],
          },
          { type: "note", title: "Why no softener?", text: "Softener leaves a waxy film on microfibre that makes the pile clump and feel less soft over time." },
        ],
      },
    ],
    faqs: [
      { q: "Can I tumble dry a plush blanket?", a: "Hanging to dry is best. High heat can flatten or melt microfibre pile." },
      { q: "How often should I wash my blanket?", a: "Every two to four weeks with daily use, more often with pets." },
    ],
    products: ["cloud-dreamer-blanket", "ember-heated-blanket"],
    related: ["blanket-size-guide"],
  },
  {
    slug: "sleeping-hot-or-cold",
    title: "Sleeping hot or cold? How to layer your bed",
    description: "Practical layering for hot sleepers, cold sleepers and couples who disagree about the thermostat.",
    summary:
      "Layer instead of relying on one heavy duvet: a breathable sheet, a light blanket and an extra throw you can add or remove. Hot sleepers do best with breathable fabrics like modal and open knits; cold sleepers can add plush layers or a heated blanket with a timer.",
    readingMinutes: 4,
    published: "2026-09-30",
    updated: "2026-09-30",
    topic: "Better sleep",
    sections: [
      {
        heading: "For hot sleepers",
        blocks: [
          {
            type: "ul",
            items: [
              "Choose breathable sleepwear — modal jersey drapes and lets air move.",
              "Swap a heavy duvet for a lighter layer plus a throw you can kick off.",
              "Keep the room slightly cool and the air moving.",
            ],
          },
        ],
      },
      {
        heading: "For cold sleepers",
        blocks: [
          {
            type: "ul",
            items: [
              "Add a plush blanket on top of your duvet — plush traps warmth well.",
              "Warm feet first: socks or slippers before bed help you feel warmer overall.",
              "A heated blanket with an auto shut-off can warm the bed before you get in.",
            ],
          },
        ],
      },
      {
        heading: "For couples",
        blocks: [
          { type: "p", text: "Use separate top layers. A shared sheet and duvet with individual throws lets each person adjust without a negotiation at 2 a.m." },
        ],
      },
    ],
    faqs: [{ q: "What fabric is best for hot sleepers?", a: "Breathable fibres such as modal, cotton and open knits." }],
    products: ["moonlight-sleep-shirt", "ember-heated-blanket", "cloud-dreamer-blanket"],
    related: ["better-sleep-routine", "choosing-a-weighted-blanket"],
  },
];

export function guideBySlug(slug: string) {
  return guides.find((g) => g.slug === slug);
}
