import { Icon } from "@/components/ui/Icon";

/**
 * Factual, non-defamatory method comparison (blueprint §13). Three soft
 * columns instead of a ruled table; the mousse column is lifted, not boxed.
 * No claims about regrowth time or results.
 */
const methods = [
  {
    name: "Hair removal mousse",
    featured: true,
    rows: {
      "How it works": "Breaks hair down at the skin's surface, then wipes away",
      Blade: "No",
      Pulling: "No",
      "Time per session": "5–10 minute wait, plus application",
      "Things to know": "Patch test first; not for face or genitals; light scent",
    },
  },
  {
    name: "Razor",
    featured: false,
    rows: {
      "How it works": "A blade cuts hair at the skin's surface",
      Blade: "Yes",
      Pulling: "No",
      "Time per session": "A few minutes",
      "Things to know": "Nicks or razor bumps for some people",
    },
  },
  {
    name: "Wax",
    featured: false,
    rows: {
      "How it works": "Pulls hair out from the follicle",
      Blade: "No",
      Pulling: "Yes",
      "Time per session": "Varies; preparation needed",
      "Things to know": "Can be uncomfortable; hair needs some length",
    },
  },
];

export function ComparisonTable() {
  return (
    <div className="grid gap-4 md:grid-cols-3 md:items-stretch">
      {methods.map((m) => (
        <section
          key={m.name}
          aria-label={m.name}
          className={
            m.featured
              ? "rounded-media bg-porcelain p-7 shadow-float md:-my-4 md:p-9"
              : "rounded-media bg-ivory/70 p-7 md:p-9"
          }
        >
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-serif text-heading-2">{m.name}</h3>
            {m.featured && (
              <span className="rounded-[10px] bg-sage-100 px-3 py-1.5 text-[0.7rem] font-semibold tracking-[0.14em] text-sage-700 uppercase">
                In our range
              </span>
            )}
          </div>
          <dl className="mt-7 space-y-5">
            {Object.entries(m.rows).map(([label, value]) => (
              <div key={label}>
                <dt className="eyebrow">{label}</dt>
                <dd className="mt-1.5 flex items-start gap-2 text-ink">
                  {(label === "Blade" || label === "Pulling") && (
                    <Icon
                      name={value === "No" ? "check" : "close"}
                      className={value === "No" ? "mt-0.5 size-4 text-success" : "mt-0.5 size-4 text-ink-faint"}
                    />
                  )}
                  <span>{label === "Blade" || label === "Pulling" ? (value === "No" ? `No ${label.toLowerCase()}` : `${label} involved`) : value}</span>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
