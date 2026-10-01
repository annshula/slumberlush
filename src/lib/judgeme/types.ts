/**
 * Review shapes and pure helpers shared by the three things that touch
 * reviews: the Judge.me fetch (`lib/judgeme/reviews.ts`), the placeholder
 * dataset (`data/reviews.ts`) and the reviews UI (`product/ReviewsSection`).
 *
 * Types and pure functions only — deliberately **not** `server-only`, because
 * the client-side review feed imports this module. Anything that talks to
 * Judge.me stays in `reviews.ts`.
 */

export type Review = {
  id: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title: string | null;
  body: string;
  author: string;
  /**
   * Reviewer's market, when the source knows it. Judge.me's API does not send
   * one, so this is only ever set by the placeholder dataset.
   */
  country?: string;
  /** ISO instant. */
  createdAt: string;
  images: string[];
};

export type ReviewSummary = {
  count: number;
  average: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
};

export type ProductReviews = { reviews: Review[]; summary: ReviewSummary };

/** Counts, mean (rounded to 1 decimal) and the per-star distribution. */
export function summarize(reviews: Review[]): ReviewSummary {
  const distribution = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  } as ReviewSummary["distribution"];
  for (const r of reviews) distribution[r.rating] += 1;
  const count = reviews.length;
  const average = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  return { count, average: Math.round(average * 10) / 10, distribution };
}
