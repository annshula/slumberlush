import type {
  FeatureHighlightRecord,
  ImageRecord,
  ProductRecord,
  SpecRecord,
} from "@/lib/catalog/types";
import type { ProductContent } from "@/content/products";

/**
 * Client-safe product view: the minimal, serialisable shape the PDP islands,
 * product cards and the bag need. Built on the server from the Shopify record
 * + editorial content; nothing here trusts or exposes anything sensitive.
 */

export type ViewImage = {
  url: string;
  width: number;
  height: number;
  alt: string;
};
export type ViewVideo = {
  type: "video";
  poster: string;
  width: number;
  height: number;
  alt: string;
  sources: { src: string; type: string; width: number | null }[];
};
export type ViewMedia =
  | ({ type: "image" } & ViewImage & {
      variantId: string | null;
      /** Swatch value this photo belongs to (Shopify alt text = colour name), lowercased. */
      group: string | null;
    })
  | ViewVideo;

export type ViewSwatch = { value: string; label: string; image: string | null };

export type ViewVariant = {
  id: string;
  options: Record<string, string>;
  price: number;
  /** Shopify's own compare-at price for this variant, when it's genuinely higher than price. */
  compareAtPrice: number | null;
  /** Percent off compareAtPrice, when compareAtPrice exists. */
  compareAtPercent: number | null;
  availableForSale: boolean;
  sku: string | null;
  image: string | null;
  units: number;
  /** Saving vs buying `units` single sets, when > 0. */
  savings: number | null;
  perUnit: number;
  /** "Cappuccino · Queen · 90″×90″" */
  label: string;
};

export type ViewOption = {
  name: string;
  label: string;
  values: { value: string; label: string }[];
};

export type ProductView = {
  handle: string;
  slug: string;
  href: string;
  name: string;
  format: string;
  benefitLine: string;
  currency: string;
  options: ViewOption[];
  variants: ViewVariant[];
  defaultVariantId: string;
  fromPrice: number;
  /** Compare-at of the cheapest variant, for the card's strikethrough. */
  fromCompareAt: number | null;
  availableForSale: boolean;
  gallery: ViewMedia[];
  cardImage: ViewImage | null;
  cardImageAlt: ViewImage | null;
  packOptionName: string | null;
  /** Option rendered as photo swatches (e.g. "Color"), when the product has one. */
  swatchOptionName: string | null;
  /** One entry per swatch value, with its own photo. */
  swatches: ViewSwatch[];
  badge: string | null;
  categoryName: string;
  /** Shopify `custom.specs` metaobjects — the merchant's own spec sheet. */
  specs: SpecRecord[];
  /** Shopify `custom.feature_highlights` metaobjects — used for the alternating image section. */
  featureHighlights: FeatureHighlightRecord[];
  /** Shopify `custom.perks` metafield — short bullet claims shown under the product name. */
  perks: string[];
  /** Shopify `custom.sale_ends_at` metafield — set by the merchant, already filtered to future dates only. */
  saleEndsAt: string | null;
};

const fallbackSize = 1200;

function toImage(m: ImageRecord, alt: string): ViewImage {
  return {
    url: m.url,
    width: m.width ?? fallbackSize,
    height: m.height ?? fallbackSize,
    alt,
  };
}

const groupOf = (alt: string | null) =>
  alt ? alt.split(" / ")[0]!.trim().toLowerCase() : null;

/** Every media item Shopify has for this product, in Shopify's own order. */
function curateGallery(record: ProductRecord): ViewMedia[] {
  return record.media.map((m) => {
    if (m.type === "image") {
      return {
        type: "image",
        ...toImage(m, m.alt ? `${record.title} — ${m.alt}` : record.title),
        variantId: m.variantId,
        group: groupOf(m.alt),
      };
    }
    return {
      type: "video",
      poster: m.poster,
      width: m.width ?? 720,
      height: m.height ?? 1280,
      alt: m.alt ?? record.title,
      sources: m.sources,
    };
  });
}

export function buildProductView(
  record: ProductRecord,
  content: ProductContent,
  currency: string,
): ProductView {
  const packName = content.packOption?.name ?? null;
  const unitsFor = (options: Record<string, string>) =>
    packName ? (content.packOption?.units[options[packName] ?? ""] ?? 1) : 1;

  const labelFor = (name: string, value: string) =>
    content.optionLabels[name]?.values[value] ?? value;

  const variants: ViewVariant[] = record.variants.map((v) => {
    const units = unitsFor(v.options);
    const single =
      packName && units > 1
        ? record.variants.find(
            (o) =>
              unitsFor(o.options) === 1 &&
              Object.entries(v.options).every(
                ([k, val]) => k === packName || o.options[k] === val,
              ),
          )
        : undefined;
    const raw = single ? single.price * units - v.price : 0;
    const savings = raw > 0.009 ? Math.round(raw * 100) / 100 : null;
    const compareAtPercent =
      v.compareAtPrice != null && v.compareAtPrice > v.price
        ? Math.round((1 - v.price / v.compareAtPrice) * 100)
        : null;
    return {
      id: v.id,
      options: v.options,
      price: v.price,
      compareAtPrice: v.compareAtPrice,
      compareAtPercent,
      availableForSale: v.availableForSale,
      sku: v.sku,
      image: v.image,
      units,
      savings,
      perUnit: Math.round((v.price / units) * 100) / 100,
      label: record.options
        .filter((o) => o.values.length > 1)
        .map((o) => labelFor(o.name, v.options[o.name] ?? ""))
        .join(" · "),
    };
  });

  const options: ViewOption[] = record.options
    .filter((o) => o.values.length > 1)
    .map((o) => ({
      name: o.name,
      label: content.optionLabels[o.name]?.label ?? o.name,
      values: o.values.map((value) => ({
        value,
        label: labelFor(o.name, value),
      })),
    }));

  const available = variants.filter((v) => v.availableForSale);
  const defaultVariant =
    available.find((v) => v.units === 1) ?? available[0] ?? variants[0];

  const singles = variants.filter((v) => v.units === 1);
  const pool = singles.length ? singles : variants;
  const fromPrice = Math.min(...pool.map((v) => v.price));
  const cheapest = pool.find((v) => v.price === fromPrice);

  const gallery = curateGallery(record);
  const images = gallery.filter(
    (m): m is Extract<ViewMedia, { type: "image" }> => m.type === "image",
  );

  const swatchName =
    content.swatchOption &&
    record.options.some((o) => o.name === content.swatchOption && o.values.length > 1)
      ? content.swatchOption
      : null;
  const swatches: ViewSwatch[] = swatchName
    ? (record.options.find((o) => o.name === swatchName)?.values ?? []).map((value) => {
        const lower = value.toLowerCase();
        const photo =
          images.find((m) => m.group === lower)?.url ??
          variants.find((v) => v.options[swatchName] === value && v.image)?.image ??
          null;
        return { value, label: labelFor(swatchName, value), image: photo };
      })
    : [];

  /* Card photos: the default colour's first two shots, so the hover swap stays on-colour. */
  const defaultGroup = swatchName
    ? defaultVariant?.options[swatchName]?.toLowerCase()
    : null;
  const cardPool = defaultGroup
    ? images.filter((m) => m.group === defaultGroup)
    : images;
  const cardImages = cardPool.length >= 1 ? cardPool : images;

  return {
    handle: record.handle,
    slug: content.slug,
    href: `/products/${content.slug}`,
    name: record.title,
    format: content.format,
    benefitLine: content.benefitLine,
    currency,
    options,
    variants,
    defaultVariantId: defaultVariant?.id ?? "",
    fromPrice,
    fromCompareAt: cheapest?.compareAtPrice ?? null,
    availableForSale: record.availableForSale,
    gallery,
    cardImage: cardImages[0] ?? null,
    cardImageAlt: cardImages[1] ?? images[1] ?? null,
    packOptionName: packName,
    swatchOptionName: swatchName,
    swatches,
    badge: content.badge ?? null,
    categoryName: content.category.name,
    specs: record.specs,
    featureHighlights: record.featureHighlights,
    perks: record.perks,
    saleEndsAt: record.saleEndsAt,
  };
}
