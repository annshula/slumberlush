/**
 * Human labels + theme tones for Shopify order, shipment and return statuses,
 * plus the small amount of grouping logic the account UI needs. Nothing here
 * infers a stage Shopify has not actually reported.
 */

import type {
  Order,
  OrderFulfillment,
  OrderLineItem,
  OrderReturnDetail,
  OrderReturnStatus,
  OrderReturnSummary,
  ReturnReason,
} from "@/lib/shopify/types";

export type StatusTone =
  | "neutral"
  | "rose"
  | "lilac"
  | "mint"
  | "butter"
  | "ink";

const FINANCIAL: Record<string, { label: string; tone: StatusTone }> = {
  PAID: { label: "Paid", tone: "mint" },
  AUTHORIZED: { label: "Payment authorized", tone: "lilac" },
  PENDING: { label: "Payment pending", tone: "butter" },
  REFUNDED: { label: "Refunded", tone: "neutral" },
  PARTIALLY_REFUNDED: { label: "Partially refunded", tone: "neutral" },
  VOIDED: { label: "Voided", tone: "rose" },
  PARTIALLY_PAID: { label: "Partially paid", tone: "butter" },
};

const FULFILLMENT: Record<string, { label: string; tone: StatusTone }> = {
  SUCCESS: { label: "Fulfilled", tone: "mint" },
  IN_PROGRESS: { label: "Fulfilling", tone: "lilac" },
  ON_HOLD: { label: "On hold", tone: "butter" },
  OPEN: { label: "Processing", tone: "lilac" },
  PENDING_FULFILLMENT: { label: "Pending fulfilment", tone: "butter" },
  SCHEDULED: { label: "Scheduled", tone: "neutral" },
  CANCELLED: { label: "Cancelled", tone: "rose" },
  FAILURE: { label: "Fulfilment failed", tone: "rose" },
  ERROR: { label: "Fulfilment error", tone: "rose" },
  UNFULFILLED: { label: "Unfulfilled", tone: "neutral" },
};

export function financialStatus(status: string | null) {
  if (!status) return { label: "Pending", tone: "butter" as StatusTone };
  return FINANCIAL[status] ?? { label: status, tone: "neutral" as StatusTone };
}

export function fulfillmentStatus(status: string | null) {
  if (!status)
    return { label: "Awaiting fulfilment", tone: "butter" as StatusTone };
  return (
    FULFILLMENT[status] ?? { label: status, tone: "neutral" as StatusTone }
  );
}

export const toneClasses: Record<StatusTone, string> = {
  neutral: "bg-ink/5 text-ink-soft",
  rose: "bg-clay-100 text-clay-600",
  lilac: "bg-cream text-ink-soft",
  mint: "bg-mint/40 text-ink",
  butter: "bg-butter/60 text-ink",
  ink: "bg-ink text-paper",
};

/* ── Returns ───────────────────────────────────────────────────────────── */

const RETURN_STATUS: Record<
  OrderReturnStatus,
  { label: string; tone: StatusTone; description: string }
> = {
  REQUESTED: {
    label: "Return requested",
    tone: "lilac",
    description: "We are reviewing your return request.",
  },
  OPEN: {
    label: "Return in progress",
    tone: "lilac",
    description: "Your return is approved and on its way back to us.",
  },
  // Empty on purpose — the heading already reads "Return complete".
  CLOSED: { label: "Return complete", tone: "mint", description: "" },
  CANCELED: {
    label: "Return cancelled",
    tone: "rose",
    description: "This return was cancelled.",
  },
  DECLINED: {
    label: "Return declined",
    tone: "rose",
    description: "This return was declined. Contact us if that looks wrong.",
  },
};

export function returnStatus(status: OrderReturnStatus) {
  return RETURN_STATUS[status];
}

/** Terminal states — nothing more will happen to this return. */
export function isFinalReturnStatus(status: OrderReturnStatus): boolean {
  return status === "CLOSED" || status === "CANCELED" || status === "DECLINED";
}

/** The Customer Account API's `ReturnReason` enum, as shopper-facing labels. */
const RETURN_REASONS: Record<ReturnReason, string> = {
  SIZE_TOO_SMALL: "Too small",
  SIZE_TOO_LARGE: "Too large",
  UNWANTED: "No longer needed",
  NOT_AS_DESCRIBED: "Not as described",
  WRONG_ITEM: "Wrong item arrived",
  DEFECTIVE: "Arrived damaged or faulty",
  STYLE: "Not the style we hoped for",
  COLOR: "Not the colour we hoped for",
  OTHER: "Something else",
  UNKNOWN: "Not specified",
};

export function returnReasonLabel(reason: ReturnReason): string {
  return RETURN_REASONS[reason];
}

/** Everything a shopper may pick — `UNKNOWN` is Shopify's, never theirs. */
export const SELECTABLE_RETURN_REASONS: Exclude<ReturnReason, "UNKNOWN">[] = [
  "SIZE_TOO_SMALL",
  "SIZE_TOO_LARGE",
  "DEFECTIVE",
  "NOT_AS_DESCRIBED",
  "WRONG_ITEM",
  "STYLE",
  "COLOR",
  "UNWANTED",
  "OTHER",
];

/** A return needs something to send back: not cancelled, and at least one shipment. */
export function isReturnable(
  order: Pick<Order, "cancelledAt" | "fulfillments">,
): boolean {
  if (order.cancelledAt) return false;
  return order.fulfillments.length > 0;
}

/**
 * Line items that have actually shipped, and so can be returned.
 * `OrderFulfillment.lineItemIds` records membership rather than a
 * per-fulfillment quantity split, so the full ordered quantity is the cap.
 */
export function returnableLineItems(
  order: Pick<Order, "lineItems" | "fulfillments">,
): OrderLineItem[] {
  const shipped = new Set(order.fulfillments.flatMap((f) => f.lineItemIds));
  return order.lineItems.filter((item) => shipped.has(item.id));
}

/**
 * Every return covering this item. An item genuinely can have more than one —
 * a declined request followed by a fresh one is an ordinary sequence — so
 * anything that reasons about "the" return has to start from the full set.
 */
export function returnsForLineItem(
  itemId: string,
  summary: OrderReturnSummary | null,
): OrderReturnDetail[] {
  return (summary?.returns ?? []).filter((r) => r.lineItemIds.includes(itemId));
}

/**
 * The return the item's card reports on: the first Shopify lists for it.
 *
 * Deliberately not "the newest live one". Reordering the returns means the
 * card can show a status the API did not put first, and picking a favourite
 * among several real returns is a judgement the shopper never asked us to
 * make. Eligibility is the place that has to weigh all of them, and
 * {@link hasActiveReturn} does exactly that over the full set.
 */
export function returnForLineItem(
  itemId: string,
  summary: OrderReturnSummary | null,
): OrderReturnDetail | null {
  return returnsForLineItem(itemId, summary)[0] ?? null;
}

/** The window we promise on the storefront, in days from delivery. */
export const RETURN_WINDOW_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

/** When this shipment actually landed, or null if Shopify has not said so. */
export function deliveredAt(group: ShipmentGroup): string | null {
  const fulfillment = group.fulfillment;
  if (!fulfillment || fulfillment.status !== "SUCCESS") return null;
  return fulfillment.events.at(-1)?.happenedAt ?? fulfillment.createdAt;
}

/**
 * The last moment an item can be sent back. `null` means the clock has not
 * started — nothing that is still in transit has run out of time.
 */
export function returnWindowEndsAt(group: ShipmentGroup): Date | null {
  const landed = deliveredAt(group);
  if (!landed) return null;
  const date = new Date(landed);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getTime() + RETURN_WINDOW_DAYS * DAY_MS);
}

export type ReturnEligibility = {
  /** Items that can be sent back right now. */
  items: OrderLineItem[];
  /** Why none of them can, in the shopper's terms. Null when `items` is not empty. */
  reason: string | null;
  /** The soonest deadline among eligible items, so the CTA can name a date. */
  closesAt: Date | null;
};

/**
 * What can still be returned, and — just as important — why not, when nothing
 * can. A greyed-out button with no explanation is the worst version of this:
 * "nothing has shipped yet", "you already sent that back" and "the window
 * closed three weeks ago" are three completely different situations, and only
 * one of them is worth contacting support about.
 *
 * The 30 days run from delivery, not from the order date, and an item Shopify
 * has not reported as delivered has not started its clock at all.
 */
export function returnEligibility(
  order: Pick<Order, "cancelledAt" | "lineItems" | "fulfillments" | "processedAt">,
  summary: OrderReturnSummary | null,
  now: Date = new Date(),
): ReturnEligibility {
  const none = (reason: string): ReturnEligibility => ({
    items: [],
    reason,
    closesAt: null,
  });

  if (order.cancelledAt) {
    return none("This order was cancelled, so there is nothing to send back.");
  }
  if (order.fulfillments.length === 0) {
    return none(
      "Nothing has shipped yet. You can start a return once your parcel arrives.",
    );
  }
  /* `null` means the return-status read failed, not that there are none.
     Offering a return without knowing what has already gone back is how a
     shopper files a second request for a parcel we have already refunded. */
  if (!summary) {
    console.error(
      "[return-eligibility] return status unavailable — refusing returns for this order rather than risking a duplicate.",
    );
    return none(
      "We could not check this order's return status just now. Please try again shortly, or contact us and we will sort it out.",
    );
  }

  if (summary.unattributedActive > 0) {
    return none("A return is already open on this order.");
  }

  /* Shopify reported a live return whose line items are not in this order.
     The return is real; only our ability to say *which* item it covers has
     failed — almost always an id shape we did not expect. Treat it exactly
     like an unattributed return and log both id sets, because that comparison
     is the whole diagnosis. */
  const orderItemIds = new Set(order.lineItems.map((item) => item.id));
  const stray = summary.returns.filter(
    (r) =>
      r.status !== "CANCELED" &&
      r.status !== "DECLINED" &&
      !r.lineItemIds.some((id) => orderItemIds.has(id)),
  );
  if (stray.length > 0) {
    console.error(
      "[return-eligibility] a live return does not match any line item on this order.",
      {
        returnLineItemIds: stray.flatMap((r) => r.lineItemIds),
        orderLineItemIds: [...orderItemIds],
      },
    );
    return none("A return is already open on this order.");
  }

  const groupByItem = new Map(
    groupShipments(order).flatMap((group) =>
      group.lineItems.map((item) => [item.id, group] as const),
    ),
  );

  const shipped = returnableLineItems(order);
  const notYetReturned = shipped.filter(
    (item) => !hasActiveReturn(item.id, summary),
  );

  if (shipped.length > 0 && notYetReturned.length === 0) {
    return none("Every item on this order has already been sent back.");
  }

  let closesAt: Date | null = null;
  let lastClosed: Date | null = null;

  const items = notYetReturned.filter((item) => {
    const group = groupByItem.get(item.id);
    const ends = group ? returnWindowEndsAt(group) : null;
    // Not delivered yet — the clock has not started, so it cannot have run out.
    if (!ends) return true;
    if (ends < now) {
      if (!lastClosed || ends > lastClosed) lastClosed = ends;
      return false;
    }
    if (!closesAt || ends < closesAt) closesAt = ends;
    return true;
  });

  if (items.length === 0) {
    return none(
      lastClosed
        ? `The ${RETURN_WINDOW_DAYS}-day return window closed on ${formatWindowDate(lastClosed)}.`
        : "These items cannot be returned online. Contact us and we will help.",
    );
  }

  return { items, reason: null, closesAt };
}

function formatWindowDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/**
 * Whether an item already has a return requested, in progress or completed.
 * A cancelled or declined return does not count — that item is genuinely
 * available to request a return for again.
 */
export function hasActiveReturn(
  itemId: string,
  summary: OrderReturnSummary | null,
): boolean {
  // `some`, not "the first one": an item with a declined return *and* a live
  // one is still spoken for, and checking only the first would offer it again.
  return returnsForLineItem(itemId, summary).some(
    (r) => r.status !== "CANCELED" && r.status !== "DECLINED",
  );
}

/* ── Shipments ─────────────────────────────────────────────────────────── */

export type ShipmentGroup = {
  id: string;
  lineItems: OrderLineItem[];
  /** null means these items are not on a shipment yet. */
  fulfillment: OrderFulfillment | null;
};

/**
 * Splits an order's items by the shipment they are actually in. Shopify packs
 * a multi-item order into more than one box as often as not, and each box can
 * be at a different stage. Anything not yet on a fulfillment lands in one
 * trailing "still being prepared" group.
 */
export function groupShipments(
  order: Pick<Order, "lineItems" | "fulfillments">,
): ShipmentGroup[] {
  const assigned = new Set<string>();

  const groups: ShipmentGroup[] = order.fulfillments.map((fulfillment) => {
    const lineItems = order.lineItems.filter((item) =>
      fulfillment.lineItemIds.includes(item.id),
    );
    for (const item of lineItems) assigned.add(item.id);
    return { id: fulfillment.id, lineItems, fulfillment };
  });

  const waiting = order.lineItems.filter((item) => !assigned.has(item.id));
  if (waiting.length > 0) {
    groups.push({ id: "unfulfilled", lineItems: waiting, fulfillment: null });
  }

  return groups;
}

export type ShipmentStep = { id: string; label: string; at: string | null };

/**
 * A shipment's real milestones, newest first: its current stage (only once it
 * has actually shipped), then "Confirmed". Nothing is invented — an order with
 * no fulfillment shows one step, not a fabricated shipping stage.
 */
export function shipmentSteps(
  group: ShipmentGroup,
  order: Pick<Order, "processedAt">,
): ShipmentStep[] {
  const confirmed: ShipmentStep = {
    id: "confirmed",
    label: "Confirmed",
    at: order.processedAt,
  };
  if (!group.fulfillment) return [confirmed];

  const latest = group.fulfillment.events.at(-1) ?? null;
  return [
    {
      id: "status",
      label: fulfillmentStatus(group.fulfillment.status).label,
      at: latest?.happenedAt ?? group.fulfillment.createdAt,
    },
    confirmed,
  ];
}

/* ── The journey rail ──────────────────────────────────────────────────── */

export type JourneyState = "done" | "current" | "pending" | "failed";

export type JourneyNode = {
  id: string;
  label: string;
  /** null when the milestone has not happened, so nothing invents a date. */
  at: string | null;
  state: JourneyState;
};

/**
 * The milestones this item has actually reached — nothing else. Delivery
 * history first (oldest to newest), then the return's own milestones if a
 * return covers it.
 *
 * Every label here comes from Shopify: `Confirmed` is the order's own
 * `processedAt`, and the shipment step is `fulfillmentStatus(...)` of the
 * status the API reported. There are deliberately no placeholder stages for
 * steps that have not happened — a rail that shows "On its way" on an order
 * still sitting in the warehouse is worse than a short rail, because it reads
 * as fact.
 *
 * There is no "approved" milestone on the return leg either: the Customer
 * Account API does not expose one, unlike Admin's schema.
 */
export function itemJourney(
  group: ShipmentGroup,
  order: Pick<Order, "processedAt">,
  detail: OrderReturnDetail | null,
): JourneyNode[] {
  // shipmentSteps reads newest-first; the rail reads oldest-first.
  const delivery: JourneyNode[] = [...shipmentSteps(group, order)]
    .reverse()
    .map((step) => ({ ...step, state: "done" as const }));

  if (!detail) return delivery;

  const requested: JourneyNode = {
    id: "return-requested",
    label: "Return requested",
    at: detail.requestedAt,
    state: "done",
  };

  // Nothing has happened after the request yet.
  if (detail.status === "REQUESTED") return [...delivery, requested];

  return [
    ...delivery,
    requested,
    {
      id: "return-status",
      label: returnStatus(detail.status).label,
      // A final status is dated; one still in motion has no end date to show.
      at: isFinalReturnStatus(detail.status)
        ? (detail.closedAt ?? detail.updatedAt)
        : null,
      state:
        detail.status === "CLOSED"
          ? "done"
          : detail.status === "CANCELED" || detail.status === "DECLINED"
            ? "failed"
            : "current",
    },
  ];
}
