"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  requestReturnAction,
  type ReturnSelection,
} from "@/app/account/orders/[id]/actions";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import {
  returnReasonLabel,
  SELECTABLE_RETURN_REASONS,
} from "@/lib/account/order-status";
import { formatMoney } from "@/lib/money";
import type { Order, OrderLineItem } from "@/lib/shopify/types";

type Selection = { quantity: number; reason: string };

const labelClass =
  "font-label text-[0.7rem] tracking-[0.14em] text-ink-soft uppercase";

/**
 * Pick items, quantities and a reason, one row per product. Quantity drives
 * everything: an item at zero is simply not part of the request, so the reason
 * field only appears once the shopper has actually chosen to send something
 * back.
 */
export function ReturnRequestForm({
  order,
  items,
  redirectTo,
}: {
  order: Order;
  items: OrderLineItem[];
  redirectTo: string;
}) {
  const router = useRouter();
  const [selections, setSelections] = useState<Record<string, Selection>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const update = (itemId: string, patch: Partial<Selection>) =>
    setSelections((current) => ({
      ...current,
      [itemId]: {
        quantity: current[itemId]?.quantity ?? 0,
        reason: current[itemId]?.reason ?? "",
        ...patch,
      },
    }));

  const selectedCount = Object.values(selections).reduce(
    (sum, s) => sum + Math.max(0, s.quantity),
    0,
  );

  const refund = items.reduce((sum, item) => {
    const selection = selections[item.id];
    if (!selection || selection.quantity <= 0 || !item.price) return sum;
    return sum + Number(item.price.amount) * selection.quantity;
  }, 0);

  /* The order's own currency, never the one picked in the header — a refund is
     paid back in whatever was charged. */
  const currency =
    order.totalPrice?.currencyCode ??
    items.find((item) => item.price)?.price?.currencyCode;

  const handleSubmit = () => {
    setError(null);

    const payload: ReturnSelection[] = [];
    for (const item of items) {
      const selection = selections[item.id];
      if (!selection || selection.quantity <= 0) continue;
      if (!selection.reason) {
        setError("Choose a reason for each item you want to return.");
        return;
      }
      payload.push({
        lineItemId: item.id,
        quantity: selection.quantity,
        reason: selection.reason,
      });
    }

    if (payload.length === 0) {
      setError("Select at least one item to return.");
      return;
    }

    startTransition(async () => {
      const result = await requestReturnAction(order.id, payload);
      if (!result.ok) {
        setError(result.message ?? "We could not submit that return.");
        return;
      }
      router.push(redirectTo);
      router.refresh();
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <ul className="flex flex-col gap-4">
        {items.map((item) => {
          const selection = selections[item.id];
          const quantity = selection?.quantity ?? 0;
          return (
            <li
              key={item.id}
              className="rounded-panel bg-paper p-5 shadow-soft sm:p-6"
            >
              {/* Thumbnail and details on the first row; the quantity stepper
                  takes a row of its own on a phone, where a 64px thumb, a long
                  title and a ~112px stepper would otherwise be squeezed into
                  ~280px, then slides back beside the title once there is room. */}
              <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-4 gap-y-5 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image.url}
                    alt={item.image.altText ?? ""}
                    className="size-16 shrink-0 rounded-card bg-blush object-cover"
                  />
                ) : (
                  <span className="grid size-16 shrink-0 place-items-center rounded-card bg-blush text-sage-600">
                    <Icon name="bag" className="size-5" />
                  </span>
                )}

                <div className="min-w-0">
                  <p className="font-headline text-ink">{item.title}</p>
                  {item.variantTitle &&
                    item.variantTitle !== "Default Title" && (
                      <p className="text-caption text-ink-faint">
                        {item.variantTitle}
                      </p>
                    )}
                  {item.price && (
                    <p className="mt-1 text-body-sm text-ink-soft">
                      {formatMoney(item.price.amount, item.price.currencyCode)}{" "}
                      each · {item.quantity} ordered
                    </p>
                  )}
                </div>

                <div className="col-start-2 flex items-center justify-end gap-3 sm:col-start-3">
                  <span className="font-label text-[0.7rem] tracking-[0.14em] text-ink-soft uppercase sm:hidden">
                    Returning
                  </span>
                  <QuantityStepper
                    value={quantity}
                    max={item.quantity}
                    title={item.title}
                    onChange={(next) => update(item.id, { quantity: next })}
                  />
                </div>
              </div>

              {quantity > 0 && (
                <label className="mt-5 flex max-w-sm flex-col gap-2">
                  <span className={labelClass}>
                    Why are you sending it back?
                  </span>
                  <div className="relative">
                    <select
                      value={selection?.reason ?? ""}
                      onChange={(event) =>
                        update(item.id, { reason: event.target.value })
                      }
                      className="w-full cursor-pointer appearance-none rounded-tag bg-cream px-4 py-3 pr-11 text-body text-ink transition-colors duration-300 ease-out-soft focus:outline-none"
                    >
                      <option value="">Select a reason</option>
                      {SELECTABLE_RETURN_REASONS.map((reason) => (
                        <option key={reason} value={reason}>
                          {returnReasonLabel(reason)}
                        </option>
                      ))}
                    </select>
                    <Icon
                      name="chevron-down"
                      className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-ink-faint"
                    />
                  </div>
                </label>
              )}
            </li>
          );
        })}
      </ul>

      <aside className="rounded-panel bg-paper p-6 shadow-soft lg:sticky lg:top-28">
        <h2 className="font-serif text-heading-sm text-ink uppercase">
          Summary
        </h2>

        <div className="mt-5 flex items-baseline justify-between gap-4">
          <span className="text-body-sm text-ink-soft">
            {selectedCount} item{selectedCount === 1 ? "" : "s"} selected
          </span>
          <span className="font-serif text-[1.6rem] leading-none tracking-[0.02em] text-ink uppercase">
            {formatMoney(refund, currency)}
          </span>
        </div>
        <p className="mt-2 text-caption text-ink-faint">
          Estimated refund{currency ? ` in ${currency}` : ""}, before we confirm
          your shipping instructions.
        </p>

        {error && (
          <p className="mt-5 rounded-tag bg-clay-100 px-4 py-3 text-body-sm text-sage-700">
            {error}
          </p>
        )}

        <Button
          onClick={handleSubmit}
          disabled={pending || selectedCount === 0}
          className="mt-6 w-full justify-center"
        >
          {pending ? "Sending your request…" : "Request return"}
        </Button>

        <p className="mt-4 text-caption text-ink-faint">
          We will email you shipping instructions within one business day.
        </p>
      </aside>
    </div>
  );
}

function QuantityStepper({
  value,
  max,
  title,
  onChange,
}: {
  value: number;
  max: number;
  title: string;
  onChange: (next: number) => void;
}) {
  const stepClass =
    "grid size-10 cursor-pointer place-items-center text-ink transition-colors duration-300 hover:text-sage-600 disabled:cursor-not-allowed disabled:opacity-35";

  return (
    <div className="flex shrink-0 flex-col items-end gap-1.5">
      <div className="flex items-center rounded-pill bg-cream">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value <= 0}
          aria-label={`Return one fewer ${title}`}
          className={stepClass}
        >
          <Icon name="minus" className="size-4" strokeWidth={2} />
        </button>
        <span
          aria-live="polite"
          aria-label={`Returning ${value} of ${max} ${title}`}
          className="w-8 text-center font-headline text-ink"
        >
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`Return one more ${title}`}
          className={stepClass}
        >
          <Icon name="plus" className="size-4" strokeWidth={2} />
        </button>
      </div>
      <span className="text-caption text-ink-faint">of {max}</span>
    </div>
  );
}
