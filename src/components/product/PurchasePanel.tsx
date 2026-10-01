"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { SaleCountdown } from "@/components/product/SaleCountdown";
import { useCart } from "@/components/cart/CartProvider";
import { useLocalization } from "@/components/localization/LocalizationProvider";
import { Icon } from "@/components/ui/Icon";
import { trackSelectVariant, trackViewItem } from "@/lib/analytics";
import type { ProductView, ViewVariant } from "@/lib/commerce/product-view";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * A variant's price/compareAt/savings/perUnit, in the visitor's live Shopify
 * currency when one has been fetched, otherwise the catalog's base-currency
 * numbers unchanged. Mirrors the arithmetic in lib/commerce/product-view.ts,
 * just against whichever amount is actually being shown.
 */
type LocalizedVariant = ViewVariant & { currency: string };

function localize(
  v: ViewVariant,
  baseCurrency: string,
  localizedPriceFor: (id: string) => {
    amount: string;
    currencyCode: string;
    compareAtAmount: string | null;
  } | null,
  singleUnitPrice: number | null,
): LocalizedVariant {
  const live = localizedPriceFor(v.id);
  if (!live) return { ...v, currency: baseCurrency };

  const price = Number.parseFloat(live.amount);
  if (!Number.isFinite(price)) return { ...v, currency: baseCurrency };

  const compareAtRaw =
    live.compareAtAmount != null
      ? Number.parseFloat(live.compareAtAmount)
      : null;
  const compareAtPrice =
    compareAtRaw != null &&
    Number.isFinite(compareAtRaw) &&
    compareAtRaw > price
      ? compareAtRaw
      : null;
  const compareAtPercent = compareAtPrice
    ? Math.round((1 - price / compareAtPrice) * 100)
    : null;
  const perUnit = Math.round((price / v.units) * 100) / 100;
  const savings =
    singleUnitPrice != null && v.units > 1
      ? (() => {
          const raw = singleUnitPrice * v.units - price;
          return raw > 0.009 ? Math.round(raw * 100) / 100 : null;
        })()
      : null;

  return {
    ...v,
    price,
    compareAtPrice,
    compareAtPercent,
    perUnit,
    savings,
    currency: live.currencyCode,
  };
}

/**
 * The PDP's buying controls — the only client island in the purchase column.
 *
 *  - Options are native radio groups in fieldsets (keyboard + screen-reader
 *    behaviour for free). Combinations Shopify doesn't have are disabled and
 *    labelled, never silently hidden.
 *  - Savings shown are arithmetic vs. buying single sets (see product-view.ts).
 *  - The selected variant is mirrored to `?variant=` for shareable links; the
 *    canonical URL stays the bare product URL.
 *  - A sticky add-to-bag bar appears on small screens once the main button
 *    scrolls out of view.
 */

const numericId = (gid: string) => gid.split("/").pop() ?? gid;

function findVariant(
  view: ProductView,
  selection: Record<string, string>,
): ViewVariant | undefined {
  return view.variants.find((v) =>
    view.options.every((o) => v.options[o.name] === selection[o.name]),
  );
}

/**
 * "Choose your pack" — one full-width row per pack size, not a 3-up grid.
 * A row is easier to compare (price, per-unit cost and savings sit on the
 * same line) and gives the middle size room for a merchandising badge.
 * The badge is a recommendation we're making, not a sales-data claim — it
 * sits on the middle size only because that's genuinely where the per-unit
 * price first drops meaningfully, not because of invented "X people bought
 * this" style numbers.
 */
function PackFieldset({
  option,
  selection,
  view,
  onChoose,
  optionAvailable,
  localizedVariantFor,
}: {
  option: ProductView["options"][number];
  selection: Record<string, string>;
  view: ProductView;
  onChoose: (name: string, value: string) => void;
  optionAvailable: (name: string, value: string) => boolean;
  localizedVariantFor: (v: ViewVariant) => LocalizedVariant;
}) {
  const name = option.name;
  const middleIndex =
    option.values.length >= 3 ? Math.floor(option.values.length / 2) : -1;
  const lastIndex = option.values.length - 1;

  return (
    <fieldset className="min-w-0">
      <legend className="mb-4 text-body-sm font-semibold">
        {option.label}
      </legend>
      <div className="flex flex-col gap-3">
        {option.values.map((value, i) => {
          const available = optionAvailable(name, value.value);
          const rawCombo = findVariant(view, {
            ...selection,
            [name]: value.value,
          });
          const exists = Boolean(rawCombo);
          const checked = selection[name] === value.value;
          const combo = rawCombo ? localizedVariantFor(rawCombo) : undefined;
          const recommended = i === middleIndex && exists;
          const bestValue = i === lastIndex && i !== middleIndex && exists;

          const saving = combo
            ? (combo.savings ??
              (combo.units === 1 && combo.compareAtPrice
                ? combo.compareAtPrice - combo.price
                : null))
            : null;

          return (
            <label
              key={value.value}
              data-checked={checked}
              data-disabled={!exists}
              className={cn(
                "group relative flex cursor-pointer flex-col gap-2.5 rounded-card border-2 border-transparent bg-porcelain px-4 py-3.5 shadow-soft transition-all duration-200 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-sage-600 sm:flex-row sm:items-center sm:gap-4 sm:px-5 sm:py-4",
                checked
                  ? "border-sage-600 bg-sage-100 shadow-none"
                  : "hover:border-sand hover:shadow-float",
                !exists &&
                  "cursor-not-allowed opacity-50 hover:border-transparent hover:shadow-soft",
              )}
            >
              <input
                type="radio"
                name={name}
                value={value.value}
                checked={checked}
                onChange={() => onChoose(name, value.value)}
                disabled={!exists}
                className="sr-only"
                aria-describedby={
                  !exists ? `${name}-${value.value}-na` : undefined
                }
              />

              {/* Top row on mobile: dot + label on the left, price on the right — the natural place an eye looks first. Desktop keeps everything in one row. */}
              <span className="flex items-center justify-between gap-3 sm:contents">
                <span className="flex min-w-0 items-center gap-3 sm:contents">
                  {/* Radio dot */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors duration-200",
                      checked
                        ? "border-sage-600 bg-sage-600"
                        : "border-sand bg-ivory",
                    )}
                  >
                    {checked && (
                      <span className="size-1.5 rounded-full bg-ivory" />
                    )}
                  </span>
                  <span className="text-body-sm font-semibold sm:hidden">
                    {value.label}
                  </span>
                </span>

                {combo && (
                  <span className="flex shrink-0 items-baseline gap-1.5 sm:hidden">
                    {combo.compareAtPrice && (
                      <span className="font-numeral text-[0.7rem] text-ink-soft tabular-nums line-through">
                        {formatMoney(combo.compareAtPrice, combo.currency)}
                      </span>
                    )}
                    <span className="font-numeral text-body-lg font-semibold tabular-nums">
                      {formatMoney(combo.price, combo.currency)}
                    </span>
                  </span>
                )}
              </span>

              <span className="min-w-0 sm:flex-1">
                <span className="hidden flex-wrap items-center gap-2 sm:flex">
                  <span className="text-body-sm font-semibold">
                    {value.label}
                  </span>
                  {recommended && (
                    <span className="inline-flex items-center rounded-tag bg-sage-600 px-2.5 py-1 font-headline text-[0.72rem] leading-none font-semibold tracking-wide text-ivory uppercase">
                      Most popular
                    </span>
                  )}
                  {bestValue && (
                    <span className="inline-flex items-center rounded-tag bg-clay-600 px-2.5 py-1 font-headline text-[0.72rem] leading-none font-semibold tracking-wide text-ivory uppercase">
                      Best value
                    </span>
                  )}
                </span>
                {(recommended || bestValue) && (
                  <span className="flex flex-wrap items-center gap-1.5 sm:hidden">
                    {recommended && (
                      <span className="inline-flex items-center rounded-tag bg-sage-600 px-2 py-0.5 font-headline text-[0.66rem] leading-none font-semibold tracking-wide text-ivory uppercase">
                        Most popular
                      </span>
                    )}
                    {bestValue && (
                      <span className="inline-flex items-center rounded-tag bg-clay-600 px-2 py-0.5 font-headline text-[0.66rem] leading-none font-semibold tracking-wide text-ivory uppercase">
                        Best value
                      </span>
                    )}
                  </span>
                )}
                {combo && combo.units > 1 && (
                  <span className="mt-1 block font-numeral text-[0.75rem] text-ink-soft tabular-nums sm:mt-0.5">
                    {formatMoney(combo.perUnit, combo.currency)} / set
                    {saving != null && (
                      <span className="text-clay-600">
                        {" "}
                        · Save {formatMoney(saving, combo.currency)}
                      </span>
                    )}
                  </span>
                )}
                {combo && combo.units === 1 && saving != null && (
                  <span className="mt-1 block font-numeral text-[0.75rem] font-medium text-clay-600 tabular-nums sm:mt-0.5">
                    Save {formatMoney(saving, combo.currency)}
                  </span>
                )}
                {!exists && (
                  <span
                    id={`${name}-${value.value}-na`}
                    className="mt-1 block text-[0.75rem] text-ink-soft sm:mt-0.5"
                  >
                    Not available in this set
                  </span>
                )}
                {exists && !available && (
                  <span
                    id={`${name}-${value.value}-na`}
                    className="mt-1 block text-[0.75rem] text-ink-soft sm:mt-0.5"
                  >
                    Sold out
                  </span>
                )}
              </span>

              {combo && (
                <span className="hidden shrink-0 flex-col items-end sm:flex">
                  <span className="flex items-baseline gap-1.5">
                    {combo.compareAtPrice && (
                      <span className="font-numeral text-[0.7rem] text-ink-soft tabular-nums line-through">
                        {formatMoney(combo.compareAtPrice, combo.currency)}
                      </span>
                    )}
                    <span className="font-numeral text-heading-3 font-semibold tabular-nums">
                      {formatMoney(combo.price, combo.currency)}
                    </span>
                  </span>
                  {saving != null && (
                    <span className="font-numeral text-[0.72rem] font-medium text-clay-600 tabular-nums">
                      Save {formatMoney(saving, combo.currency)}
                    </span>
                  )}
                </span>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * The photo tile for a pack card. When every pack shares one photo (the shop
 * has a single product shot, not one per pack size), a bigger pack shows that
 * shot once per set, fanned out — so the card still says "2 sets" or "3 sets"
 * at a glance without inventing imagery.
 */
function PackPhoto({
  src,
  units,
  fan,
  sizes,
  padded,
  reserve,
}: {
  src: string;
  units: number;
  fan: boolean;
  sizes: string;
  padded?: boolean;
  /** Keep the right edge clear, for a badge that sits on that corner. */
  reserve?: boolean;
}) {
  const count = fan ? Math.min(Math.max(units, 1), 3) : 1;
  if (count === 1) {
    return (
      <Image
        src={src}
        alt=""
        fill
        sizes={sizes}
        className={cn("object-contain mix-blend-multiply", padded && "p-1")}
      />
    );
  }
  /* Bottles sit close together (each shot has empty space around the bottle),
     and the whole fan stops short of the right edge when a badge sits there. */
  const step = count === 2 ? 26 : 16;
  const width = 100 - (count - 1) * step;
  return (
    <span
      className="absolute inset-y-0 left-0"
      style={{ right: reserve ? "20%" : 0 }}
    >
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="absolute inset-y-0"
          style={{ left: `${i * step}%`, width: `${width}%` }}
        >
          <Image
            src={src}
            alt=""
            fill
            sizes={sizes}
            className="object-contain mix-blend-multiply"
          />
        </span>
      ))}
    </span>
  );
}

/**
 * "Cards" pack picker (editorial PDP): one card per pack in a row, largest
 * pack first, each with its own photo, price, per-unit price and saving.
 * "Best value" is arithmetic — it goes on a pack only when that pack has the
 * lowest per-unit price of all — never a sales claim.
 */
function PackCards({
  option,
  selection,
  view,
  onChoose,
  optionAvailable,
  localizedVariantFor,
}: {
  option: ProductView["options"][number];
  selection: Record<string, string>;
  view: ProductView;
  onChoose: (name: string, value: string) => void;
  optionAvailable: (name: string, value: string) => boolean;
  localizedVariantFor: (v: ViewVariant) => LocalizedVariant;
}) {
  const name = option.name;
  const rows = option.values
    .map((value) => {
      const raw = findVariant(view, { ...selection, [name]: value.value });
      return { value, combo: raw ? localizedVariantFor(raw) : undefined };
    })
    .reverse();
  const lowest = Math.min(
    ...rows.flatMap((r) => (r.combo ? [r.combo.perUnit] : [])),
  );
  const bestUnits = Math.max(
    ...rows.flatMap((r) =>
      r.combo && r.combo.perUnit === lowest ? [r.combo.units] : [],
    ),
  );

  /* A bigger pack priced the same as a smaller one is a real "get N free"
     deal — derived from the two prices, never typed by hand. */
  const freeFor = (c: LocalizedVariant | undefined) => {
    if (!c) return null;
    const same = rows.find(
      (r) =>
        r.combo &&
        r.combo.units < c.units &&
        Math.abs(r.combo.price - c.price) < 0.005,
    );
    return same?.combo ? { free: c.units - same.combo.units, of: same.combo.units } : null;
  };

  const photoOf = (c: LocalizedVariant | undefined) =>
    c?.image ?? view.cardImage?.url ?? null;
  const sharedPhoto = rows.every((r) => photoOf(r.combo) === photoOf(rows[0]?.combo));

  const cards = rows.map(({ value, combo }) => {
    const exists = Boolean(combo);
    const deal = freeFor(combo);
    const offer = deal !== null;
    const best =
      !offer &&
      exists &&
      combo!.units === bestUnits &&
      rows.some((r) => r.combo && r.combo.perUnit > lowest);
    /* Shopify's own compare-at price wins; otherwise the saving is pure
       arithmetic against buying single bottles. */
    const pct =
      combo?.compareAtPercent ??
      (combo?.savings != null
        ? Math.round((combo.savings / (combo.savings + combo.price)) * 100)
        : null);
    return {
      value,
      combo,
      exists,
      deal,
      offer,
      pct,
      checked: selection[name] === value.value,
      available: optionAvailable(name, value.value),
      tag: deal ? `Mega offer · ${deal.free} free` : best ? "Best value" : null,
      offerLine: deal && combo ? `${combo.units} for the price of ${deal.of}` : null,
      saved: combo
        ? combo.compareAtPrice
          ? combo.compareAtPrice - combo.price
          : combo.savings
        : null,
      img: combo?.image ?? view.cardImage?.url ?? null,
      units: combo?.units ?? 1,
      fan: sharedPhoto,
    };
  });

  return (
    <fieldset className="min-w-0">
      <legend className="mb-3 text-body font-semibold">{option.label}</legend>
      {/* Two layouts, each with its own radios (distinct group names so the
          browser never treats them as one group): a stacked, thumb-first list
          on phones, and the three photo cards from sm up. */}

      {/* ── Phones ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 pt-3 sm:hidden">
        {cards.map((c) => (
          <label
            key={c.value.value}
            data-checked={c.checked}
            className={cn(
              "group relative flex cursor-pointer flex-col rounded-[18px] border transition-[border-color,box-shadow,transform] duration-200 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-sage-800 motion-safe:active:scale-[0.985]",
              c.offer ? "bg-linear-to-br from-clay-50 via-clay-50 to-paper" : "bg-paper",
              c.checked
                ? c.offer
                  ? "border-clay-600 shadow-[0_0_0_1px_var(--color-clay-600),0_14px_32px_-16px_rgb(147_88_74/0.5)]"
                  : "border-sage-800 shadow-[0_0_0_1px_var(--color-sage-800),0_14px_32px_-18px_rgb(36_49_41/0.5)]"
                : c.offer
                  ? "border-clay-600/40 hover:border-clay-600"
                  : "border-sand hover:border-sage-300",
              !c.exists && "cursor-not-allowed opacity-50",
            )}
          >
            <input
              type="radio"
              name={`${name}-m`}
              value={c.value.value}
              checked={c.checked}
              onChange={() => onChoose(name, c.value.value)}
              disabled={!c.exists}
              className="sr-only"
            />

            {/* Floating tag on the card's top edge. */}
            {c.tag && (
              <span
                className={cn(
                  "absolute -top-3 left-4 z-10 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-ui text-[0.66rem] leading-none font-semibold tracking-[0.08em] text-ivory uppercase shadow-[0_6px_14px_-6px_rgb(40_28_16/0.45)]",
                  c.offer ? "bg-linear-to-r from-clay-600 to-[#b0715f]" : "bg-sage-800",
                )}
              >
                <Icon name={c.offer ? "gift" : "star"} className="size-3" />
                {c.tag}
              </span>
            )}

            <span className="flex items-center gap-3.5 p-4 pt-5">
              {/* Photo tile with the selection marker on its corner. */}
              <span className="relative block size-16 shrink-0">
                <span className="relative block size-full overflow-hidden rounded-[14px]">
                  {c.img && (
                    <PackPhoto
                      src={c.img}
                      units={c.units}
                      fan={c.fan}
                      reserve={Boolean(c.deal)}
                      sizes="64px"
                      padded
                    />
                  )}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute -top-1.5 -left-1.5 grid size-5.5 place-items-center rounded-full border-2 bg-paper transition-colors duration-200",
                    c.checked
                      ? c.offer
                        ? "border-clay-600 bg-clay-600"
                        : "border-sage-800 bg-sage-800"
                      : "border-sand",
                  )}
                >
                  {c.checked && <Icon name="check" className="size-3 text-ivory" />}
                </span>
                {c.deal && (
                  <span className="absolute -right-2 -bottom-2 grid size-9 place-items-center rounded-full border-2 border-paper bg-clay-600 text-center font-numeral text-[0.55rem] leading-[1.05] font-bold text-ivory">
                    +{c.deal.free}
                    <br />
                    FREE
                  </span>
                )}
              </span>

              <span className="flex min-w-0 flex-1 flex-col items-start">
                <span className="font-ui text-[1.02rem] leading-tight font-semibold text-ink">
                  {c.value.label}
                </span>
                {c.offerLine && (
                  <span className="mt-1 text-body-sm font-medium text-clay-600">
                    {c.offerLine}
                  </span>
                )}
                {c.exists && !c.available && (
                  <span className="mt-1 text-[0.72rem] text-ink-soft">Sold out</span>
                )}
              </span>

              {c.combo && (
                <span className="flex shrink-0 flex-col items-end">
                  {c.combo.compareAtPrice && (
                    <span className="font-numeral text-[0.75rem] text-ink-faint tabular-nums line-through decoration-1">
                      {formatMoney(c.combo.compareAtPrice, c.combo.currency)}
                    </span>
                  )}
                  <span
                    className={cn(
                      "font-numeral leading-none font-semibold tracking-tight tabular-nums",
                      c.offer ? "text-[1.6rem] text-clay-600" : "text-[1.3rem] text-ink",
                    )}
                  >
                    {formatMoney(c.combo.price, c.combo.currency)}
                  </span>
                </span>
              )}
            </span>

            {/* Savings footer: real arithmetic from Shopify's prices. */}
            {c.combo && c.pct != null && c.pct > 0 && c.saved != null && c.saved > 0.009 && (
              <span
                className={cn(
                  "mt-auto flex items-center justify-between gap-2 rounded-b-[17px] border-t border-dashed px-4 py-2 font-ui text-[0.74rem]",
                  c.offer
                    ? "border-clay-200 bg-clay-100/70 text-clay-600"
                    : "border-sand bg-cream/60 text-sage-800",
                )}
              >
                <span className="font-medium">
                  You save{" "}
                  <span className="font-numeral font-semibold tabular-nums">
                    {formatMoney(c.saved, c.combo.currency)}
                  </span>
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 font-numeral text-[0.68rem] font-semibold tabular-nums text-ivory",
                    c.offer ? "bg-clay-600" : "bg-sage-800",
                  )}
                >
                  −{c.pct}%
                </span>
              </span>
            )}
          </label>
        ))}
      </div>

      {/* ── Tablet and desktop: three photo cards ──────────────────────── */}
      <div className="hidden gap-3 sm:grid sm:grid-cols-3">
        {cards.map((c) => (
          <label
            key={c.value.value}
            data-checked={c.checked}
            className={cn(
              "relative flex cursor-pointer flex-col items-center rounded-2xl border px-3 pb-3 text-center transition-all duration-200 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-sage-800",
              c.tag ? "pt-8" : "pt-6",
              c.offer
                ? cn(
                    "bg-clay-50",
                    c.checked
                      ? "border-clay-600 shadow-[inset_0_0_0_1px_var(--color-clay-600)]"
                      : "border-clay-600/50 hover:border-clay-600",
                  )
                : cn(
                    "bg-paper",
                    c.checked
                      ? "border-sage-800 shadow-[inset_0_0_0_1px_var(--color-sage-800)]"
                      : "border-sand hover:border-sage-300",
                  ),
              !c.exists && "cursor-not-allowed opacity-50",
            )}
          >
            <input
              type="radio"
              name={`${name}-d`}
              value={c.value.value}
              checked={c.checked}
              onChange={() => onChoose(name, c.value.value)}
              disabled={!c.exists}
              className="sr-only"
            />
            {c.tag && (
              <span
                className={cn(
                  "absolute -top-px -left-px rounded-tl-2xl rounded-br-tag px-2.5 py-1.5 font-ui text-[0.68rem] leading-none font-semibold tracking-wide text-ivory uppercase",
                  c.offer ? "bg-clay-600" : "bg-sage-800",
                )}
              >
                {c.tag}
              </span>
            )}
            <span
              aria-hidden="true"
              className={cn(
                "absolute top-2.5 right-2.5 grid size-5 place-items-center rounded-full border-2 transition-colors duration-200",
                c.checked
                  ? c.offer
                    ? "border-clay-600 bg-clay-600"
                    : "border-sage-800 bg-sage-800"
                  : "border-sand bg-ivory",
              )}
            >
              {c.checked && <Icon name="check" className="size-3 text-ivory" />}
            </span>

            <span className="relative block aspect-square w-full max-w-24">
              <span className="relative block size-full overflow-hidden rounded-tag">
                {c.img && (
                  <PackPhoto
                    src={c.img}
                    units={c.units}
                    fan={c.fan}
                    reserve={Boolean(c.deal)}
                    sizes="96px"
                  />
                )}
              </span>
              {c.deal && (
                <span className="absolute -right-2 -bottom-2 grid size-10 place-items-center rounded-full border-2 border-paper bg-clay-600 text-center font-numeral text-[0.6rem] leading-[1.05] font-bold text-ivory">
                  +{c.deal.free}
                  <br />
                  FREE
                </span>
              )}
            </span>

            <span className="mt-2 text-body-sm font-medium">{c.value.label}</span>
            {c.offerLine && (
              <span className="text-[0.78rem] font-semibold text-clay-600">
                {c.offerLine}
              </span>
            )}
            {c.combo && (
              <span className="mt-1 flex flex-col items-center">
                {c.combo.compareAtPrice && (
                  <span className="font-numeral text-[0.72rem] text-ink-soft tabular-nums line-through">
                    {formatMoney(c.combo.compareAtPrice, c.combo.currency)}
                  </span>
                )}
                <span className="font-numeral text-body-lg font-semibold tabular-nums">
                  {formatMoney(c.combo.price, c.combo.currency)}
                </span>
              </span>
            )}
            {c.pct != null && c.pct > 0 && (
              <span
                className={cn(
                  "mt-1.5 rounded-tag px-2 py-0.5 font-numeral text-[0.7rem] font-medium tabular-nums",
                  c.offer ? "bg-clay-100 text-clay-600" : "bg-sage-100 text-sage-800",
                )}
              >
                Save {c.pct}%
              </span>
            )}
            {c.exists && !c.available && (
              <span className="mt-1 text-[0.72rem] text-ink-soft">Sold out</span>
            )}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Photo swatches for the colour option: each value is a round crop of that
 * colour's own photo. Native radios underneath, so arrow keys move between
 * colours and screen readers announce "Colour, Cappuccino, 3 of 16".
 */
function SwatchFieldset({
  option,
  swatches,
  selection,
  onChoose,
  optionAvailable,
}: {
  option: ProductView["options"][number];
  swatches: ProductView["swatches"];
  selection: Record<string, string>;
  onChoose: (name: string, value: string) => void;
  optionAvailable: (name: string, value: string) => boolean;
}) {
  const current = option.values.find((v) => v.value === selection[option.name]);
  return (
    <fieldset className="min-w-0">
      <legend className="mb-3 flex w-full items-baseline gap-2 text-body-sm font-semibold">
        {option.label}:
        <span className="font-normal text-ink-soft">{current?.label}</span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {swatches.map((s) => {
          const checked = selection[option.name] === s.value;
          const available = optionAvailable(option.name, s.value);
          return (
            <label
              key={s.value}
              title={s.label}
              className={cn(
                "relative grid size-11 cursor-pointer place-items-center rounded-full transition-shadow duration-200 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-sage-600",
                checked
                  ? "shadow-[0_0_0_2px_var(--color-ivory),0_0_0_3.5px_var(--color-ink)]"
                  : "hover:shadow-[0_0_0_2px_var(--color-ivory),0_0_0_3px_var(--color-sand)]",
              )}
            >
              <input
                type="radio"
                name={`${option.name}-swatch`}
                value={s.value}
                checked={checked}
                onChange={() => onChoose(option.name, s.value)}
                className="sr-only"
                aria-label={`${s.label}${available ? "" : " — sold out"}`}
              />
              <span className="relative block size-full overflow-hidden rounded-full bg-sand ring-1 ring-ink/10">
                {s.image && (
                  <Image src={s.image} alt="" fill sizes="44px" className="scale-[2.2] object-cover" />
                )}
              </span>
              {!available && (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 m-auto h-px w-[120%] -rotate-45 bg-ink/60"
                />
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function PurchasePanel({
  view,
  packs = "list",
}: {
  view: ProductView;
  /** "cards": one photo card per pack in a row, instead of the stacked rows. */
  packs?: "list" | "cards";
}) {
  const cardsMode = packs === "cards";
  const { add, open } = useCart();
  const { localizedPriceFor, requestPrices } = useLocalization();
  const initial =
    view.variants.find((v) => v.id === view.defaultVariantId) ??
    view.variants[0]!;
  const [selection, setSelection] = useState<Record<string, string>>(
    initial.options,
  );
  const [added, setAdded] = useState(false);
  const [, startTransition] = useTransition();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [showSticky, setShowSticky] = useState(false);

  const variant = findVariant(view, selection);
  const canBuy = Boolean(variant?.availableForSale);

  const singleUnitVariant = view.variants.find((v) => v.units === 1);
  const localizedVariantFor = useMemo(
    () => (v: ViewVariant) => {
      const singleLocal = singleUnitVariant
        ? localizedPriceFor(singleUnitVariant.id)
        : null;
      const singleUnitPrice = singleLocal
        ? Number.parseFloat(singleLocal.amount)
        : (singleUnitVariant?.price ?? null);
      return localize(v, view.currency, localizedPriceFor, singleUnitPrice);
    },
    [localizedPriceFor, singleUnitVariant, view.currency],
  );
  const localizedVariant = localizedVariantFor(variant ?? initial);

  // Every variant's price is needed up front — the pack cards show all of
  // them, not just the selected one.
  useEffect(() => {
    requestPrices(view.variants.map((v) => v.id));
  }, [requestPrices, view.variants]);

  // Restore a shared ?variant= link.
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("variant");
    const fromUrl = param
      ? view.variants.find((v) => numericId(v.id) === param)
      : undefined;
    if (fromUrl) {
      setSelection(fromUrl.options);
      window.dispatchEvent(
        new CustomEvent("bl:variant", {
          detail: {
            variantId: fromUrl.id,
            group: view.swatchOptionName
              ? (fromUrl.options[view.swatchOptionName] ?? null)
              : null,
          },
        }),
      );
    }
    const v = fromUrl ?? initial;
    trackViewItem(
      { id: v.id, name: view.name, variant: v.label, price: v.price },
      view.currency,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = buttonRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) =>
      setShowSticky(
        !entry!.isIntersecting && entry!.boundingClientRect.top < 0,
      ),
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const choose = (name: string, value: string) => {
    let next = { ...selection, [name]: value };
    // If the new combination doesn't exist, keep the choice and move the other option to one that does.
    if (!findVariant(view, next)) {
      const fallback =
        view.variants.find(
          (v) => v.options[name] === value && v.availableForSale,
        ) ?? view.variants.find((v) => v.options[name] === value);
      if (fallback) next = { ...fallback.options };
    }
    setSelection(next);
    setAdded(false);
    const v = findVariant(view, next);
    if (!v) return;
    startTransition(() => {
      const url = new URL(window.location.href);
      url.searchParams.set("variant", numericId(v.id));
      window.history.replaceState(window.history.state, "", url);
    });
    window.dispatchEvent(
      new CustomEvent("bl:variant", {
        detail: {
          variantId: v.id,
          group: view.swatchOptionName
            ? (next[view.swatchOptionName] ?? null)
            : null,
        },
      }),
    );
    trackSelectVariant({
      id: v.id,
      name: view.name,
      variant: v.label,
      price: v.price,
    });
  };

  const onAdd = () => {
    if (!variant || !canBuy) return;
    add(variant.id, 1);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  };

  const optionAvailable = (name: string, value: string) => {
    const exact = findVariant(view, { ...selection, [name]: value });
    if (exact) return exact.availableForSale;
    // Non-pack option whose combination is missing: available if any variant with that value is.
    return view.variants.some(
      (v) => v.options[name] === value && v.availableForSale,
    );
  };

  const priceLine = useMemo(() => {
    if (!variant) return null;
    const v = localizedVariantFor(variant);
    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:justify-between">
          <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 sm:justify-start">
            {v.compareAtPrice && (
              <p className="font-numeral text-body-lg text-ink-soft tabular-nums line-through">
                {formatMoney(v.compareAtPrice, v.currency)}
              </p>
            )}
            <p
              className="font-numeral text-heading-2 font-semibold tabular-nums"
              aria-live="polite"
            >
              {formatMoney(v.price, v.currency)}
            </p>
            {v.compareAtPercent && (
              <p className="inline-flex items-center rounded-tag bg-clay-600 px-2.5 py-1 font-numeral text-[0.8rem] leading-none font-bold tracking-wide text-ivory tabular-nums">
                −{v.compareAtPercent}% OFF
              </p>
            )}
          </div>
          {view.saleEndsAt && (
            <SaleCountdown endsAt={view.saleEndsAt} variant="inline" />
          )}
        </div>
      </div>
    );
  }, [variant, localizedVariantFor, view.saleEndsAt]);

  return (
    <div>
      <div className="space-y-7">
        {view.options.map((option) => {
          const isPack = option.name === view.packOptionName;

          if (option.name === view.swatchOptionName && view.swatches.length > 0) {
            return (
              <SwatchFieldset
                key={option.name}
                option={option}
                swatches={view.swatches}
                selection={selection}
                onChoose={choose}
                optionAvailable={optionAvailable}
              />
            );
          }

          if (isPack && cardsMode) {
            return (
              <PackCards
                key={option.name}
                option={option}
                selection={selection}
                view={view}
                onChoose={choose}
                optionAvailable={optionAvailable}
                localizedVariantFor={localizedVariantFor}
              />
            );
          }

          if (isPack) {
            return (
              <PackFieldset
                key={option.name}
                option={option}
                selection={selection}
                view={view}
                onChoose={choose}
                optionAvailable={optionAvailable}
                localizedVariantFor={localizedVariantFor}
              />
            );
          }

          return (
            <fieldset key={option.name} className="min-w-0">
              <legend className="mb-3 flex w-full items-baseline justify-between text-body-sm font-semibold">
                {option.label}
                <span className="font-normal text-ink-soft">
                  {
                    option.values.find(
                      (v) => v.value === selection[option.name],
                    )?.label
                  }
                </span>
              </legend>
              <div
                className={cn(
                  "grid gap-2.5",
                  option.values.length > 6
                    ? "grid-cols-3 sm:grid-cols-4"
                    : option.values.length === 4
                      ? "grid-cols-2"
                      : "grid-cols-2 sm:grid-cols-3",
                )}
              >
                {option.values.map((value) => {
                  const available = optionAvailable(option.name, value.value);
                  const checked = selection[option.name] === value.value;
                  return (
                    <label
                      key={value.value}
                      data-checked={checked}
                      data-disabled={!available}
                      className="option-card flex min-h-16 flex-col justify-center gap-0.5 px-4 py-3 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-sage-600"
                    >
                      <input
                        type="radio"
                        name={option.name}
                        value={value.value}
                        checked={checked}
                        onChange={() => choose(option.name, value.value)}
                        className="sr-only"
                        aria-describedby={
                          !available
                            ? `${option.name}-${value.value}-na`
                            : undefined
                        }
                      />
                      <span className="text-body-sm font-medium">
                        {value.label}
                      </span>
                      {!available && (
                        <span
                          id={`${option.name}-${value.value}-na`}
                          className="text-[0.75rem] text-ink-soft"
                        >
                          Sold out
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </div>

      <div className="mt-9">
        {priceLine}
        <button
          ref={buttonRef}
          type="button"
          className="btn-primary mt-4 w-full"
          onClick={onAdd}
          disabled={!canBuy}
        >
          {!variant ? (
            "Choose your options"
          ) : !canBuy ? (
            "Sold out"
          ) : added ? (
            <>
              <Icon name="check" className="size-4" /> Added to bag
            </>
          ) : (
            "Add to bag"
          )}
        </button>
        <p className="mt-3 flex items-center justify-center gap-1.5 font-sans text-[0.8rem] font-medium text-ink-soft">
          <Icon name="shield" className="size-3.5 shrink-0" />
          Secure payment by Shopify
        </p>
      </div>

      {/* Sticky mobile bar */}
      <div
        className={cn(
          "glass fixed inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-20 rounded-[20px] p-3 pl-5 transition-transform duration-500 ease-out-soft lg:hidden",
          showSticky ? "translate-y-0" : "translate-y-[calc(100%+1.5rem)]",
        )}
        aria-hidden={!showSticky}
        inert={!showSticky}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-serif text-heading-3">
              {variant?.label ?? view.name}
            </p>
            <p className="font-numeral text-body-sm font-medium text-ink-soft tabular-nums">
              {variant
                ? formatMoney(localizedVariant.price, localizedVariant.currency)
                : ""}
            </p>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={added ? open : onAdd}
            disabled={!canBuy}
          >
            {added ? "View bag" : "Add to bag"}
          </button>
        </div>
      </div>
    </div>
  );
}
