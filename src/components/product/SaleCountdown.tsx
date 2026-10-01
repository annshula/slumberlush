"use client";

import { useEffect, useState } from "react";

import { Icon } from "@/components/ui/Icon";

/** Digits only, no design decisions — remaining time to a real, merchant-set Shopify deadline. */
function remaining(target: number): { hours: number; minutes: number; seconds: number } | null {
  const ms = target - Date.now();
  if (ms <= 0) return null;
  const totalSeconds = Math.floor(ms / 1000);
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

const pad = (n: number) => n.toString().padStart(2, "0");

/**
 * Offer countdown — only ever renders a deadline the merchant actually set in
 * Shopify (`custom.sale_ends_at`); the sync engine already drops past dates,
 * and this component hides itself the moment the real deadline passes rather
 * than freezing at 00:00:00 or looping.
 *
 * Starts as `null` on both the server and the client's first paint — the
 * exact countdown text depends on the visitor's clock the moment their page
 * loads, which the server can never predict (worse still with ISR: the HTML
 * may have been generated minutes or hours earlier). Computing it eagerly in
 * `useState`'s initializer would make the server-rendered text disagree with
 * what the client immediately recomputes, which is a React hydration-mismatch
 * error (#418), not just a visual flicker. Filling it in from an effect after
 * mount avoids that entirely, at the cost of one tick where nothing renders.
 */
export function SaleCountdown({
  endsAt,
  variant = "bar",
}: {
  endsAt: string;
  /** "bar": full-width strip for the top of the page. "inline": compact chip that sits beside the price. */
  variant?: "bar" | "inline";
}) {
  const target = Date.parse(endsAt);
  const [left, setLeft] = useState<ReturnType<typeof remaining>>(null);

  useEffect(() => {
    setLeft(remaining(target));
    const id = setInterval(() => setLeft(remaining(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!left) return null;

  if (variant === "inline") {
    return (
      <p
        className="inline-flex items-center gap-1.5 rounded-tag bg-clay-50 px-3 py-1.5 font-numeral text-body-sm font-medium text-clay-600 tabular-nums"
        role="timer"
        aria-live="off"
      >
        <Icon name="clock" className="size-3.5 shrink-0" />
        Offer ends in {pad(left.hours)}:{pad(left.minutes)}:{pad(left.seconds)}
      </p>
    );
  }

  const units = [
    { label: "hours", value: left.hours },
    { label: "minutes", value: left.minutes },
    { label: "seconds", value: left.seconds },
  ];

  /* A full-width strip at the very top of the product page, so the deadline is
     the first thing seen. Screen readers get one plain sentence instead of the
     ticking digits. */
  return (
    <div className="bg-clay-600 text-ivory" role="timer" aria-live="off">
      <p className="container-page flex items-center justify-center gap-3 py-2.5 font-ui text-body-sm font-medium">
        <Icon name="clock" className="size-4 shrink-0" />
        <span>Offer ends in</span>
        <span className="flex items-center gap-1 font-numeral font-semibold tabular-nums" aria-hidden="true">
          {units.map((u, i) => (
            <span key={u.label} className="flex items-center gap-1">
              {i > 0 && <span className="opacity-70">:</span>}
              <span className="min-w-8 rounded-md bg-ivory/15 px-1.5 py-0.5 text-center">
                {pad(u.value)}
              </span>
            </span>
          ))}
        </span>
        <span className="sr-only">
          {left.hours} hours {left.minutes} minutes left
        </span>
      </p>
    </div>
  );
}
