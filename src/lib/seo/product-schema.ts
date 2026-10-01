import type { ProductContent } from "@/content/products";
import type { ProductView } from "@/lib/commerce/product-view";
import type { ReviewSummary } from "@/lib/judgeme/types";
import { ORG_ID } from "@/lib/seo/schema";
import { absoluteUrl, site } from "@/lib/site";

/**
 * Product JSON-LD built from the same view the page renders. Brand is the
 * manufacturer printed on the pack; Slumberlush is the seller (blueprint D1 interim).
 * One Offer per real variant. AggregateRating only with verified reviews — the
 * placeholder dataset in data/reviews.ts must never reach this function.
 */
export function productSchema(
  view: ProductView,
  content: ProductContent,
  reviews: ReviewSummary | null,
) {
  const url = absoluteUrl(view.href);
  const images = view.gallery
    .filter((m) => m.type === "image")
    .map((m) => (m as { url: string }).url);
  return {
    "@type": "Product",
    "@id": `${url}#product`,
    name: view.name,
    description: content.benefitLine,
    url,
    image: images,
    category: content.googleCategory,
    brand: {
      "@type": "Brand",
      name: content.manufacturer.replace(/\s*\(.*\)$/, ""),
    },
    ...(view.variants[0]?.sku
      ? {
          sku:
            view.variants.find((v) => v.id === view.defaultVariantId)?.sku ??
            undefined,
        }
      : {}),
    offers: view.variants.map((v) => ({
      "@type": "Offer",
      url: `${url}?variant=${v.id.split("/").pop()}`,
      name: v.label,
      ...(v.sku ? { sku: v.sku } : {}),
      price: v.price.toFixed(2),
      priceCurrency: view.currency,
      availability: v.availableForSale
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": ORG_ID },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: site.delivery.minDays,
            maxValue: site.delivery.maxDays,
            unitCode: "DAY",
          },
        },
      },
    })),
    ...(reviews && reviews.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: reviews.average,
            reviewCount: reviews.count,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };
}
