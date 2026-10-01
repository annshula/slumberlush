import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Scroll reveal via CSS scroll-driven animation (see `.reveal` in globals.css).
 * No JS; content is never hidden when the browser lacks support or the user
 * prefers reduced motion.
 */
export function Reveal({
  as: Tag = "div",
  className,
  children,
  ...rest
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
  delay?: number;
  y?: number;
  [key: string]: unknown;
}) {
  // `delay` / `y` are accepted for API compatibility with the reference and ignored.
  const props = Object.fromEntries(Object.entries(rest).filter(([k]) => k !== "delay" && k !== "y"));
  return (
    <Tag className={cn("reveal", className)} {...props}>
      {children}
    </Tag>
  );
}
