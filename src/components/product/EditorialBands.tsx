import Image from "next/image";

import { Icon } from "@/components/ui/Icon";
import type { ProductContent } from "@/content/products";
import type { ProductView } from "@/lib/commerce/product-view";
import { cn } from "@/lib/utils";

/**
 * Two bands under the video row: "Your evening ritual" (an arched photo with
 * three benefits) and "Fabric & feel" (the fibres, drawn as soft plush
 * swatches — CSS gradients, no image requests). Server component.
 */

const DEFER = "[content-visibility:auto] [contain-intrinsic-size:auto_720px]";

/** Plush swatch fills — dusk, honey, oat, moon. */
const SWATCHES = [
  "bg-[radial-gradient(circle_at_30%_25%,#fff_0,var(--color-dusk-100)_40%,var(--color-dusk-300)_100%)]",
  "bg-[radial-gradient(circle_at_30%_25%,#fff_0,var(--color-honey-100)_40%,var(--color-honey-300)_100%)]",
  "bg-[radial-gradient(circle_at_30%_25%,#fff_0,var(--color-oat)_40%,var(--color-linen)_100%)]",
  "bg-[radial-gradient(circle_at_30%_25%,#fff_0,var(--color-moon-100)_40%,var(--color-moon-300)_100%)]",
];

const POSITION = { right: "object-right", top: "object-top", center: "object-center" } as const;

export function EditorialBands({ content, view }: { content: ProductContent; view: ProductView }) {
  const daily = content.pdp.dailyStep;
  const needle = daily?.mediaFile.toLowerCase();
  const lifestyle =
    (needle &&
      view.gallery.find((m) => m.type === "image" && (m.url.toLowerCase().includes(needle) || m.group === needle))) ||
    view.gallery.find((m) => m.type === "image");

  const fibres = [
    ...content.materials.map((m) => ({ name: m.name, detail: m.detail })),
    ...content.highlights.map((h) => ({ name: h.title, detail: h.body })),
  ].slice(0, 4);

  return (
    <>
      {daily && (
        <section aria-labelledby="ritual-title" className={cn("px-2 sm:px-3", DEFER)}>
          <div className="relative overflow-hidden rounded-media bg-[linear-gradient(150deg,var(--color-honey-50)_0%,var(--color-oat)_55%,var(--color-dusk-100)_100%)]">
            <div className="container-page grid items-center gap-12 py-14 lg:grid-cols-[5fr_7fr] lg:gap-20 lg:py-24">
              {lifestyle && lifestyle.type === "image" && (
                <div className="arch relative mx-auto aspect-4/5 w-full max-w-sm overflow-hidden shadow-drift">
                  <Image
                    src={lifestyle.url}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 384px, 90vw"
                    className={cn("object-cover", POSITION[daily.imagePosition ?? "center"])}
                  />
                </div>
              )}
              <div>
                <p className="eyebrow eyebrow-dot">{daily.eyebrow}</p>
                <h2 id="ritual-title" className="mt-5 font-serif text-display">
                  {daily.heading}
                </h2>
                <p className="mt-5 max-w-lg text-body-lg text-ink-soft">{daily.body}</p>
                <ul className="mt-10 grid gap-4 sm:grid-cols-3">
                  {daily.benefits.map((b) => (
                    <li key={b.title} className="rounded-[26px] bg-cloud/85 p-5 shadow-soft backdrop-blur">
                      <span className="grid size-11 place-items-center rounded-full bg-night-900 text-honey-200">
                        <Icon name={b.icon} className="size-5" />
                      </span>
                      <span className="mt-4 block font-serif text-heading-3 font-medium">{b.title}</span>
                      <span className="mt-1 block text-body-sm text-ink-soft">{b.body}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      <section id="materials" aria-labelledby="materials-title" className={cn("section-y", DEFER)}>
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow eyebrow-dot justify-center">Fabric &amp; feel</p>
            <h2 id="materials-title" className="mt-5 font-serif text-display">
              What&apos;s against <em>your skin.</em>
            </h2>
            <p className="mt-5 text-body-lg text-ink-soft">Every fibre, in plain words.</p>
          </div>
          <ul className="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
            {fibres.map((f, i) => (
              <li key={f.name} className="reveal flex flex-col items-center text-center">
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-24 rounded-full shadow-[inset_-8px_-10px_18px_rgb(60_44_26/0.12),inset_8px_8px_16px_rgb(255_255_255/0.9),0_16px_30px_-14px_rgb(60_44_26/0.35)] sm:size-28",
                    SWATCHES[i % SWATCHES.length],
                  )}
                />
                <span className="mt-6 font-serif text-heading-2">{f.name}</span>
                <span className="mt-2 max-w-60 text-body-sm text-ink-soft">{f.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
