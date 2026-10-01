"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="container-page max-w-2xl py-24 text-center lg:text-left">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-4 font-serif text-heading-1">
        We couldn&apos;t load this page.
      </h1>
      <p className="mt-4 text-ink-soft">
        Please try again. If it keeps happening, let us know.
      </p>
      {error.digest && (
        <p className="mt-2 text-body-sm text-ink-soft">
          Reference: {error.digest}
        </p>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-4 lg:justify-start">
        <button type="button" className="btn-primary" onClick={reset}>
          Try again
        </button>
        <Link href="/" className="btn-outline">
          Go home
        </Link>
      </div>
    </div>
  );
}
