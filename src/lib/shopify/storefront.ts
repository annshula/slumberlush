/**
 * Storefront API cart service. Shopify owns quantities, pricing and totals —
 * this module only translates between our cart shape and the Storefront API.
 */

import { graphqlRequest } from "@/lib/shopify/client";
import {
  isStorefrontConfigured,
  shopifyConfig,
  storefrontEndpoint,
} from "@/lib/shopify/config";
import {
  CART_CREATE_MUTATION,
  CART_LINES_ADD_MUTATION,
  CART_LINES_REMOVE_MUTATION,
  CART_LINES_UPDATE_MUTATION,
  CART_QUERY,
} from "@/lib/shopify/queries";
import type { Cart, CartLineInput } from "@/lib/shopify/types";

export class CartServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CartServiceError";
  }
}

function token() {
  if (!isStorefrontConfigured()) {
    throw new CartServiceError(
      "Shopify storefront is not configured on this site.",
    );
  }
  return shopifyConfig().storefrontToken;
}

function userError(
  userErrors: Array<{ field?: string[] | null; message?: string }> | undefined,
) {
  return userErrors?.[0]?.message ?? null;
}

/* ── Reads ─────────────────────────────────────────────────────────────── */

export async function getCart(cartId: string): Promise<Cart | null> {
  const data = await graphqlRequest<{ cart: Cart | null }>({
    endpoint: storefrontEndpoint(),
    query: CART_QUERY,
    variables: { cartId },
    storefrontToken: token(),
  });
  return data.cart;
}

/* ── Mutations ─────────────────────────────────────────────────────────── */

export async function createCart(
  lines: CartLineInput[],
  options: { countryCode?: string | null; attributes?: { key: string; value: string }[] } = {},
): Promise<Cart> {
  const buyerIdentity = options.countryCode ? { countryCode: options.countryCode } : undefined;
  const data = await graphqlRequest<{
    cartCreate: {
      cart: Cart | null;
      userErrors?: Array<{ field?: string[]; message?: string }>;
    };
  }>({
    endpoint: storefrontEndpoint(),
    query: CART_CREATE_MUTATION,
    variables: {
      input: {
        lines,
        ...(buyerIdentity ? { buyerIdentity } : {}),
        ...(options.attributes?.length ? { attributes: options.attributes } : {}),
      },
    },
    storefrontToken: token(),
    retries: 1,
  });
  const error = userError(data.cartCreate?.userErrors);
  if (!data.cartCreate?.cart)
    throw new CartServiceError(error ?? "We could not create your bag.");
  return data.cartCreate.cart;
}

export async function addCartLines(
  cartId: string,
  lines: CartLineInput[],
): Promise<Cart> {
  const data = await graphqlRequest<{
    cartLinesAdd: {
      cart: Cart | null;
      userErrors?: Array<{ field?: string[]; message?: string }>;
    };
  }>({
    endpoint: storefrontEndpoint(),
    query: CART_LINES_ADD_MUTATION,
    variables: { cartId, lines },
    storefrontToken: token(),
    retries: 1,
  });
  const error = userError(data.cartLinesAdd?.userErrors);
  if (!data.cartLinesAdd?.cart)
    throw new CartServiceError(error ?? "We could not update your bag.");
  return data.cartLinesAdd.cart;
}

export async function updateCartLines(
  cartId: string,
  lines: Array<{ id: string; quantity: number }>,
): Promise<Cart> {
  const data = await graphqlRequest<{
    cartLinesUpdate: {
      cart: Cart | null;
      userErrors?: Array<{ field?: string[]; message?: string }>;
    };
  }>({
    endpoint: storefrontEndpoint(),
    query: CART_LINES_UPDATE_MUTATION,
    variables: { cartId, lines },
    storefrontToken: token(),
    retries: 1,
  });
  const error = userError(data.cartLinesUpdate?.userErrors);
  if (!data.cartLinesUpdate?.cart)
    throw new CartServiceError(error ?? "We could not update your bag.");
  return data.cartLinesUpdate.cart;
}

export async function removeCartLines(
  cartId: string,
  lineIds: string[],
): Promise<Cart> {
  const data = await graphqlRequest<{
    cartLinesRemove: {
      cart: Cart | null;
      userErrors?: Array<{ field?: string[]; message?: string }>;
    };
  }>({
    endpoint: storefrontEndpoint(),
    query: CART_LINES_REMOVE_MUTATION,
    variables: { cartId, lineIds },
    storefrontToken: token(),
    retries: 1,
  });
  const error = userError(data.cartLinesRemove?.userErrors);
  if (!data.cartLinesRemove?.cart)
    throw new CartServiceError(error ?? "We could not update your bag.");
  return data.cartLinesRemove.cart;
}
