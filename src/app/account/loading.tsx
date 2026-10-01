/**
 * Account pages are force-dynamic and every render waits on Shopify's Customer
 * Account API, so without a Suspense boundary the browser sat on the previous
 * page showing nothing after a click. This skeleton mirrors the real layout so
 * navigation feels instant and the content swaps in place.
 */
export default function AccountLoading() {
  return (
    <div className="min-w-0 animate-pulse" aria-hidden="true">
      <div className="h-3 w-52 rounded-pill bg-sand" />
      <div className="mt-7 h-12 w-72 rounded-tag bg-sand/70" />
      <div className="mt-3 h-4 w-full max-w-md rounded-pill bg-sand/50" />

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="rounded-panel bg-paper p-6 shadow-soft"
          >
            <div className="h-5 w-32 rounded-pill bg-sand/70" />
            <div className="mt-6 flex items-center gap-4">
              <div className="size-14 shrink-0 rounded-full bg-blush" />
              <div className="min-w-0 flex-1">
                <div className="h-4 w-2/3 rounded-pill bg-sand/60" />
                <div className="mt-2 h-3 w-1/2 rounded-pill bg-sand/40" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-4 rounded-panel bg-paper px-5 py-4 shadow-soft"
          >
            <div className="flex items-center gap-4">
              <div className="size-11 rounded-full bg-blush" />
              <div>
                <div className="h-4 w-24 rounded-pill bg-sand/60" />
                <div className="mt-2 h-3 w-32 rounded-pill bg-sand/40" />
              </div>
            </div>
            <div className="h-4 w-16 rounded-pill bg-sand/60" />
          </div>
        ))}
      </div>
    </div>
  );
}
