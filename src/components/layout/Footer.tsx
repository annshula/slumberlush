import Image from "next/image";
import Link from "next/link";

import { CookieSettingsButton } from "@/components/layout/CookieSettingsButton";
import { NewsletterForm } from "@/components/content/NewsletterForm";
import { footerNav, legalNav } from "@/content/navigation";
import { site } from "@/lib/site";

/**
 * Dawn. The night ends here: midnight blue at the top of the footer warms
 * through dusk into a sunrise glow behind an oversized wordmark sitting on
 * the horizon. Pure CSS gradients — no images.
 */
export function Footer() {
  return (
    <footer className="mt-auto px-2 pb-2 sm:px-3 sm:pb-3">
      <div className="relative isolate overflow-hidden rounded-media bg-[linear-gradient(180deg,var(--color-night-950)_0%,var(--color-night-900)_30%,var(--color-dusk-800)_62%,#6e5a5a_84%,#c9925a_100%)] text-moon-100">
        {/* Stars fading as the sky lightens */}
        <div aria-hidden="true" className="night-sky absolute inset-x-0 top-0 -z-10 h-1/2 bg-transparent [mask-image:linear-gradient(black,transparent)]" />
        {/* The sun, just breaking the horizon */}
        <div
          aria-hidden="true"
          className="absolute -bottom-[38vw] left-1/2 -z-10 size-[64vw] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,#ffd9a0_0%,#f0b070_30%,rgb(214_140_80/0.35)_55%,transparent_70%)] blur-sm sm:-bottom-[30vw] sm:size-[52vw]"
        />

        <div className="container-page grid gap-14 pt-16 pb-14 lg:grid-cols-[1.15fr_1.6fr] lg:gap-24 lg:pt-28">
          <div>
            <p className="eyebrow eyebrow-dot text-honey-200">Good morning</p>
            <p className="mt-6 font-serif text-heading-1 text-milk">
              Rest well. <em className="text-honey-200">Wake slowly.</em>
            </p>
            <p className="mt-4 max-w-sm text-moon-100/80">{site.descriptor}</p>
            <div className="mt-10 max-w-md rounded-[28px] bg-white/6 p-6 ring-1 ring-white/10 backdrop-blur-sm [&_.eyebrow]:text-moon-100 [&_p]:text-moon-100/80">
              <NewsletterForm compact tone="dark" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
            {footerNav.map((group) => (
              <nav key={group.label} aria-label={group.label}>
                <h2 className="eyebrow text-honey-200">{group.label}</h2>
                <ul className="mt-5 space-y-0.5">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        prefetch={link.href.startsWith("/account") ? false : undefined}
                        className="inline-flex min-h-10 items-center text-body-sm text-moon-100/85 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        {/* The wordmark on the horizon */}
        <div className="pointer-events-none flex justify-center px-6 select-none" aria-hidden="true">
          <Image
            src="/brand/logo-white.png"
            alt=""
            width={1200}
            height={411}
            sizes="(min-width: 1024px) 640px, 80vw"
            className="h-auto w-[min(80vw,640px)] opacity-95"
            draggable={false}
          />
        </div>

        <div className="container-page relative flex flex-col gap-4 pt-6 pb-8 text-body-sm text-night-900 md:flex-row md:items-center md:justify-between">
          <p className="font-semibold">
            © {new Date().getFullYear()} {site.name} ·{" "}
            <a href={`mailto:${site.supportEmail}`} className="underline-offset-4 hover:underline">
              {site.supportEmail}
            </a>
          </p>
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 font-semibold">
            {legalNav.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="underline-offset-4 hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="underline-offset-4 hover:underline">
              <CookieSettingsButton />
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
