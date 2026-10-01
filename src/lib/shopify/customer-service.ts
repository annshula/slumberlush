/**
 * Typed read layer over the Customer Account API. Every call goes through
 * `customerRequest`, which injects the signed-in customer's own access token.
 *
 * The store is shared with other brands, so both order reads filter line items
 * down to this storefront's own product — see {@link belongsToStore}.
 */

import { belongsToStore } from "@/lib/catalog/ownership";
import { customerRequest } from "@/lib/shopify/customer-account";
import {
  CUSTOMER_ORDERS_QUERY,
  CUSTOMER_ORDER_QUERY,
  CUSTOMER_ORDER_RETURN_STATUS_FALLBACK_QUERY,
  CUSTOMER_ORDER_RETURN_STATUS_QUERY,
  CUSTOMER_QUERY,
  CUSTOMER_UPDATE_MUTATION,
  ORDER_REQUEST_RETURN_MUTATION,
} from "@/lib/shopify/queries";
import type {
  Customer,
  CustomerAddress,
  Order,
  OrderReturnDetail,
  OrderReturnStatus,
  OrderReturnSummary,
  OrderSummary,
  ReturnLineItemInput,
  ReturnReason,
} from "@/lib/shopify/types";

export class CustomerServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CustomerServiceError";
  }
}

/* ── Customer ──────────────────────────────────────────────────────────── */

type RawAddress = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  zoneCode: string | null;
  territoryCode: string | null;
  zip: string | null;
  phoneNumber: string | null;
  formatted: string[];
};

export async function getCustomer(): Promise<Customer> {
  const data = await customerRequest<{
    customer: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      displayName: string;
      emailAddress: { emailAddress: string } | null;
      phoneNumber: { phoneNumber: string } | null;
      defaultAddress: { id: string } | null;
      addresses: { nodes: RawAddress[] };
    } | null;
  }>({ query: CUSTOMER_QUERY });

  const raw = data.customer;
  if (!raw) throw new CustomerServiceError("We could not load your account.");

  const addresses: CustomerAddress[] = raw.addresses.nodes.map((a) => ({
    id: a.id,
    firstName: a.firstName,
    lastName: a.lastName,
    company: a.company,
    address1: a.address1,
    address2: a.address2,
    city: a.city,
    zoneCode: a.zoneCode,
    territoryCode: a.territoryCode,
    zip: a.zip,
    phoneNumber: a.phoneNumber,
    formatted: a.formatted,
  }));

  return {
    id: raw.id,
    firstName: raw.firstName,
    lastName: raw.lastName,
    displayName: raw.displayName,
    emailAddress: raw.emailAddress?.emailAddress ?? null,
    phoneNumber: raw.phoneNumber?.phoneNumber ?? null,
    defaultAddressId: raw.defaultAddress?.id ?? null,
    addresses,
  };
}

export async function updateCustomer(input: {
  firstName?: string;
  lastName?: string;
}): Promise<{ firstName: string | null; lastName: string | null }> {
  const data = await customerRequest<{
    customerUpdate: {
      customer: { firstName: string | null; lastName: string | null } | null;
      userErrors?: Array<{ field?: string[]; message?: string }>;
    };
  }>({ query: CUSTOMER_UPDATE_MUTATION, variables: { input }, retries: 1 });

  const error = data.customerUpdate?.userErrors?.[0]?.message;
  if (error) throw new CustomerServiceError(error);
  const customer = data.customerUpdate?.customer;
  if (!customer)
    throw new CustomerServiceError("We could not save your details.");
  return { firstName: customer.firstName, lastName: customer.lastName };
}

/* ── Orders ────────────────────────────────────────────────────────────── */

type RawLineItemIdentity = {
  variantId?: string | null;
  productId?: string | null;
};

/** True when a line item is this storefront's own product, not another brand sharing the store. */
function isOwnItem(item: RawLineItemIdentity | null | undefined): boolean {
  return belongsToStore({
    variantId: item?.variantId ?? null,
    productId: item?.productId ?? null,
  });
}

/** Cap on Shopify order pages scanned to fill one page with own-brand orders. */
const MAX_ORDERS_PAGES = 50;

export async function listOrders(options: {
  first?: number;
  after?: string | null;
}): Promise<{
  orders: OrderSummary[];
  hasNextPage: boolean;
  endCursor: string | null;
}> {
  const requested = options.first ?? 10;
  const collected: OrderSummary[] = [];
  let cursor = options.after ?? null;
  let hasNextPage = false;
  let endCursor: string | null = null;

  /* The store is shared with other brands, so we page through Shopify's order
     list and keep only the orders that actually contain our own product, then
     keep paging until this page is full or there is nothing left to scan. */
  for (
    let page = 0;
    page < MAX_ORDERS_PAGES && collected.length < requested;
    page++
  ) {
    const data = await customerRequest<{
      customer: {
        orders: {
          pageInfo: { hasNextPage: boolean; endCursor: string | null };
          nodes: Array<{
            id: string;
            number: number;
            name: string;
            processedAt: string;
            financialStatus: string | null;
            fulfillments: { nodes: Array<{ status: string | null }> } | null;
            totalPrice: { amount: string; currencyCode: string } | null;
            lineItems: {
              nodes: Array<{
                image: { url: string; altText: string | null } | null;
                variantId: string | null;
                productId: string | null;
              }>;
            };
          }>;
        };
      } | null;
    }>({
      query: CUSTOMER_ORDERS_QUERY,
      variables: { first: requested, after: cursor },
    });

    const orders = data.customer?.orders;
    if (!orders) break;

    hasNextPage = orders.pageInfo.hasNextPage;
    endCursor = orders.pageInfo.endCursor;

    for (const node of orders.nodes) {
      const ownItems = node.lineItems.nodes.filter((li) => isOwnItem(li));
      if (ownItems.length === 0) continue;
      collected.push({
        id: node.id,
        number: node.number,
        name: node.name,
        processedAt: node.processedAt,
        financialStatus: node.financialStatus,
        fulfillmentStatus: node.fulfillments?.nodes?.[0]?.status ?? null,
        totalPrice: node.totalPrice
          ? {
              amount: node.totalPrice.amount,
              currencyCode: node.totalPrice.currencyCode,
            }
          : null,
        lineItemCount: ownItems.length,
        previewImages: ownItems.map((li) =>
          li.image ? { url: li.image.url, altText: li.image.altText } : null,
        ),
      });
      if (collected.length >= requested) break;
    }

    cursor = orders.pageInfo.endCursor;
    if (!hasNextPage || !cursor) break;
  }

  return {
    orders: collected.slice(0, requested),
    hasNextPage,
    endCursor,
  };
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const data = await customerRequest<{
    order: {
      id: string;
      number: number;
      name: string;
      processedAt: string;
      cancelledAt: string | null;
      financialStatus: string | null;
      statusPageUrl: string | null;
      email: string | null;
      phone: string | null;
      totalPrice: { amount: string; currencyCode: string } | null;
      subtotal: { amount: string; currencyCode: string } | null;
      totalShipping: { amount: string; currencyCode: string } | null;
      totalTax: { amount: string; currencyCode: string } | null;
      totalRefunded: { amount: string; currencyCode: string } | null;
      shippingAddress: RawAddress | null;
      billingAddress: RawAddress | null;
      lineItems: {
        nodes: Array<{
          id: string;
          title: string;
          variantTitle: string | null;
          quantity: number;
          sku: string | null;
          variantId: string | null;
          productId: string | null;
          image: { url: string; altText: string | null } | null;
          price: { amount: string; currencyCode: string } | null;
          totalPrice: { amount: string; currencyCode: string } | null;
        }>;
      };
      fulfillments: {
        nodes: Array<{
          id: string;
          status: string | null;
          createdAt: string | null;
          estimatedDeliveryAt: string | null;
          trackingInformation: Array<{
            number: string | null;
            company: string | null;
            url: string | null;
          }> | null;
          events: {
            nodes: Array<{ status: string | null; happenedAt: string | null }>;
          } | null;
          fulfillmentLineItems: {
            nodes: Array<{ lineItem: { id: string }; quantity: number }>;
          };
        }>;
      };
    } | null;
  }>({ query: CUSTOMER_ORDER_QUERY, variables: { id: orderId } });

  const order = data.order;
  if (!order) return null;

  /* The shared store means an order can carry other brands' products. Keep
     only our own line items, and treat an order with nothing of ours as not
     found — the page has nothing to show. */
  const lineItems = order.lineItems.nodes
    .filter((li) => isOwnItem(li))
    .map((li) => ({
      id: li.id,
      title: li.title,
      variantTitle: li.variantTitle,
      quantity: li.quantity,
      sku: li.sku,
      variantId: li.variantId ?? null,
      productId: li.productId ?? null,
      image: li.image ? { url: li.image.url, altText: li.image.altText } : null,
      price: li.price
        ? { amount: li.price.amount, currencyCode: li.price.currencyCode }
        : null,
      totalPrice: li.totalPrice
        ? {
            amount: li.totalPrice.amount,
            currencyCode: li.totalPrice.currencyCode,
          }
        : null,
    }));

  if (lineItems.length === 0) return null;

  return {
    id: order.id,
    number: order.number,
    name: order.name,
    processedAt: order.processedAt,
    cancelledAt: order.cancelledAt,
    financialStatus: order.financialStatus,
    statusPageUrl: order.statusPageUrl,
    email: order.email,
    phone: order.phone,
    totalPrice: order.totalPrice
      ? {
          amount: order.totalPrice.amount,
          currencyCode: order.totalPrice.currencyCode,
        }
      : null,
    subtotal: order.subtotal
      ? {
          amount: order.subtotal.amount,
          currencyCode: order.subtotal.currencyCode,
        }
      : null,
    totalShipping: order.totalShipping
      ? {
          amount: order.totalShipping.amount,
          currencyCode: order.totalShipping.currencyCode,
        }
      : null,
    totalTax: order.totalTax
      ? {
          amount: order.totalTax.amount,
          currencyCode: order.totalTax.currencyCode,
        }
      : null,
    totalRefunded: order.totalRefunded
      ? {
          amount: order.totalRefunded.amount,
          currencyCode: order.totalRefunded.currencyCode,
        }
      : null,
    shippingAddress: order.shippingAddress
      ? mapAddress(order.shippingAddress)
      : null,
    billingAddress: order.billingAddress
      ? mapAddress(order.billingAddress)
      : null,
    lineItems,
    fulfillments: order.fulfillments.nodes.map((f) => ({
      id: f.id,
      status: f.status,
      createdAt: f.createdAt,
      estimatedDeliveryAt: f.estimatedDeliveryAt,
      trackingInformation: f.trackingInformation ?? [],
      // `events` is a connection, not a list — unwrap it here so nothing
      // downstream has to know the difference.
      events: f.events?.nodes ?? [],
      lineItemIds: f.fulfillmentLineItems.nodes.map((n) => n.lineItem.id),
    })),
  };
}

/* ── Returns ───────────────────────────────────────────────────────────── */

type RawReturnStatusOrder = {
  returns?: {
    nodes: Array<{
      id: string;
      status: OrderReturnStatus;
      createdAt: string;
      closedAt: string | null;
      updatedAt: string;
      returnLineItems: {
        nodes: Array<{
          lineItem?: { id: string } | null;
          returnReason: ReturnReason;
        }>;
      };
      reverseDeliveries?: {
        nodes: Array<{
          deliverable: {
            tracking?: {
              trackingNumber: string | null;
              trackingUrl: string | null;
              carrierName: string | null;
            } | null;
          } | null;
        }>;
      };
    }>;
  };
};

/**
 * Return status for one order. Never allowed to fail the page it renders on:
 * a return that cannot be read is a missing badge, not a broken order detail
 * screen, so a failure logs and resolves to `null`.
 */
export async function getOrderReturnStatus(
  orderId: string,
): Promise<OrderReturnSummary | null> {
  const read = async (query: string) => {
    const data = await customerRequest<{ order: RawReturnStatusOrder | null }>({
      query,
      variables: { id: orderId },
    });
    return toReturnSummary(data.order);
  };

  try {
    return await read(CUSTOMER_ORDER_RETURN_STATUS_QUERY);
  } catch (error) {
    console.error(
      "[return-status] full query failed, retrying without return tracking:",
      error instanceof Error ? error.message : error,
    );
  }

  try {
    return await read(CUSTOMER_ORDER_RETURN_STATUS_FALLBACK_QUERY);
  } catch (error) {
    console.error(
      "[return-status] fallback query failed too — return filtering is OFF for this order, " +
        "so items already sent back may still be offered:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

function toReturnSummary(
  order: RawReturnStatusOrder | null,
): OrderReturnSummary | null {
  // Shopify answered and this order simply has no returns. That is a real,
  // known answer — very different from `null`, which the caller reads as
  // "we could not find out" and refuses to act on.
  const rawReturns = order?.returns?.nodes ?? [];
  if (rawReturns.length === 0) return { returns: [], unattributedActive: 0 };

  /* One entry per real Shopify Return, each keeping its own status, dates and
     line items. Flattening them into a single order-wide summary would
     misattribute one return's timestamps to another return's products the
     moment an order has more than one. */
  const returns: OrderReturnDetail[] = rawReturns
    .map((r) => {
      const lineItemReasons: Record<string, ReturnReason> = {};
      for (const node of r.returnLineItems.nodes) {
        if (node.lineItem?.id)
          lineItemReasons[node.lineItem.id] = node.returnReason;
      }
      const tracking =
        (r.reverseDeliveries?.nodes ?? [])
          .map((delivery) => delivery.deliverable?.tracking)
          .find((t): t is NonNullable<typeof t> =>
            Boolean(t?.trackingNumber),
          ) ?? null;

      return {
        id: r.id,
        status: r.status,
        lineItemIds: Object.keys(lineItemReasons),
        lineItemReasons,
        requestedAt: r.createdAt,
        closedAt: r.closedAt,
        updatedAt: r.updatedAt,
        tracking: tracking
          ? {
              number: tracking.trackingNumber,
              url: tracking.trackingUrl,
              carrierName: tracking.carrierName,
            }
          : null,
      };
    })
    // No real per-item mapping — never guess which product a return applies to.
    .filter((r) => r.lineItemIds.length > 0);

  /* A return we cannot attribute still counts. Dropping it silently would let
     the shopper file a second request for something already on its way back. */
  const unattributedActive = rawReturns.filter(
    (r) =>
      !returns.some((mapped) => mapped.id === r.id) &&
      r.status !== "CANCELED" &&
      r.status !== "DECLINED",
  ).length;

  if (unattributedActive > 0) {
    console.error(
      `[return-status] ${unattributedActive} active return(s) on this order did not map to a line item id — ` +
        "blocking new return requests for it rather than risking a duplicate.",
    );
  }

  return { returns, unattributedActive };
}

/**
 * Submits a return request for one order. `retries: 1` because this is a
 * write — the shared transport's query retries would risk filing the same
 * return twice.
 */
export async function requestReturn(
  orderId: string,
  items: ReturnLineItemInput[],
): Promise<void> {
  const data = await customerRequest<{
    orderRequestReturn: {
      return: { id: string } | null;
      userErrors?: Array<{ field?: string[]; message?: string }>;
    };
  }>({
    query: ORDER_REQUEST_RETURN_MUTATION,
    variables: {
      orderId,
      requestedLineItems: items.map((item) => ({
        lineItemId: item.lineItemId,
        quantity: item.quantity,
        returnReason: item.reason,
      })),
    },
    retries: 1,
  });

  const error = data.orderRequestReturn?.userErrors?.[0]?.message;
  if (error) throw new CustomerServiceError(error);

  if (!data.orderRequestReturn?.return) {
    // No userErrors but no return either — the request did not land.
    console.error(
      "[return-request] orderRequestReturn reported success but returned no return object.",
    );
    throw new CustomerServiceError(
      "We could not submit that return. Please try again.",
    );
  }
}

function mapAddress(a: RawAddress): CustomerAddress {
  return {
    id: a.id,
    firstName: a.firstName,
    lastName: a.lastName,
    company: a.company,
    address1: a.address1,
    address2: a.address2,
    city: a.city,
    zoneCode: a.zoneCode,
    territoryCode: a.territoryCode,
    zip: a.zip,
    phoneNumber: a.phoneNumber,
    formatted: a.formatted,
  };
}
