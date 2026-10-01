import { Icon } from "@/components/ui/Icon";

/**
 * FAQ as native <details> in soft stacked cards — answers live in the server
 * HTML (crawlable, AEO); keyboard and screen-reader support is built in.
 */
export function Faq({
  items,
  headingLevel = 3,
}: {
  items: { q: string; a: string }[];
  headingLevel?: 2 | 3;
}) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item) => (
        <details
          key={item.q}
          className="group rounded-card bg-porcelain px-6 shadow-soft transition-shadow duration-300 open:shadow-float md:px-7"
        >
          <summary className="flex min-h-18 items-center justify-between gap-6 py-5">
            <H className="text-body-lg font-medium">{item.q}</H>
            <span className="grid size-9 shrink-0 place-items-center rounded-tag bg-cream transition-colors group-open:bg-sage-600 group-open:text-ivory">
              <Icon
                name="plus"
                className="size-4 transition-transform duration-300 group-open:rotate-45"
              />
            </span>
          </summary>
          <p className="max-w-[64ch] pb-7 text-ink-soft">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
