import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  intro,
  id,
  align = "left",
  className,
  titleClassName,
  as: Tag = "h2",
  size = "display",
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  id?: string;
  align?: "left" | "center";
  className?: string;
  /** Overrides the title's own classes (e.g. a page-scoped font swap) without touching every caller. */
  titleClassName?: string;
  as?: "h1" | "h2";
  size?: "display" | "heading";
}) {
  return (
    <div
      className={cn(
        "mx-auto max-w-2xl text-center",
        // Centred on phones and tablets, where heading + intro stack and read
        // as one block; back to the left-aligned column from lg up.
        align === "left" && "lg:mx-0 lg:text-left",
        className,
      )}
    >
      {eyebrow && (
        <p
          className={cn(
            "eyebrow eyebrow-dot mb-5",
            align === "center" && "justify-center",
          )}
        >
          {eyebrow}
        </p>
      )}
      <Tag
        id={id}
        className={cn(
          "font-serif font-normal",
          size === "display" ? "text-display" : "text-heading-1",
          titleClassName,
        )}
      >
        {title}
      </Tag>
      {intro && <div className="mt-3 text-body text-ink-soft">{intro}</div>}
    </div>
  );
}
