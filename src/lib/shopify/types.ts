/**
 * Shopify domain types (Storefront cart + Customer Account profile/orders).
 * Mirror the shapes the GraphQL layer returns, normalised for our UI.
 */

export type Money = { amount: string; currencyCode: string };

export type CartLine = {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    price?: Money | null;
    compareAtPrice?: Money | null;
    product?: { id: string; handle: string; title: string } | null;
  } | null;
  cost?: { totalAmount?: Money | null } | null;
};

export type Cart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  updatedAt: string;
  cost?: {
    subtotalAmount?: Money | null;
    totalAmount?: Money | null;
    totalTaxAmount?: Money | null;
  } | null;
  lines: CartLine[];
};

export type CartLineInput = { merchandiseId: string; quantity: number };

/* ── Customer Account ──────────────────────────────────────────────────── */

export type CustomerAddress = {
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

export type Customer = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  emailAddress: string | null;
  phoneNumber: string | null;
  defaultAddressId: string | null;
  addresses: CustomerAddress[];
};

export type OrderSummary = {
  id: string;
  number: number;
  name: string;
  processedAt: string;
  financialStatus: string | null;
  fulfillmentStatus: string | null;
  totalPrice: Money | null;
  lineItemCount: number;
  previewImages: Array<{ url: string; altText: string | null } | null>;
};

export type OrderLineItem = {
  id: string;
  title: string;
  variantTitle: string | null;
  quantity: number;
  sku: string | null;
  /** Shopify id of the bought variant — null if Shopify no longer has it. */
  variantId: string | null;
  /** Shopify id of the product the variant belongs to. */
  productId: string | null;
  image: { url: string; altText: string | null } | null;
  price: Money | null;
  totalPrice: Money | null;
};

export type OrderFulfillment = {
  id: string;
  status: string | null;
  createdAt: string | null;
  estimatedDeliveryAt: string | null;
  trackingInformation: Array<{
    number: string | null;
    company: string | null;
    url: string | null;
  }>;
  events: Array<{ status: string | null; happenedAt: string | null }>;
  lineItemIds: string[];
};

export type Order = {
  id: string;
  number: number;
  name: string;
  processedAt: string;
  cancelledAt: string | null;
  financialStatus: string | null;
  statusPageUrl: string | null;
  email: string | null;
  phone: string | null;
  totalPrice: Money | null;
  subtotal: Money | null;
  totalShipping: Money | null;
  totalTax: Money | null;
  totalRefunded: Money | null;
  shippingAddress: CustomerAddress | null;
  billingAddress: CustomerAddress | null;
  lineItems: OrderLineItem[];
  fulfillments: OrderFulfillment[];
};

/* ── Returns ───────────────────────────────────────────────────────────── */

/**
 * The Customer Account API's `ReturnReason` enum. `UNKNOWN` is a real value
 * Shopify can report back, but never something a shopper picks themselves.
 */
export type ReturnReason =
  | "SIZE_TOO_SMALL"
  | "SIZE_TOO_LARGE"
  | "UNWANTED"
  | "NOT_AS_DESCRIBED"
  | "WRONG_ITEM"
  | "DEFECTIVE"
  | "STYLE"
  | "COLOR"
  | "OTHER"
  | "UNKNOWN";

export type ReturnLineItemInput = {
  lineItemId: string;
  quantity: number;
  reason: ReturnReason;
};

/**
 * The Customer Account API's `Return.status` enum. There is no order-level
 * aggregate here — each Return carries its own status, which is exactly why
 * the UI attributes status per product rather than per order.
 */
export type OrderReturnStatus =
  | "REQUESTED"
  | "OPEN"
  | "CLOSED"
  | "CANCELED"
  | "DECLINED";

/** One real Shopify Return: its status, its dates, and the items it covers. */
export type OrderReturnDetail = {
  id: string;
  status: OrderReturnStatus;
  lineItemIds: string[];
  /** The reason the shopper gave, per line item. */
  lineItemReasons: Record<string, ReturnReason>;
  requestedAt: string;
  closedAt: string | null;
  /**
   * Last real change to this return — used as the date for a final status
   * when Shopify never set `closedAt` (declined returns often have none).
   */
  updatedAt: string;
  tracking: {
    number: string | null;
    url: string | null;
    carrierName: string | null;
  } | null;
};

export type OrderReturnSummary = {
  /** One entry per real Return on the order, never a merged summary. */
  returns: OrderReturnDetail[];
  /**
   * Active returns Shopify reported but that could not be tied to specific
   * line items (Shopify resolved them as `UnverifiedReturnLineItem`, which
   * carries no `lineItem`). We know the order has something on its way back;
   * we just cannot say which item — so no new return may be filed against it.
   */
  unattributedActive: number;
};
