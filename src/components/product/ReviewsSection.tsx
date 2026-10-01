"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Stars } from "@/components/ui/Stars";
import { demoReviewsFor } from "@/data/reviews";
import type { ProductReviews, Review } from "@/lib/judgeme/types";
import { cn } from "@/lib/utils";

/**
 * The review feed: an aggregate panel (clickable star breakdown), quick filters
 * and a paginated list of full reviews.
 *
 * Two sources, one UI:
 *  - `data` — verified reviews fetched from Judge.me on the server.
 *  - otherwise the placeholder set in `data/reviews.ts`, generated locally, so
 *    524 reviews never travel through the RSC payload. See that file's doc
 *    comment: placeholder reviews are UI only and never reach schema.
 *
 * Client-side because filtering and paging are instant interactions — but the
 * first page is still server-rendered, so reviews are in the HTML for crawlers.
 */

/** Reviews per page in the feed. */
const PAGE_SIZE = 8;
const STAR_ORDER = [5, 4, 3, 2, 1] as const;

type Filter = "all" | "photo" | Review["rating"];

export function ReviewsSection({
  data,
  handle,
}: {
  data: ProductReviews | null;
  handle: string;
}) {
  const set = data ?? demoReviewsFor(handle);
  const reviews = useMemo(() => set?.reviews ?? [], [set]);
  const summary = set?.summary ?? null;

  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const listRef = useRef<HTMLDivElement>(null);

  const counts = useMemo(() => {
    const by: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let photos = 0;
    for (const r of reviews) {
      by[r.rating] = (by[r.rating] ?? 0) + 1;
      if (r.images.length > 0) photos += 1;
    }
    return { by, photos };
  }, [reviews]);

  const filtered = useMemo(() => {
    if (filter === "all") return reviews;
    if (filter === "photo") return reviews.filter((r) => r.images.length > 0);
    return reviews.filter((r) => r.rating === filter);
  }, [reviews, filter]);

  if (!summary) return <NoReviewsYet />;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );
  const from = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const to = Math.min(safePage * PAGE_SIZE, filtered.length);
  const recommendPercent = summary.count
    ? Math.round(
        ((summary.distribution[5] + summary.distribution[4]) / summary.count) *
          100,
      )
    : 0;

  const chooseFilter = (next: Filter) => {
    setFilter(next);
    setPage(1);
  };

  const goTo = (next: number) => {
    setPage(Math.min(Math.max(1, next), totalPages));
    // `scroll-mt` on the list keeps the sticky header off the top review.
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const chips: {
    id: Filter;
    label: string;
    count: number;
    camera?: boolean;
  }[] = [
    { id: "all", label: "All reviews", count: reviews.length },
    ...(counts.photos > 0
      ? [
          {
            id: "photo" as Filter,
            label: "With photos",
            count: counts.photos,
            camera: true,
          },
        ]
      : []),
    ...STAR_ORDER.map((star) => ({
      id: star as Filter,
      label: `${star} star${star === 1 ? "" : "s"}`,
      count: counts.by[star] ?? 0,
    })),
  ];

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-12">
      {/* ── Aggregate ─────────────────────────────────────────────────── */}
      <aside
        aria-label="Rating summary"
        className="surface h-fit p-7 lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start"
      >
        <div className="flex items-baseline gap-2">
          <p className="font-serif text-heading-1 font-normal leading-none">
            {summary.average.toFixed(1)}
          </p>
          <p className="font-ui text-body-sm text-ink-faint">/ 5</p>
        </div>

        <p className="mt-3 flex flex-wrap items-center gap-2">
          <Stars value={summary.average} />
          <span className="font-ui text-body-sm text-ink-soft tabular-nums">
            {summary.count.toLocaleString("en-US")} reviews
          </span>
        </p>

        <p className="mt-3 text-body-sm text-ink-soft">
          <strong className="font-numeral font-semibold text-ink tabular-nums">
            {recommendPercent}%
          </strong>{" "}
          rated it 4 or 5 stars.
        </p>

        <ul className="mt-6 flex flex-col gap-0.5">
          {STAR_ORDER.map((star) => {
            const n = summary.distribution[star];
            const percent = summary.count
              ? Math.round((n / summary.count) * 100)
              : 0;
            const active = filter === star;
            return (
              <li key={star}>
                <button
                  type="button"
                  onClick={() => chooseFilter(star)}
                  aria-pressed={active}
                  aria-label={`Show ${star} star reviews — ${n} of ${summary.count}`}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-btn px-2 py-2 font-ui text-body-sm transition-colors duration-200",
                    active ? "bg-sage-100" : "hover:bg-cream",
                  )}
                >
                  <span className="flex w-10 shrink-0 items-center gap-1 tabular-nums">
                    {star}
                    <Icon
                      name="star"
                      className="size-3.5 fill-current text-gold-500"
                      strokeWidth={1}
                    />
                  </span>
                  <span
                    className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand"
                    aria-hidden="true"
                  >
                    <span
                      className="block h-full rounded-full bg-sage-600"
                      style={{ width: `${percent}%` }}
                    />
                  </span>
                  <span className="w-10 shrink-0 text-right font-numeral text-ink-soft tabular-nums">
                    {n}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* ── Feed ──────────────────────────────────────────────────────── */}
      <div ref={listRef} className="scroll-mt-[calc(var(--header-h)+2rem)]">
        <div
          role="group"
          aria-label="Filter reviews"
          className="flex flex-wrap items-center gap-2"
        >
          {chips.map((chip) => {
            const active = filter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => chooseFilter(chip.id)}
                aria-pressed={active}
                className={cn(
                  "inline-flex min-h-10 items-center gap-2 rounded-btn px-4 font-ui text-body-sm font-medium transition-colors duration-200",
                  active
                    ? "bg-sage-600 text-ivory"
                    : "bg-porcelain text-ink-soft shadow-soft hover:bg-sand hover:text-ink",
                )}
              >
                {chip.camera && <Icon name="camera" className="size-4" />}
                {chip.label}
                <span
                  className={cn(
                    "font-numeral tabular-nums",
                    active ? "text-ivory/70" : "text-ink-faint",
                  )}
                >
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>

        <p
          aria-live="polite"
          className="mt-6 font-ui text-body-sm text-ink-faint tabular-nums"
        >
          {filtered.length === 0
            ? "No reviews match this filter."
            : `Showing ${from}–${to} of ${filtered.length.toLocaleString("en-US")} reviews`}
        </p>

        {pageItems.length === 0 ? (
          <EmptyFilterState onReset={() => chooseFilter("all")} />
        ) : (
          <ul className="mt-4 flex flex-col gap-4">
            {pageItems.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </ul>
        )}

        {filtered.length > PAGE_SIZE && (
          <nav
            aria-label="Reviews pagination"
            className="mt-8 flex flex-wrap items-center justify-end gap-1.5"
          >
            <PageButton
              label="Previous page"
              disabled={safePage === 1}
              onClick={() => goTo(safePage - 1)}
            >
              <Icon name="chevron-right" className="size-4 rotate-180" />
            </PageButton>

            {pageWindow(safePage, totalPages).map((entry, i) =>
              entry === "…" ? (
                <span
                  key={`gap-${i}`}
                  aria-hidden="true"
                  className="grid size-10 place-items-center font-ui text-body-sm text-ink-faint"
                >
                  …
                </span>
              ) : (
                <PageButton
                  key={entry}
                  label={`Page ${entry}`}
                  current={entry === safePage}
                  onClick={() => goTo(entry)}
                >
                  {entry}
                </PageButton>
              ),
            )}

            <PageButton
              label="Next page"
              disabled={safePage === totalPages}
              onClick={() => goTo(safePage + 1)}
            >
              <Icon name="chevron-right" className="size-4" />
            </PageButton>
          </nav>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────── pieces ─────────────────────────────── */

function ReviewCard({ review }: { review: Review }) {
  return (
    <li>
      <article className="surface p-6 md:p-7">
        <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p className="flex items-center gap-2">
            <Stars value={review.rating} />
            <span className="sr-only">{review.rating} out of 5 stars</span>
          </p>
          <time
            dateTime={review.createdAt.slice(0, 10)}
            className="font-ui text-body-sm text-ink-faint tabular-nums"
          >
            {formatDate(review.createdAt)}
          </time>
        </header>

        {review.title && (
          <p className="mt-4 font-serif text-heading-3">{review.title}</p>
        )}
        <p
          className={cn(
            "max-w-[68ch] text-ink-soft",
            review.title ? "mt-1.5" : "mt-4",
          )}
        >
          {review.body}
        </p>

        {review.images.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {review.images.slice(0, 4).map((src) => (
              <li
                key={src}
                className="relative size-20 overflow-hidden rounded-card bg-cream"
              >
                <Image
                  src={src}
                  alt={`Photo from ${review.author}'s review`}
                  fill
                  sizes="80px"
                  className="object-cover"
                  unoptimized
                />
              </li>
            ))}
          </ul>
        )}

        <footer className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1.5 font-ui text-body-sm">
          <span
            aria-hidden="true"
            className="grid size-8 shrink-0 place-items-center rounded-full bg-sage-100 font-medium text-sage-600"
          >
            {review.author.charAt(0)}
          </span>
          <span className="font-medium">{review.author}</span>
          {review.country && (
            <span className="text-ink-faint">{review.country}</span>
          )}
          <span className="inline-flex items-center gap-1.5 text-ink-faint">
            <Icon
              name="check"
              className="size-3.5 text-sage-600"
              strokeWidth={2.4}
            />
            Verified buyer
          </span>
        </footer>
      </article>
    </li>
  );
}

function PageButton({
  label,
  children,
  onClick,
  current = false,
  disabled = false,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  current?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-current={current ? "page" : undefined}
      className={cn(
        "grid size-10 place-items-center rounded-btn font-ui text-body-sm font-medium transition-colors duration-200",
        current
          ? "bg-sage-600 text-ivory"
          : "bg-porcelain text-ink-soft shadow-soft hover:bg-sand hover:text-ink",
        disabled && "pointer-events-none opacity-40",
      )}
    >
      {children}
    </button>
  );
}

function EmptyFilterState({ onReset }: { onReset: () => void }) {
  return (
    <div className="surface-tint mt-4 px-6 py-14 text-center">
      <p className="font-medium">No reviews match this filter yet.</p>
      <p className="mx-auto mt-2 max-w-sm text-body-sm text-ink-soft">
        Try another star rating, or go back to the full list.
      </p>
      <Button variant="outline" className="mt-6" onClick={onReset}>
        Show all reviews
      </Button>
    </div>
  );
}

/**
 * Nothing to show: no verified reviews from Judge.me and no placeholder set for
 * this handle. Says so plainly instead of borrowing reviews from elsewhere.
 */
function NoReviewsYet() {
  return (
    <div className="grid gap-6 rounded-media bg-sage-100 p-8 md:grid-cols-[1fr_auto] md:items-center md:p-12">
      <div>
        <p className="font-serif text-heading-1 font-normal">No reviews yet.</p>
        <p className="mt-4 max-w-xl text-ink-soft">
          Slumberlush shows reviews from verified Slumberlush orders — we don&apos;t
          import reviews from marketplaces or other sellers. After your order
          arrives you&apos;ll get an email inviting you to share how it went.
        </p>
      </div>
      <p className="glass rounded-card px-6 py-5 text-body-sm md:max-w-64">
        <span className="block font-medium">Verified orders only</span>
        <span className="text-ink-soft">No imported or hidden reviews.</span>
      </p>
    </div>
  );
}

/* ────────────────────────────── helpers ────────────────────────────── */

/** Pinned to UTC so the server and the browser print the same day. */
function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** Numeric page window with ellipsis gaps — e.g. [1, "…", 12, 13, 14, "…", 66]. */
function pageWindow(page: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "…")[] = [];
  const push = (entry: number | "…") => {
    if (out[out.length - 1] !== entry) out.push(entry);
  };
  push(1);
  if (page > 4) push("…");
  for (
    let i = Math.max(2, page - 1);
    i <= Math.min(total - 1, page + 1);
    i += 1
  ) {
    push(i);
  }
  if (page < total - 3) push("…");
  push(total);
  return out;
}
