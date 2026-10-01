import { Icon } from "@/components/ui/Icon";

/**
 * Compact buy-box accordion (How to use / Ingredients / Safety) — a quick
 * reference next to the price. The full detailed sections still live further
 * down the page for anyone who wants the complete read.
 */
export function ProductAccordion({ items }: { items: { title: string; body: React.ReactNode }[] }) {
  return (
    <div className="mt-6 flex flex-col divide-y divide-sand border-y border-sand">
      {items.map((item) => (
        <details key={item.title} className="group py-1">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-2 text-body-sm font-semibold">
            {item.title}
            <Icon
              name="plus"
              className="size-4 shrink-0 text-ink-soft transition-transform duration-300 group-open:rotate-45"
            />
          </summary>
          <div className="pb-4 text-body-sm text-ink-soft">{item.body}</div>
        </details>
      ))}
    </div>
  );
}
