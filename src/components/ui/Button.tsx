import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { Icon } from "./Icon";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "ghost-light";

interface BaseProps {
  children: ReactNode;
  variant?: Variant;
  className?: string;
  withArrow?: boolean;
}

const variantClass: Record<Variant, string> = {
  primary: "btn-primary",
  outline: "btn-outline",
  "ghost-light": "btn-outline btn-ghost-light",
};

type ButtonAsLink = BaseProps & { href: string } & Omit<
    ComponentPropsWithoutRef<typeof Link>,
    "href" | "className" | "children"
  >;
type ButtonAsButton = BaseProps & { href?: undefined } & Omit<
    ComponentPropsWithoutRef<"button">,
    "className" | "children"
  >;

export function Button(props: ButtonAsLink | ButtonAsButton) {
  const {
    children,
    variant = "primary",
    className,
    withArrow = false,
    ...rest
  } = props;

  const content = (
    <>
      <span>{children}</span>
      {withArrow && (
        <Icon
          name="arrow-right"
          className="size-4 transition-transform duration-500 ease-out-soft group-hover/btn:translate-x-1"
        />
      )}
    </>
  );

  const classes = cn("group/btn", variantClass[variant], className);

  if ("href" in props && props.href !== undefined) {
    const { href, ...linkRest } = rest as ButtonAsLink;
    return (
      <Link href={href} className={classes} {...linkRest}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      {...(rest as ComponentPropsWithoutRef<"button">)}
    >
      {content}
    </button>
  );
}
