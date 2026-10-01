"use client";

import { useEffect } from "react";

import { trackSearch } from "@/lib/analytics";

export function SearchTracker({ query, results }: { query: string; results: number }) {
  useEffect(() => trackSearch(query, results), [query, results]);
  return null;
}
