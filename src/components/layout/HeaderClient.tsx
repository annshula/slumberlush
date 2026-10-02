"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { Wordmark } from "@/components/brand/Wordmark";
import { useCart } from "@/components/cart/CartProvider";
import { Icon, type IconName } from "@/components/ui/Icon";
import type { NavGroup } from "@/content/navigation";
import { cn } from "@/lib/utils";

/**
 * Header interactivity: desktop disclosure menus, the mobile menu sheet and
 * the bag button. Menus are disclosure buttons (not ARIA `menu`), close on
 * Escape / outside click / navigation, and return focus to their trigger.
 * All links are real <a> elements in the server HTML, so crawlers see them.
 */

export type MegaCategory = {
  label: string;
  tagline: string;
  href: string;
  count: number;
  icon: IconName;
  image: string | null;
};
export type MegaFeatured = { name: string; href: string; image: string; price: string } | null;
export type MegaData = {
  sleep: MegaCategory[];
  comfort: MegaCategory[];
  featuredSleep: MegaFeatured;
  featuredComfort: MegaFeatured;
  browseAllHref: string;
};

/** Refined disclosure caret: a thin chevron that turns as the panel opens. */
function Caret({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 12 12"
      aria-hidden="true"
      className={cn(
        "size-3 transition-transform duration-300 ease-out-soft",
        open && "-rotate-180",
      )}
    >
      <path
        d="M2.5 4.5 6 8l3.5-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Arrow that slides on hover of its `group/link` parent. */
function SlideArrow({ className }: { className?: string }) {
  return (
    <span
      className={cn("relative inline-flex size-4 overflow-hidden", className)}
      aria-hidden="true"
    >
      <Icon
        name="arrow-right"
        className="absolute size-4 transition-transform duration-300 group-hover/link:translate-x-4"
      />
      <Icon
        name="arrow-right"
        className="absolute size-4 -translate-x-4 transition-transform duration-300 group-hover/link:translate-x-0"
      />
    </span>
  );
}

export function DesktopNav({
  groups,
  mega,
}: {
  groups: NavGroup[];
  mega: MegaData;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const closeTimer = useRef<number | null>(null);
  const pathname = usePathname();
  const baseId = useId();

  useEffect(() => setOpenIndex(null), [pathname]);

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const trigger = document.getElementById(`${baseId}-t${openIndex}`);
      setOpenIndex(null);
      trigger?.focus();
    };
    const onClick = (e: MouseEvent) => {
      const header = navRef.current?.closest("header");
      if (!header?.contains(e.target as Node)) setOpenIndex(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [openIndex, baseId]);

  // Hover intent for fine pointers; click/keyboard always work.
  const hoverOpen = (i: number) => (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setOpenIndex(i);
  };
  const hoverClose = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    closeTimer.current = window.setTimeout(() => setOpenIndex(null), 180);
  };
  const keep = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
  };

  return (
    <nav
      ref={navRef}
      aria-label="Main"
      className="hidden h-full font-headline lg:block"
    >
      {/* Full-height list: each item's bottom edge is the bar's bottom edge, so
          a panel anchored to `top-full` on the item hangs from the bar itself
          while staying aligned with the menu it belongs to. */}
      <ul className="flex h-full items-stretch gap-0.5">
        {groups.map((group, i) =>
          group.links.length === 0 ? (
            <li key={group.label} className="flex items-center">
              <Link
                href={group.href ?? "/"}
                className="relative flex min-h-11 items-center rounded-xl px-3.5 text-[0.95rem] tracking-[0.01em] transition-colors hover:bg-ink/5"
              >
                {group.label}
              </Link>
            </li>
          ) : (
            <li
              key={group.label}
              className="relative flex items-center"
              onPointerEnter={hoverOpen(i)}
              onPointerLeave={hoverClose}
            >
              <button
                id={`${baseId}-t${i}`}
                type="button"
                aria-expanded={openIndex === i}
                aria-controls={`${baseId}-p${i}`}
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className={cn(
                  "relative flex min-h-11 items-center gap-2 rounded-xl px-3.5 text-[0.95rem] tracking-[0.01em] transition-colors hover:bg-ink/5",
                  openIndex === i && "bg-ink/5",
                )}
              >
                {group.label}
                <span
                  className={cn(
                    "grid size-5 place-items-center rounded-full transition-colors duration-300",
                    openIndex === i ? "bg-sage-600 text-ivory" : "bg-ink/6",
                  )}
                >
                  <Caret open={openIndex === i} />
                </span>
              </button>

              <div
                id={`${baseId}-p${i}`}
                hidden={openIndex !== i}
                onPointerEnter={keep}
                onPointerLeave={hoverClose}
                className={cn(
                  "absolute top-full z-40 pt-3",
                  // The wide mega panels line up with their button's left
                  // edge; the narrow lists sit centred under theirs.
                  group.mega ? "left-0" : "left-1/2 -translate-x-1/2",
                )}
              >
                <div className="surface-float mega-in inline-block overflow-hidden rounded-3xl p-3">
                  {group.mega ? (
                    <MegaPanel
                      categories={group.mega === "sleep" ? mega.sleep : mega.comfort}
                      featured={group.mega === "sleep" ? mega.featuredSleep : mega.featuredComfort}
                      title={group.mega === "sleep" ? "Shop Sleep" : "Shop Comfort"}
                      browseAllHref={mega.browseAllHref}
                    />
                  ) : (
                    <EditorialPanel group={group} />
                  )}
                </div>
              </div>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}

/**
 * Sleep / Comfort mega panel: a two-column grid of categories (photo or icon
 * tile, tagline, "Soon" tag for categories still launching) beside a featured
 * product card.
 */
function MegaPanel({
  categories,
  featured,
  title,
  browseAllHref,
}: {
  categories: MegaCategory[];
  featured: MegaFeatured;
  title: string;
  browseAllHref: string;
}) {
  return (
    <div className="flex w-[min(52rem,calc(100vw-6rem))] gap-3 p-2 font-headline">
      <div className="min-w-0 flex-1 p-2">
        <p className="eyebrow eyebrow-dot px-1">{title}</p>
        <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1">
          {categories.map((cat) => (
            <li key={cat.href}>
              <Link
                href={cat.href}
                className="group/link flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-cream"
              >
                <span className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-[12px] bg-sage-50 text-sage-600">
                  {cat.image ? (
                    <Image src={cat.image} alt="" fill sizes="48px" className="object-cover" />
                  ) : (
                    <Icon name={cat.icon} className="size-5" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-body-sm font-medium">
                    <span className="truncate">{cat.label}</span>
                    {cat.count === 0 && (
                      <span className="rounded-full bg-clay-100 px-1.5 py-0.5 text-[0.6rem] font-semibold tracking-wider text-clay-600 uppercase">
                        Soon
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-[0.76rem] text-ink-soft">{cat.tagline}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href={browseAllHref}
          className="group/link mt-3 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-body-sm font-medium transition-colors hover:bg-cream"
        >
          Shop everything
          <Icon name="arrow-right" className="size-3.5 transition-transform duration-300 group-hover/link:translate-x-1" />
        </Link>
      </div>
      {featured && (
        <Link
          href={featured.href}
          className="group/link relative block w-60 shrink-0 overflow-hidden rounded-2xl bg-sage-900 text-ivory"
        >
          <Image
            src={featured.image}
            alt=""
            fill
            sizes="240px"
            className="object-cover opacity-90 transition-transform duration-700 group-hover/link:scale-105"
          />
          <span className="absolute inset-0 bg-linear-to-t from-sage-900/90 via-sage-900/20 to-transparent" />
          <span className="absolute inset-x-0 bottom-0 p-5">
            <span className="text-[0.66rem] font-semibold tracking-[0.18em] text-clay-200 uppercase">Most loved</span>
            <span className="mt-1 block font-serif text-heading-3">{featured.name}</span>
            <span className="mt-1 block text-[0.8rem] text-sage-100">{featured.price}</span>
          </span>
        </Link>
      )}
    </div>
  );
}

function EditorialPanel({ group }: { group: NavGroup }) {
  return (
    <ul className="w-64 p-2 font-headline">
      {group.links.map((link) => (
        <li key={link.href}>
          <Link
            href={link.href}
            className="group/link flex items-center justify-between gap-4 rounded-xl px-4 py-3 text-body-sm font-medium transition-colors hover:bg-cream"
          >
            {link.label}
            <SlideArrow className="text-ink-soft" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * Header chrome state. On the home page the bar is transparent while it sits
 * over the hero and becomes the floating glass bar once the page scrolls;
 * everywhere else it is always the glass bar.
 */
export function HeaderShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const overHero = pathname === "/" && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      data-over-hero={overHero || undefined}
      style={{ paddingInline: "var(--gutter)" }}
      className={cn(
        "relative mx-auto grid h-(--header-h) max-w-(--page-max) grid-cols-[1fr_auto_1fr] items-center gap-2 transition-[background-color,box-shadow,backdrop-filter,max-width] duration-700 ease-out-soft sm:gap-3 lg:gap-4 lg:rounded-full",
        // Over the home hero: fully transparent — the bar is part of the hero.
        // Elsewhere: a floating pillow of frosted milk glass (edge to edge on
        // phones, where a floating capsule reads as a widget).
        overHero
          ? "bg-transparent shadow-none"
          : "bg-milk/95 shadow-[0_1px_0_rgb(60_44_26/0.08)] backdrop-blur-xl lg:shadow-float lg:max-w-[min(var(--page-max),calc(100vw-3rem))]",
      )}
    >
      {children}
    </div>
  );
}

export function MobileMenu({ groups }: { groups: NavGroup[] }) {
  const ref = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    ref.current?.close();
  }, [pathname]);

  // The sheet is a phone affordance. If the viewport grows into the desktop
  // layout while it is open, close it — otherwise a modal stays stranded on
  // top of a page whose menu button no longer exists.
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (desktop.matches) ref.current?.close();
    };
    desktop.addEventListener("change", onChange);
    return () => desktop.removeEventListener("change", onChange);
  }, []);

  return (
    <>
      <button
        type="button"
        className="grid size-11 place-items-center rounded-xl hover:bg-sand/60 lg:hidden"
        aria-label="Open menu"
        aria-haspopup="dialog"
        onClick={() => ref.current?.showModal()}
      >
        <Icon name="menu" />
      </button>
      <dialog
        ref={ref}
        aria-label="Menu"
        data-side="left"
        className="sheet fixed inset-0 h-dvh w-full"
        onClick={(e) => {
          if (e.target === e.currentTarget) ref.current?.close();
        }}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <Wordmark className="h-8" />
            <button
              type="button"
              className="grid size-11 place-items-center rounded-xl bg-sand/70"
              aria-label="Close menu"
              onClick={() => ref.current?.close()}
            >
              <Icon name="close" />
            </button>
          </div>

          {/*
           * Main destinations only: the four groups are the whole menu, and
           * anything deeper (Hair Removal, the guides, Our standards) opens
           * in place under its group. Four lines to scan instead of eleven,
           * with the descriptions kept for the links once they're open.
           */}
          <nav
            aria-label="Mobile"
            className="flex flex-1 flex-col overflow-y-auto overscroll-contain px-5 pt-4 pb-10"
          >
            {/* Search lives in here on phones — the bar only has room for it
                from sm up (see Header). */}
            <Link
              href="/search"
              className="field flex items-center gap-3 text-body-sm text-ink-faint sm:hidden"
            >
              <Icon name="search" className="size-4" />
              Search products
            </Link>

            <ul className="mt-5 flex flex-col">
              {groups.map((group) => {
                // A group with nowhere to go, or one the content marks as
                // mobile-direct, is a plain row: Shop opens Shop all rather
                // than making a phone tap twice to see the products.
                const direct =
                  group.links.length === 0 ||
                  Boolean(group.mobileDirect && group.href);
                return direct ? (
                  <li key={group.label}>
                    <Link
                      href={group.href ?? "/"}
                      className="group/link flex min-h-14 items-center justify-between gap-4 border-b border-sand font-serif text-heading-3"
                    >
                      {group.label}
                      <Icon
                        name="arrow-right"
                        className="size-4 shrink-0 text-ink-soft transition-transform duration-300 group-hover/link:translate-x-1"
                      />
                    </Link>
                  </li>
                ) : (
                  <li key={group.label} className="border-b border-sand">
                    <details className="group">
                      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 font-serif text-heading-3">
                        {group.label}
                        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-cream">
                          <Icon
                            name="plus"
                            className="size-3 transition-transform duration-300 group-open:rotate-45"
                          />
                        </span>
                      </summary>
                      <ul className="flex flex-col pb-4">
                        {group.links.map((link) => (
                          <li key={link.href}>
                            <Link
                              href={link.href}
                              className="flex min-h-12 flex-col justify-center gap-0.5 py-2"
                            >
                              <span className="text-body-sm font-medium">
                                {link.label}
                              </span>
                              {link.description && (
                                <span className="text-[0.75rem] leading-snug text-ink-soft">
                                  {link.description}
                                </span>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </details>
                  </li>
                );
              })}
            </ul>

            <div className="mt-auto flex flex-wrap items-center gap-x-6 gap-y-1 pt-10 font-headline text-body-sm text-ink-soft">
              <Link
                href="/account"
                prefetch={false}
                className="inline-flex min-h-11 items-center gap-2 hover:text-ink"
              >
                <Icon name="user" className="size-4" /> Account
              </Link>
              <Link
                href="/pages/contact"
                className="inline-flex min-h-11 items-center gap-2 hover:text-ink"
              >
                <Icon name="help" className="size-4" /> Contact us
              </Link>
            </div>
          </nav>
        </div>
      </dialog>
    </>
  );
}

export function BagButton() {
  const { count, open, hydrated } = useCart();
  return (
    <button
      type="button"
      onClick={open}
      className="relative grid size-11 place-items-center rounded-xl hover:bg-sand/60"
      aria-label={
        hydrated && count > 0
          ? `Bag, ${count} item${count === 1 ? "" : "s"}`
          : "Bag"
      }
    >
      <Icon name="bag" />
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-1.5 right-1 grid h-4 min-w-4 place-items-center rounded-full bg-sage-600 px-1 text-[10px] leading-none font-semibold text-ivory transition-opacity",
          hydrated && count > 0 ? "opacity-100" : "opacity-0",
        )}
      >
        {count || ""}
      </span>
    </button>
  );
}
