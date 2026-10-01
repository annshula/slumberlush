/**
 * Site navigation. The Shop menu is built from content/collections.ts (Sleep
 * and Comfort columns); these groups cover everything else.
 */

export type NavLink = { label: string; href: string; description?: string };
export type NavGroup = {
  label: string;
  href?: string;
  links: NavLink[];
  /**
   * Mobile menu only: tapping the group goes straight to `href` instead of
   * expanding its links.
   */
  mobileDirect?: boolean;
  /** Desktop: render the Sleep/Comfort mega panel instead of a link list. */
  mega?: "sleep" | "comfort";
};

export const primaryNav: NavGroup[] = [
  {
    label: "Sleep",
    href: "/collections/blankets",
    mega: "sleep",
    links: [
      { label: "Blankets", href: "/collections/blankets", description: "Plush, oversized, machine washable" },
      { label: "Weighted Blankets", href: "/collections/weighted-blankets", description: "Even, grounding weight" },
      { label: "Pillows", href: "/collections/pillows", description: "Bed, body & lounge pillows" },
      { label: "Bedding", href: "/collections/bedding", description: "Sheets, duvets, quilts" },
      { label: "Mattress Toppers", href: "/collections/mattress", description: "Toppers & protectors" },
      { label: "Warming & Cooling", href: "/collections/warming-cooling", description: "Heated & cooling sleep" },
      { label: "Sleepwear", href: "/collections/sleepwear", description: "Buttery modal pyjamas" },
      { label: "Sleep Masks", href: "/collections/sleep-masks", description: "Blackout & silky" },
    ],
  },
  {
    label: "Comfort",
    href: "/collections/robes",
    mega: "comfort",
    links: [
      { label: "Throws & Cushions", href: "/collections/throws-cushions", description: "Throws, cushions, bolsters" },
      { label: "Wearable Blankets", href: "/collections/wearable-blankets", description: "A blanket with sleeves" },
      { label: "Robes", href: "/collections/robes", description: "Plush & silky robes" },
      { label: "Slippers & Socks", href: "/collections/slippers-socks", description: "Faux fur & cloud slides" },
    ],
  },
  { label: "Bestseller", href: "/products/cloud-dreamer-blanket", links: [] },
  {
    label: "Sleep Journal",
    href: "/guides",
    links: [
      { label: "Better sleep routine", href: "/guides/better-sleep-routine", description: "A calmer wind-down, step by step" },
      { label: "Blanket size guide", href: "/guides/blanket-size-guide", description: "Throw, twin, queen or king?" },
      { label: "Choosing a weighted blanket", href: "/guides/choosing-a-weighted-blanket", description: "Weight, size and fabric" },
      { label: "Washing a plush blanket", href: "/guides/how-to-wash-a-plush-blanket", description: "Keep it cloud-soft" },
      { label: "Sleeping hot or cold?", href: "/guides/sleeping-hot-or-cold", description: "Layers for every sleeper" },
      { label: "FAQs", href: "/pages/faq", description: "Straight answers" },
    ],
  },
];

export const footerNav: NavGroup[] = [
  {
    label: "Sleep",
    links: [
      { label: "Blankets", href: "/collections/blankets" },
      { label: "Weighted Blankets", href: "/collections/weighted-blankets" },
      { label: "Pillows", href: "/collections/pillows" },
      { label: "Bedding", href: "/collections/bedding" },
      { label: "Sleepwear", href: "/collections/sleepwear" },
    ],
  },
  {
    label: "Comfort",
    links: [
      { label: "Throws & Cushions", href: "/collections/throws-cushions" },
      { label: "Robes", href: "/collections/robes" },
      { label: "Slippers & Socks", href: "/collections/slippers-socks" },
      { label: "Shop all", href: "/collections/all" },
    ],
  },
  {
    label: "Slumberlush",
    links: [
      { label: "Our story", href: "/pages/about" },
      { label: "Sleep Journal", href: "/guides" },
      { label: "FAQs", href: "/pages/faq" },
    ],
  },
  {
    label: "Customer care",
    links: [
      { label: "Contact", href: "/pages/contact" },
      { label: "Shipping", href: "/pages/shipping" },
      { label: "Returns & refunds", href: "/pages/refund-policy" },
      { label: "Your account", href: "/account" },
    ],
  },
];

export const legalNav: NavLink[] = [
  { label: "Privacy", href: "/pages/privacy-policy" },
  { label: "Terms", href: "/pages/terms-of-service" },
  { label: "Accessibility", href: "/pages/accessibility" },
];
