/**
 * ShopifyLocalizationService — country/currency list + live localized variant
 * prices. No exchange-rate math happens in this app: both functions return
 * exactly what Shopify's Storefront API reports via `@inContext(country:)`.
 */

import { graphqlRequest } from "@/lib/shopify/client";
import {
  isStorefrontConfigured,
  shopifyConfig,
  storefrontEndpoint,
} from "@/lib/shopify/config";
import {
  LOCALIZATION_QUERY,
  VARIANTS_AVAILABILITY_QUERY,
} from "@/lib/shopify/queries";

export type LocalizationCountry = {
  isoCode: string;
  name: string;
  currency: { isoCode: string; symbol: string };
};

export type Localization = {
  defaultCountry: LocalizationCountry;
  availableCountries: LocalizationCountry[];
};

function token() {
  if (!isStorefrontConfigured()) {
    throw new Error("Shopify storefront is not configured on this site.");
  }
  return shopifyConfig().storefrontToken;
}

/** The country/currency list Shopify Markets publishes for this store. */
export async function getLocalization(
  country?: string | null,
): Promise<Localization> {
  const data = await graphqlRequest<{
    localization: {
      country: LocalizationCountry;
      availableCountries: LocalizationCountry[];
    };
  }>({
    endpoint: storefrontEndpoint(),
    query: LOCALIZATION_QUERY,
    variables: { country: country ?? null },
    storefrontToken: token(),
  });
  return {
    defaultCountry: data.localization.country,
    availableCountries: data.localization.availableCountries,
  };
}

export type LocalizedVariantPrice = {
  amount: string;
  currencyCode: string;
  compareAtAmount: string | null;
};

/** Live, per-variant prices converted to a country's presentment currency. */
export async function getLocalizedVariantPrices(
  variantIds: string[],
  country: string,
): Promise<Map<string, LocalizedVariantPrice>> {
  if (variantIds.length === 0) return new Map();

  const data = await graphqlRequest<{
    nodes: ({
      id: string;
      price?: { amount: string; currencyCode: string };
      compareAtPrice?: { amount: string; currencyCode: string } | null;
    } | null)[];
  }>({
    endpoint: storefrontEndpoint(),
    query: VARIANTS_AVAILABILITY_QUERY,
    variables: { ids: variantIds, country },
    storefrontToken: token(),
  });

  const prices = new Map<string, LocalizedVariantPrice>();
  for (const node of data.nodes) {
    if (!node?.price) continue;
    prices.set(node.id, {
      amount: node.price.amount,
      currencyCode: node.price.currencyCode,
      compareAtAmount: node.compareAtPrice?.amount ?? null,
    });
  }
  return prices;
}
