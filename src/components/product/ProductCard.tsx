import Image from "next/image";
import Link from "next/link";

import { Icon } from "@/components/ui/Icon";
import { Stars } from "@/components/ui/Stars";
import { demoReviewsFor } from "@/data/reviews";
import type { ProductView } from "@/lib/commerce/product-view";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * Product card. A tall, softly rounded photo (the second shot fades in on
 * hover for fine pointers) carrying its colour count as a frosted chip, then
 * the name set in the serif voice, the rating and the price. Server
 * component — zero client JS.
 */
export function ProductCard({
  product,
  priority = false,
  sizes = "(min-width: 1024px) 23vw, (min-width: 640px) 31vw, 48vw",
  tone = "light",
}: {
  product: ProductView;
  priority?: boolean;
  sizes?: string;
  tone?: "light" | "dark";
}) {
  const variesInPrice =
    new Set(product.variants.filter((v) => v.units === 1).map((v) => v.price)).size > 1;
  const rating = demoReviewsFor(product.handle)?.summary;
  const shown = product.swatches.slice(0, 4);
  const onSale = product.fromCompareAt && product.fromCompareAt > product.fromPrice;
  const dark = tone === "dark";

  return (
    <article className="group relative w-full">
      <div className="well relative aspect-4/5 overflow-hidden rounded-[28px]">
        {product.cardImage && (
          <Image
            src={product.cardImage.url}
            alt={product.cardImage.alt}
            fill
            priority={priority}
            sizes={sizes}
            className="media-zoom object-cover"
          />
        )}
        {product.cardImageAlt && (
          <Image
            src={product.cardImageAlt.url}
            alt=""
            fill
            sizes={sizes}
            className="hidden object-cover opacity-0 transition-opacity duration-700 ease-out-soft group-hover:opacity-100 [@media(hover:hover)]:block"
          />
        )}
        {product.badge && (
          <span className="absolute top-3.5 left-3.5 rounded-full bg-cloud/95 px-3 py-1.5 text-[0.7rem] font-bold tracking-[0.06em] text-ink shadow-soft">
            {product.badge}
          </span>
        )}
        {!product.availableForSale && (
          <span className="glass absolute top-3.5 right-3.5 rounded-full px-3 py-1.5 text-[0.7rem] font-bold">Sold out</span>
        )}
        {shown.length > 1 && (
          <span className="glass absolute bottom-3.5 left-3.5 flex items-center gap-1 rounded-full py-1.5 pr-3 pl-1.5">
            {shown.map((s) => (
              <span key={s.value} className="relative size-4.5 overflow-hidden rounded-full ring-1 ring-ink/10">
                {s.image && <Image src={s.image} alt="" fill sizes="18px" className="scale-[2.4] object-cover" />}
              </span>
            ))}
            <span className="ml-1 text-[0.72rem] font-bold text-ink">
              {product.swatches.length} colours
            </span>
          </span>
        )}
        <span
          aria-hidden="true"
          className="absolute right-3.5 bottom-3.5 grid size-11 translate-y-2 place-items-center rounded-full bg-night-900 text-milk opacity-0 shadow-lift transition-all duration-500 ease-out-soft group-hover:translate-y-0 group-hover:opacity-100"
        >
          <Icon name="arrow-right" className="size-4" />
        </span>
      </div>

      <div className="mt-4 px-1">
        <h3 className={cn("font-serif text-[1.35rem] leading-tight font-medium", dark && "text-milk")}>
          <Link href={product.href} className="after:absolute after:inset-0">
            {product.name}
          </Link>
        </h3>
        <p className={cn("mt-1 text-[0.82rem]", dark ? "text-moon-100/70" : "text-ink-soft")}>{product.format}</p>
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <p className={cn("flex items-baseline gap-2 tabular-nums", dark && "text-milk")}>
            <span className="text-body font-bold">
              {variesInPrice && <span className={cn("text-[0.78rem] font-semibold", dark ? "text-moon-100/70" : "text-ink-soft")}>from </span>}
              {formatMoney(product.fromPrice, product.currency)}
            </span>
            {onSale && (
              <span className={cn("text-[0.8rem] line-through", dark ? "text-moon-100/50" : "text-ink-faint")}>
                {formatMoney(product.fromCompareAt!, product.currency)}
              </span>
            )}
          </p>
          {rating && rating.count > 0 && (
            <p className={cn("flex items-center gap-1.5 text-[0.75rem]", dark ? "text-moon-100/70" : "text-ink-soft")}>
              <Stars value={rating.average} starClassName="size-3.5" />
              <span className="tabular-nums">{rating.average.toFixed(1)}</span>
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
