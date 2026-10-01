import Link from "next/link";

export default function NotFound() {
  return (
    <div className="px-2 pt-3 sm:px-3">
      <div className="rounded-media bg-cream">
        <div className="container-page max-w-3xl py-24 text-center md:py-32 lg:text-left">
          <p className="eyebrow">404</p>
          <h1 className="mt-5 font-serif text-display font-normal">
            This page isn&apos;t here.
          </h1>
          <p className="mt-6 text-body-lg text-ink-soft">
            It may have moved, or the link may be mistyped. These might help:
          </p>
          <ul className="mt-8 flex flex-wrap justify-center gap-4 lg:justify-start">
            <li>
              <Link href="/collections/blankets" className="btn-primary">
                Shop blankets
              </Link>
            </li>
            <li>
              <Link href="/collections/all" className="btn-outline">
                Shop everything
              </Link>
            </li>
            <li>
              <Link href="/search" className="btn-quiet">
                Search
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
