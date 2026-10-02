import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * The Slumberlush logo — the master artwork (cloud, star and hand-lettered
 * wordmark), served from /public/brand. `tone="dark"` is the navy logo for
 * light backgrounds; `tone="light"` is the white logo for night sections.
 * Decorative: the caller's link carries the accessible name. Rebuild the
 * files from the root masters with `node scripts/brand-assets.mjs`.
 */
const LOGOS = {
  dark: { src: "/brand/logo-sm.png", width: 480, height: 161 },
  light: { src: "/brand/logo-white-sm.png", width: 480, height: 161 },
} as const;

export function Wordmark({
  className,
  tone = "dark",
  priority = false,
}: {
  className?: string;
  tone?: "dark" | "light";
  priority?: boolean;
}) {
  const logo = LOGOS[tone];
  return (
    <Image
      src={logo.src}
      alt=""
      width={logo.width}
      height={logo.height}
      priority={priority}
      sizes="(min-width: 1024px) 168px, 132px"
      className={cn("h-auto w-auto select-none", className)}
      draggable={false}
    />
  );
}
