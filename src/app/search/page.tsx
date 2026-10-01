import type { Metadata } from "next";
import Link from "next/link";

import { SearchTracker } from "@/components/content/SearchTracker";
import { search } from "@/lib/search";

/** Search — dynamic, noindex (also X-Robots-Tag in next.config). */
export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: true },
  alternates: { canonical: "/search" },
};

type Props = { searchParams: Promise<{ q?: string | string[] }> };

const suggestions = [
  "plush blanket",
  "weighted blanket",
  "king size",
  "robe",
  "slippers",
];

export default async function SearchPage({ searchParams }: Props) {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim().slice(0, 80) ?? "";
  const results = q ? search(q) : [];

  return (
    <div className="container-page max-w-4xl pt-10 pb-24">
      <h1 className="text-center font-serif text-display font-normal lg:text-left">
        {q ? <>Results for “{q}”</> : "Search"}
      </h1>
      <form
        action="/search"
        method="get"
        role="search"
        className="mt-8 flex gap-2"
      >
        <label htmlFor="q" className="sr-only">
          Search Slumberlush
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          autoFocus={!q}
          placeholder="Search blankets, sleepwear, guides…"
          className="field"
          maxLength={80}
          enterKeyHint="search"
        />
        <button type="submit" className="btn-primary">
          Search
        </button>
      </form>

      {q && <SearchTracker query={q} results={results.length} />}

      {q && results.length === 0 && (
        <div className="mt-12">
          <p className="text-center lg:text-left">
            Nothing matched “{q}”. Try one of these:
          </p>
          <ul className="mt-4 flex flex-wrap justify-center gap-2 lg:justify-start">
            {suggestions.map((s) => (
              <li key={s}>
                <Link
                  href={`/search?q=${encodeURIComponent(s)}`}
                  className="inline-flex min-h-10 items-center rounded-[12px] bg-porcelain px-4 text-body-sm shadow-soft transition-shadow hover:shadow-float"
                >
                  {s}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-body-sm text-ink-soft">
            Or ask us directly on the{" "}
            <Link href="/pages/contact" className="link-underline">
              contact page
            </Link>
            .
          </p>
        </div>
      )}

      {results.length > 0 && (
        <>
          <p className="mt-8 text-body-sm text-ink-soft" role="status">
            {results.length} result{results.length === 1 ? "" : "s"}
          </p>
          <ul className="mt-4 flex flex-col gap-2.5">
            {results.map((r) => (
              <li key={`${r.type}-${r.href}-${r.title}`}>
                <Link
                  href={r.href}
                  className="group block rounded-card bg-porcelain p-6 shadow-soft transition-shadow hover:shadow-float"
                >
                  <span className="eyebrow">{r.type}</span>
                  <span className="mt-1 block text-heading-3 font-medium group-hover:underline">
                    {r.title}
                  </span>
                  <span className="mt-1 line-clamp-2 block text-body-sm text-ink-soft">
                    {r.excerpt}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {!q && (
        <div className="mt-10">
          <p className="eyebrow flex justify-center lg:justify-start">
            Popular
          </p>
          <ul className="mt-4 flex flex-wrap justify-center gap-2 lg:justify-start">
            {suggestions.map((s) => (
              <li key={s}>
                <Link
                  href={`/search?q=${encodeURIComponent(s)}`}
                  className="inline-flex min-h-10 items-center rounded-[12px] bg-porcelain px-4 text-body-sm shadow-soft transition-shadow hover:shadow-float"
                >
                  {s}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
