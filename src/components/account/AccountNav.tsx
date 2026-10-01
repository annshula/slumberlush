"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
  SignOutDialog,
  SignOutLabel,
} from "@/components/account/SignOutDialog";
import { Icon, type IconName } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  exact?: boolean;
};

const items: NavItem[] = [
  { href: "/account", label: "Overview", icon: "user", exact: true },
  { href: "/account/orders", label: "Orders", icon: "package" },
  { href: "/account/addresses", label: "Addresses", icon: "map-pin" },
  { href: "/account/profile", label: "Profile", icon: "feather" },
];

/**
 * Account nav, two shapes from one markup.
 *
 * Desktop (lg+): the white card of icon chips on the cream canvas, rose fill
 * marking the current page, with sign-out under a hairline.
 *
 * Mobile: no card, no icons, no sign-out — just the site's tracked uppercase
 * labels on a scrolling rule, so the nav costs one line instead of a panel.
 * Sign-out lives in the header drawer at that width.
 */
export function AccountNav() {
  const pathname = usePathname();
  const [signOutOpen, setSignOutOpen] = useState(false);
  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <nav aria-label="Account" className="w-full min-w-0">
      <div className="min-w-0 lg:rounded-panel lg:bg-paper lg:p-3 lg:shadow-soft">
        {/* The row is wider than a phone and scrolls inside itself; min-w-0
            here and on every ancestor keeps that from widening the page. */}
        <ul className="scrollbar-none flex min-w-0 gap-7 overflow-x-auto lg:flex-col lg:gap-1 lg:overflow-visible">
          {items.map((item) => {
            const active = isActive(item);
            return (
              <li key={item.href} className="shrink-0 lg:shrink">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "-mb-px block pb-3 font-label text-[0.72rem] tracking-[0.2em] whitespace-nowrap uppercase transition-colors duration-300 ease-out-soft",
                    "lg:mb-0 lg:flex lg:items-center lg:gap-2.5 lg:rounded-tag lg:px-4 lg:py-3 lg:tracking-[0.14em]",
                    active
                      ? "text-sage-600 lg:bg-sage-600 lg:text-paper"
                      : "text-ink-faint hover:text-ink lg:text-ink-soft lg:hover:bg-blush lg:hover:text-sage-700",
                  )}
                >
                  <Icon
                    name={item.icon}
                    className="hidden size-4 shrink-0 lg:block"
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden lg:mt-2 lg:block lg:pt-2">
          <button
            type="button"
            onClick={() => setSignOutOpen(true)}
            className="flex w-full items-center gap-2.5 rounded-tag px-4 py-3 font-label text-[0.72rem] tracking-[0.14em] text-ink-faint uppercase transition-colors duration-300 ease-out-soft hover:bg-clay-100 hover:text-sage-600"
          >
            <SignOutLabel />
          </button>
        </div>
      </div>

      <SignOutDialog open={signOutOpen} onClose={() => setSignOutOpen(false)} />
    </nav>
  );
}
