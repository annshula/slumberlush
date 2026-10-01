import type { ReactNode } from "react";

import { Icon, type IconName } from "@/components/ui/Icon";

/** The "nothing here yet" panel for account pages. */
export function EmptyState({
  icon,
  title,
  body,
  children,
}: {
  icon: IconName;
  art?: string;
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <div className="bg-paper px-6 py-14 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-[12px] bg-cream text-sage-600">
        <Icon name={icon} className="size-5" />
      </span>
      <p className="mt-5 font-serif text-heading-2">{title}</p>
      <p className="mx-auto mt-3 max-w-sm text-body-sm text-ink-soft">{body}</p>
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
