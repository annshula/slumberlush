"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useState } from "react";

import { Icon, type IconName } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

export type FinderProduct = {
  handle: string;
  name: string;
  href: string;
  image: string | null;
  price: string;
};

export type FinderProfile = {
  id: string;
  label: string;
  icon: IconName;
  headline: string;
  tip: string;
  products: FinderProduct[];
};

/**
 * "How do you sleep?" — pick the sleeper you are, get the two pieces made for
 * that night. A WAI-ARIA tablist: arrow keys move between profiles, the panel
 * swaps in place. Products are resolved on the server; this island only
 * switches between them.
 */
export function SleepFinder({ profiles }: { profiles: FinderProfile[] }) {
  const [active, setActive] = useState(0);
  const base = useId();
  const profile = profiles[active];
  if (!profile) return null;

  const onKey = (e: React.KeyboardEvent<HTMLButtonElement>, i: number) => {
    const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (i + delta + profiles.length) % profiles.length;
    setActive(next);
    document.getElementById(`${base}-tab-${next}`)?.focus();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
      <div role="tablist" aria-label="Choose your kind of night" aria-orientation="vertical" className="flex flex-wrap gap-2.5 lg:flex-col">
        {profiles.map((p, i) => {
          const selected = i === active;
          return (
            <button
              key={p.id}
              id={`${base}-tab-${i}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`${base}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(i)}
              onKeyDown={(e) => onKey(e, i)}
              className={cn(
                "group flex min-h-14 items-center gap-3.5 rounded-full py-2 pr-6 pl-2 text-left transition-all duration-500 ease-out-soft lg:min-h-18 lg:pr-8",
                selected
                  ? "bg-night-900 text-milk shadow-[0_18px_40px_-20px_rgb(23_27_42/0.8)]"
                  : "bg-cloud text-ink shadow-soft hover:-translate-y-0.5 hover:shadow-float",
              )}
            >
              <span
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-full transition-colors duration-500 lg:size-13",
                  selected ? "bg-white/10 text-honey-200" : "bg-oat text-dusk-600",
                )}
              >
                <Icon name={p.icon} className="size-5" />
              </span>
              <span className="font-serif text-[1.15rem] font-medium lg:text-heading-3">{p.label}</span>
              <Icon
                name="arrow-right"
                className={cn(
                  "ml-auto hidden size-4 transition-all duration-500 lg:block",
                  selected ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0",
                )}
              />
            </button>
          );
        })}
      </div>

      <div
        id={`${base}-panel`}
        role="tabpanel"
        aria-labelledby={`${base}-tab-${active}`}
        className="rounded-media bg-cloud p-6 shadow-float sm:p-10"
      >
        <p className="eyebrow eyebrow-dot">Made for your night</p>
        <h3 key={profile.id} className="mt-4 font-serif text-heading-1 motion-safe:animate-[rise-in_600ms_var(--ease-out-soft)]">
          {profile.headline}
        </h3>
        <p className="mt-3 max-w-xl text-ink-soft">{profile.tip}</p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {profile.products.map((p) => (
            <li key={p.handle}>
              <Link href={p.href} className="group flex items-center gap-4 rounded-[26px] bg-oat p-3 pr-5 transition-colors duration-500 hover:bg-sand">
                <span className="arch-sm relative block aspect-3/4 w-20 shrink-0 overflow-hidden bg-sand">
                  {p.image && (
                    <Image src={p.image} alt="" fill sizes="80px" className="media-zoom object-cover" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block font-serif text-[1.2rem] leading-tight font-medium">{p.name}</span>
                  <span className="mt-1 block text-body-sm text-ink-soft">{p.price}</span>
                  <span className="mt-2 inline-flex items-center gap-1.5 text-[0.8rem] font-bold text-dusk-600">
                    Discover <Icon name="arrow-right" className="size-3.5 transition-transform duration-500 group-hover:translate-x-1" />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
