/**
 * Ingredient entities (/ingredients/[slug]). General, widely documented
 * descriptions of what each ingredient is and why formulators use it — never
 * a claim about what it does in a specific Belurae product beyond "it is
 * listed as a key ingredient".
 */

export type Ingredient = {
  slug: string;
  name: string;
  /** Name as it typically appears on an INCI list. */
  inci: string;
  summary: string;
  whatItIs: string[];
  whyUsed: string[];
  goodToKnow: string[];
};

export const ingredients: Ingredient[] = [
  {
    slug: "aloe-leaf-water",
    name: "Aloe leaf water",
    inci: "Aloe Barbadensis Leaf Water",
    summary:
      "Aloe leaf water is the watery part of the aloe vera leaf, used in body-care formulas as a base ingredient with a soothing, conditioning feel.",
    whatItIs: [
      "Aloe vera (Aloe barbadensis) is a succulent plant whose thick leaves hold a clear gel and water. “Aloe leaf water” is that aqueous portion, processed for use in cosmetics.",
      "On an ingredient list it usually appears as Aloe Barbadensis Leaf Water. It is different from aloe leaf juice or aloe gel, which are more concentrated forms.",
    ],
    whyUsed: [
      "Formulators often use aloe leaf water in place of some of the plain water in a product, so it contributes to the product's texture and skin feel.",
      "It is popular in products used on freshly treated skin because of aloe's long history in soothing, after-sun style care.",
    ],
    goodToKnow: [
      "Being plant-derived doesn't make an ingredient suitable for everyone — some people are sensitive to plants in the lily family, which includes aloe.",
      "An ingredient's position on the list gives a rough idea of how much is present: ingredients are listed in descending order down to 1%.",
    ],
  },
  {
    slug: "glycerin",
    name: "Glycerin",
    inci: "Glycerin",
    summary:
      "Glycerin is a humectant — an ingredient that draws water into the outer layer of the skin. It is one of the most widely used ingredients in skin and body care.",
    whatItIs: [
      "Glycerin (also called glycerol) is a clear, odourless, slightly sweet liquid. It can be made from plant oils or produced synthetically.",
      "It is found in a huge range of products — cleansers, moisturisers, creams and hair-removal products alike.",
    ],
    whyUsed: [
      "As a humectant, glycerin attracts water, which helps keep the skin's surface hydrated and soft to the touch.",
      "It also helps products spread evenly and stops formulas from drying out.",
    ],
    goodToKnow: [
      "Glycerin is generally very well tolerated, which is part of why it is so common.",
      "It works best alongside ingredients that help skin hold on to the water it attracts.",
    ],
  },
  {
    slug: "hyaluronic-acid",
    name: "Hyaluronic acid",
    inci: "Hyaluronic Acid / Sodium Hyaluronate",
    summary:
      "Hyaluronic acid is a humectant that helps the skin's surface hold on to moisture. In cosmetics it is often used in its salt form, sodium hyaluronate.",
    whatItIs: [
      "Hyaluronic acid is a substance the body makes naturally; it is found in skin and connective tissue. For cosmetics it is usually produced by fermentation.",
      "On ingredient lists it may appear as Hyaluronic Acid or as Sodium Hyaluronate, its more commonly used salt form.",
    ],
    whyUsed: [
      "It binds water, so it is used to help skin feel hydrated and supple.",
      "In products that are applied and rinsed off, its role is mainly to support the skin's feel during and immediately after use.",
    ],
    goodToKnow: [
      "Hyaluronic acid is generally well tolerated.",
      "“Contains hyaluronic acid” says nothing on its own about how much is in a product — look at where it sits on the full ingredient list.",
    ],
  },
  {
    slug: "ginseng-extract",
    name: "Ginseng extract",
    inci: "Panax Ginseng Root Extract",
    summary:
      "Ginseng extract comes from the root of the ginseng plant and is used in skin and body care as a botanical ingredient.",
    whatItIs: [
      "Panax ginseng is a slow-growing plant whose root has been used in East Asian traditions for centuries. Cosmetic ginseng extract is made by extracting that root.",
      "On ingredient lists it usually appears as Panax Ginseng Root Extract.",
    ],
    whyUsed: [
      "Botanical extracts like ginseng are included for their skin-conditioning character and are common in Korean and Chinese-developed formulas.",
    ],
    goodToKnow: [
      "Plant extracts can occasionally cause sensitivity. A patch test before first use is the simplest way to check how your skin responds to a new product.",
    ],
  },
  {
    slug: "portulaca-oleracea-extract",
    name: "Portulaca oleracea extract",
    inci: "Portulaca Oleracea Extract",
    summary:
      "Portulaca oleracea extract comes from purslane, a common succulent plant, and is used in skin-care formulas as a conditioning botanical.",
    whatItIs: [
      "Portulaca oleracea — known as purslane — is a small, fleshy-leaved plant that grows in many parts of the world and is also eaten as a vegetable.",
      "Its extract is a familiar ingredient in products designed with sensitive-feeling skin in mind, especially in East Asian skin care.",
    ],
    whyUsed: [
      "Formulators include purslane extract for a calming, conditioning feel in leave-on and rinse-off products.",
    ],
    goodToKnow: [
      "As with any plant extract, individual reactions are possible — patch test new products.",
    ],
  },
  {
    slug: "egf",
    name: "EGF-related ingredients",
    inci: "Varies — often listed as an oligopeptide or polypeptide",
    summary:
      "EGF stands for epidermal growth factor, a protein the body makes naturally. In cosmetics, EGF-related ingredients are lab-made versions or relatives of it, and are marketed for skin conditioning.",
    whatItIs: [
      "Epidermal growth factor is a small protein found naturally in the body. Cosmetic versions are made in a laboratory, and on an ingredient list they often appear under names such as sh-Oligopeptide-1 or sh-Polypeptide-1.",
      "“EGF-related” is a broad phrase. The Belurae Editor listing doesn't say which specific ingredient is used, so we can't tell you the exact name or amount.",
    ],
    whyUsed: [
      "Brands include EGF-related ingredients in leave-on products such as toners and serums as part of a skin-conditioning positioning.",
    ],
    goodToKnow: [
      "We make no claim about what EGF does in this toner beyond the manufacturer listing it as a key ingredient. The full ingredient list will show exactly what is inside once we have it.",
    ],
  },
  {
    slug: "niacinamide",
    name: "Niacinamide",
    inci: "Niacinamide",
    summary:
      "Niacinamide is a form of vitamin B3 widely used in skin care as a conditioning ingredient.",
    whatItIs: [
      "Niacinamide (also called nicotinamide) is a water-soluble form of vitamin B3. It is a common ingredient in toners, serums and moisturisers.",
    ],
    whyUsed: [
      "Formulators use it to condition skin. The manufacturer says it helps improve the appearance of uneven skin tone in this toner.",
    ],
    goodToKnow: [
      "Niacinamide is generally well tolerated, but any active ingredient can bother some skin. A patch test before first use is the simplest check.",
    ],
  },
  {
    slug: "collagen",
    name: "Collagen",
    inci: "Hydrolyzed Collagen / Collagen",
    summary:
      "Collagen is a protein. In cosmetics it is used as a skin-conditioning ingredient that helps products feel smooth on the skin.",
    whatItIs: [
      "Collagen is the main structural protein in skin. Cosmetic collagen is usually broken down into smaller pieces (hydrolysed collagen) and comes from animal or marine sources.",
    ],
    whyUsed: [
      "In leave-on products it is used for its conditioning, smooth feel. The manufacturer says it supports a smooth, supple feel in this toner.",
    ],
    goodToKnow: [
      "Putting collagen on the skin is not the same as the body making its own collagen. Treat it as a conditioning ingredient.",
      "If the source matters to you (for example marine or animal), check the pack or ask us.",
    ],
  },
];

export function ingredientBySlug(slug: string): Ingredient | undefined {
  return ingredients.find((i) => i.slug === slug);
}
