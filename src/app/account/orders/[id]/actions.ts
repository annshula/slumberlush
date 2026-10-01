"use server";

import { revalidatePath } from "next/cache";

import {
  isReturnable,
  returnEligibility,
  SELECTABLE_RETURN_REASONS,
} from "@/lib/account/order-status";
import {
  getOrder,
  getOrderReturnStatus,
  requestReturn,
} from "@/lib/shopify/customer-service";
import { requireCustomer } from "@/lib/shopify/guard";
import type { ReturnLineItemInput, ReturnReason } from "@/lib/shopify/types";

export type ReturnState = { ok: boolean; message?: string };

export type ReturnSelection = {
  lineItemId: string;
  quantity: number;
  reason: string;
};

const allowedReasons = new Set<string>(SELECTABLE_RETURN_REASONS);

/**
 * Files a return request for one order.
 *
 * Every claim the client makes is re-derived server-side against a fresh copy
 * of the order: which items shipped, how many of each were bought, and whether
 * one already has a return open. A tampered payload can therefore only ever
 * ask for something the shopper was genuinely entitled to ask for.
 */
export async function requestReturnAction(
  orderId: string,
  selections: ReturnSelection[],
): Promise<ReturnState> {
  await requireCustomer(`/account/orders/${encodeURIComponent(orderId)}`);

  if (!Array.isArray(selections) || selections.length === 0) {
    return { ok: false, message: "Select at least one item to return." };
  }

  const order = await getOrder(orderId).catch(() => null);
  if (!order) return { ok: false, message: "We could not find that order." };
  if (!isReturnable(order)) {
    return {
      ok: false,
      message: "Nothing on this order has shipped yet, so there is nothing to send back.",
    };
  }

  const returns = await getOrderReturnStatus(orderId);
  const { items: allowed, reason } = returnEligibility(order, returns);
  if (allowed.length === 0) {
    return { ok: false, message: reason ?? "This order can no longer be returned." };
  }
  const eligible = new Map(allowed.map((item) => [item.id, item] as const));

  const items: ReturnLineItemInput[] = [];
  for (const selection of selections) {
    const item = eligible.get(selection.lineItemId);
    if (!item) {
      return {
        ok: false,
        message: "One of those items can no longer be returned. Reload the page and try again.",
      };
    }
    if (
      !Number.isInteger(selection.quantity) ||
      selection.quantity < 1 ||
      selection.quantity > item.quantity
    ) {
      return {
        ok: false,
        message: `Choose between 1 and ${item.quantity} of ${item.title}.`,
      };
    }
    if (!allowedReasons.has(selection.reason)) {
      return {
        ok: false,
        message: "Choose a reason for each item you want to return.",
      };
    }
    items.push({
      lineItemId: item.id,
      quantity: selection.quantity,
      reason: selection.reason as ReturnReason,
    });
  }

  try {
    await requestReturn(order.id, items);
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "We could not submit that return. Please try again.",
    };
  }

  // Both pages are force-dynamic, but the client router cache still holds the
  // payload rendered before the request — without this the order detail keeps
  // showing "no return" until a hard reload.
  const path = `/account/orders/${encodeURIComponent(orderId)}`;
  revalidatePath(path);
  revalidatePath(`${path}/return`);
  revalidatePath("/account/orders");

  return { ok: true };
}
