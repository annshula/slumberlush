"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { useCart } from "@/components/cart/CartProvider";
import { Icon } from "@/components/ui/Icon";
import { formatMoney } from "@/lib/money";
import { site } from "@/lib/site";

/**
 * Bag body shared by the drawer and the /cart page: lines, subtotal, checkout.
 * `onNavigate` closes the drawer when a link is followed.
 */
export function BagContents({ onNavigate }: { onNavigate?: () => void }) {
  const { lines, subtotal, currency, setQuantity, remove, checkout, hydrated } =
    useCart();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!hydrated) {
    return (
      <div className="flex-1 p-6 text-body-sm text-ink-soft">
        Loading your bag…
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-start gap-5 p-6">
        <p className="font-serif text-heading-2">Your bag is empty.</p>
        <p className="text-body-sm text-ink-soft">
          Start with our bestselling Cloud Dreamer Blanket — the softest thing you&apos;ll own.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/products/cloud-dreamer-blanket"
            className="btn-primary"
            onClick={onNavigate}
          >
            Shop the bestseller
          </Link>
          <Link
            href="/collections/all"
            className="btn-quiet"
            onClick={onNavigate}
          >
            Shop all
          </Link>
        </div>
      </div>
    );
  }

  const onCheckout = async () => {
    setPending(true);
    setError(null);
    const result = await checkout();
    if (!result.ok) {
      setError(result.error);
      setPending(false);
    }
  };

  return (
    <>
      <ul
        className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-2"
        aria-label="Items in your bag"
      >
        {lines.map((line) => (
          <li
            key={line.variantId}
            className="flex gap-4 rounded-card bg-porcelain p-3 shadow-soft"
          >
            <Link
              href={line.href}
              onClick={onNavigate}
              className="well relative size-24 shrink-0 overflow-hidden rounded-[14px]"
              tabIndex={-1}
              aria-hidden="true"
            >
              {line.image && (
                <Image
                  src={line.image}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-contain mix-blend-multiply"
                />
              )}
            </Link>
            <div className="flex min-w-0 flex-1 flex-col py-1 pr-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={line.href}
                    onClick={onNavigate}
                    className="font-medium hover:underline"
                  >
                    {line.productName}
                  </Link>
                  <p className="mt-0.5 text-body-sm text-ink-soft">
                    {line.variantLabel}
                  </p>
                </div>
                <p className="shrink-0 font-numeral font-medium tabular-nums">
                  {formatMoney(line.lineTotal, currency)}
                </p>
              </div>
              <div className="mt-auto flex items-center justify-between pt-3">
                {line.hasPackOption ? (
                  <span className="text-body-sm text-ink-soft">
                    Qty {line.quantity}
                  </span>
                ) : (
                  <div
                    className="flex items-center rounded-tag bg-cream"
                    role="group"
                    aria-label={`Quantity for ${line.productName}`}
                  >
                    <button
                      type="button"
                      className="grid size-10 place-items-center rounded-tag hover:bg-sand"
                      aria-label="Decrease quantity"
                      onClick={() =>
                        setQuantity(line.variantId, line.quantity - 1)
                      }
                    >
                      <Icon name="minus" className="size-4" />
                    </button>
                    <span
                      className="w-8 text-center tabular-nums"
                      aria-live="polite"
                    >
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      className="grid size-10 place-items-center rounded-tag hover:bg-sand disabled:opacity-40"
                      aria-label="Increase quantity"
                      disabled={line.quantity >= 10}
                      onClick={() =>
                        setQuantity(line.variantId, line.quantity + 1)
                      }
                    >
                      <Icon name="plus" className="size-4" />
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => remove(line.variantId)}
                  className="min-h-10 text-body-sm text-ink-soft underline underline-offset-4 hover:text-ink"
                >
                  Remove<span className="sr-only"> {line.productName}</span>
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="m-3 mt-4 rounded-[22px] bg-porcelain px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-float">
        <div className="flex items-baseline justify-between">
          <span>Subtotal</span>
          <span className="font-numeral text-heading-2 font-semibold tabular-nums">
            {formatMoney(subtotal, currency)}
          </span>
        </div>
        <p className="mt-1 text-body-sm text-ink-soft">
          Shipping and taxes are calculated at checkout.
        </p>
        {error && (
          <p role="alert" className="mt-3 text-body-sm text-error">
            {error}
          </p>
        )}
        <button
          type="button"
          className="btn-primary mt-4 w-full"
          onClick={onCheckout}
          disabled={pending}
        >
          {pending ? "Opening secure checkout…" : "Checkout"}
        </button>
        <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-body-sm text-ink-soft">
          <li className="flex items-center gap-1.5">
            <Icon name="shield" className="size-4" /> Secure checkout by Shopify
          </li>
          <li className="flex items-center gap-1.5">
            <Icon name="truck" className="size-4" /> Tracked delivery,{" "}
            {site.delivery.minDays}–{site.delivery.maxDays} days
          </li>
        </ul>
      </div>
    </>
  );
}
