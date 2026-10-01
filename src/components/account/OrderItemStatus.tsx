import Link from "next/link";

import { ItemStatusPanel } from "@/components/account/ItemStatusPanel";
import { Icon, type IconName } from "@/components/ui/Icon";
import {
  fulfillmentStatus,
  itemJourney,
  returnForLineItem,
  returnReasonLabel,
  returnStatus,
  type JourneyNode,
  type JourneyState,
  type ShipmentGroup,
  type StatusTone,
} from "@/lib/account/order-status";
import { formatMoney, shortDate } from "@/lib/money";
import type {
  Order,
  OrderLineItem,
  OrderReturnSummary,
} from "@/lib/shopify/types";
import { cn } from "@/lib/utils";

/** Card accents, keyed to the same tones the status badges already use. */
const accents: Record<StatusTone, { edge: string; chip: string }> = {
  neutral: {
    edge: "from-sand to-sand",
    chip: "bg-ink/5 text-ink-soft",
  },
  rose: {
    edge: "from-sage-300 to-sage-600",
    chip: "bg-clay-100 text-sage-600",
  },
  lilac: {
    edge: "from-sand to-ink-soft",
    chip: "bg-sand text-ink-soft",
  },
  mint: { edge: "from-mint to-mint", chip: "bg-mint/60 text-ink" },
  butter: { edge: "from-butter to-butter", chip: "bg-butter/80 text-ink" },
  ink: { edge: "from-ink to-ink", chip: "bg-ink text-paper" },
};

function glyphFor(isReturning: boolean, status: string | null): IconName {
  if (isReturning) return "refresh";
  if (status === "SUCCESS") return "check";
  if (status === "CANCELLED" || status === "FAILURE" || status === "ERROR") {
    return "alert";
  }
  if (
    !status ||
    status === "UNFULFILLED" ||
    status === "OPEN" ||
    status === "PENDING_FULFILLMENT"
  ) {
    return "package";
  }
  return "truck";
}

/**
 * One item in an order: a compact row carrying where it has got to, opening
 * its full history on a surface of its own — a bottom sheet on a phone, a
 * two-column dialog from md up.
 *
 * The card deliberately answers only "where is it now?". A four-milestone
 * timeline crammed into a 300px row answered that worse than a single line of
 * text does, and buried everything else on the card while doing it.
 */
export function OrderItemStatus({
  item,
  group,
  order,
  returns,
}: {
  item: OrderLineItem;
  group: ShipmentGroup;
  order: Order;
  returns: OrderReturnSummary | null;
}) {
  const detail = returnForLineItem(item.id, returns);
  const journey = itemJourney(group, order, detail);

  const tone: StatusTone = detail
    ? returnStatus(detail.status).tone
    : fulfillmentStatus(group.fulfillment?.status ?? null).tone;
  const accent = accents[tone];

  /* The headline is whichever milestone the item is actually sitting on — the
     live one if something is still in motion, otherwise the last one reached. */
  const marker =
    journey.find((node) => node.state === "current") ??
    journey.findLast(
      (node) => node.state === "done" || node.state === "failed",
    ) ??
    journey[0];

  const description = detail ? returnStatus(detail.status).description : "";
  const reason = detail?.lineItemReasons[item.id] ?? null;
  const price = item.totalPrice
    ? formatMoney(item.totalPrice.amount, item.totalPrice.currencyCode)
    : "";

  const status = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-2 py-1 font-label text-[0.62rem] tracking-[0.12em] uppercase",
        accent.chip,
      )}
    >
      <Icon
        name={glyphFor(detail !== null, group.fulfillment?.status ?? null)}
        className="size-3"
        strokeWidth={2.4}
      />
      {marker?.label}
    </span>
  );

  const thumb = (size: string) =>
    item.image ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.image.url}
        alt={item.image.altText ?? ""}
        className={cn("shrink-0 bg-blush object-cover", size)}
      />
    ) : (
      <span
        className={cn(
          "grid shrink-0 place-items-center bg-blush text-sage-600",
          size,
        )}
      >
        <Icon name="bag" className="size-5" />
      </span>
    );

  /* ── The card face ─────────────────────────────────────────────────── */
  /* A phone gets the native two-line list row: a big thumbnail, the name over
     as many lines as it needs, then one quiet line of everything else. The
     four-column desktop arrangement put the title, the pill, a price column
     and an arrow into ~300px, where the name was clipped to two words and the
     pill wrapped under its own date. Price rejoins as its own column only once
     there is room for it. */
  const meta = [
    price,
    `Qty ${item.quantity}`,
    marker?.at ? shortDate(marker.at) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const face = (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-y-0 left-0 w-1 bg-linear-to-b",
          accent.edge,
        )}
      />

      {/* A phone's affordance. Absolutely positioned so it costs the text
          nothing but the 16px of padding that keeps it clear — as a flex
          sibling the arrow was taking 30px of a ~300px line. A chevron rather
          than an arrow: on a row that opens something, it is the glyph people
          already read as "there is more here". */}
      <Icon
        name="chevron-right"
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-faint sm:hidden"
        strokeWidth={2}
      />

      <span className="flex min-h-18 items-center gap-3.5 py-3.5 pr-2 pl-2 sm:pl-6">
        {thumb("size-14 rounded-card sm:size-12")}

        <span className="min-w-0 flex-1 pr-4 sm:pr-0">
          <span className="line-clamp-2 block font-headline text-body-sm leading-snug text-ink sm:line-clamp-1">
            {item.title}
          </span>

          <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            {status}
            {marker?.at && (
              <span className="hidden text-[0.68rem] text-ink-faint sm:inline">
                {shortDate(marker.at)}
              </span>
            )}
          </span>

          {/* Phone only: price, quantity and date folded into one line rather
              than competing for columns of their own. */}
          <span className="mt-1.5 block text-[0.7rem] text-ink-faint sm:hidden">
            {meta}
          </span>
        </span>

        <span className="hidden shrink-0 text-right sm:block">
          <span className="block font-headline text-body-sm text-ink">
            {price}
          </span>
          <span className="block text-[0.68rem] text-ink-faint">
            ×{item.quantity}
          </span>
        </span>

        {/* Hidden on a phone. It cost 30px of a ~300px line — the arrow plus
            its gap — to say what the whole row already says: the card is the
            tap target, and the press state confirms it. There is no hover on a
            phone for it to reward either. From sm up it returns as the same
            affordance the orders list uses. */}
        <Icon
          name="arrow-right"
          className="hidden size-4 shrink-0 text-ink-faint transition-transform duration-500 ease-out-soft group-hover:translate-x-1 group-hover:text-sage-600 sm:block"
        />
      </span>
    </>
  );

  return (
    <ItemStatusPanel face={face} label={item.title}>
      <div className="flex min-h-0 flex-1 flex-col md:grid md:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]">
        {/* On a phone this is the sheet's header; from md up it becomes the
            dialog's left column — a quiet cream card the timeline reads
            against. */}
        <div className="shrink-0 px-5 pt-4 pb-5 md:bg-cream md:px-7 md:py-8">
          <div className="flex items-start gap-4 md:flex-col md:gap-5">
            {thumb(
              "size-14 rounded-card md:size-auto md:aspect-square md:w-full md:rounded-panel",
            )}
            <div className="min-w-0">
              <p className="font-headline text-ink md:text-lg">{item.title}</p>
              {item.variantTitle && item.variantTitle !== "Default Title" && (
                <p className="text-caption text-ink-faint">
                  {item.variantTitle}
                </p>
              )}
              <p className="mt-2 text-body-sm text-ink-soft">
                {price ? `${price} · ` : ""}Qty {item.quantity}
              </p>
              {item.sku && (
                <p className="mt-1 text-caption text-ink-faint">{item.sku}</p>
              )}
            </div>
          </div>

          <div className="mt-4 md:mt-6">{status}</div>
        </div>

        {/* The timeline is the only part that scrolls, so the product stays
            put while a long history moves under it. */}
        <div
          className="min-h-0 flex-1 overflow-y-auto px-5 pt-6 pb-7 md:px-8 md:py-8"
          data-lenis-prevent
        >
          <h3 className="font-serif text-heading-sm text-ink uppercase">
            Tracking
          </h3>
          <p className="mt-1.5 font-serif text-2xl text-ink-soft">
            from our door to your floor
          </p>

          <VerticalJourney nodes={journey} />

          {(description || reason || detail?.tracking?.number) && (
            <dl className="mt-7 space-y-4 pt-5 text-body-sm">
              {description && (
                <div>
                  <dd className="text-ink-soft">{description}</dd>
                </div>
              )}
              {reason && (
                <div>
                  <dt className="eyebrow text-ink-faint">Reason</dt>
                  <dd className="mt-1.5 text-ink">
                    {returnReasonLabel(reason)}
                  </dd>
                </div>
              )}
              {detail?.tracking?.number && (
                <div>
                  <dt className="eyebrow text-ink-faint">Return tracking</dt>
                  <dd className="mt-1.5">
                    {detail.tracking.url ? (
                      <Link
                        href={detail.tracking.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-underline text-ink"
                      >
                        {detail.tracking.number}
                      </Link>
                    ) : (
                      <span className="text-ink">{detail.tracking.number}</span>
                    )}
                  </dd>
                </div>
              )}
            </dl>
          )}
        </div>
      </div>
    </ItemStatusPanel>
  );
}

/* ── Vertical timeline ─────────────────────────────────────────────────── */

const labelColor: Record<JourneyState, string> = {
  done: "text-ink",
  current: "text-ink-soft",
  failed: "text-sage-700",
  pending: "text-ink-faint",
};

/**
 * Milestones oldest to newest down a single spine. Vertical is what a status
 * history actually wants: every label gets a full line, every date sits beside
 * it, and a fifth milestone costs one row instead of breaking the layout — all
 * the things the horizontal rail had to fight for inside a card.
 *
 * The spine draws downward and each row slides in behind it, staggered so the
 * sequence reads in the order it happened.
 */
function VerticalJourney({ nodes }: { nodes: JourneyNode[] }) {
  return (
    <ol className="mt-6">
      {nodes.map((node, i) => {
        const isLast = i === nodes.length - 1;
        return (
          <li
            key={node.id}
            className="step-in relative flex gap-4 pb-6 last:pb-0"
            style={{ animationDelay: `${0.06 * i + 0.1}s` }}
          >
            {/* Spine down to the next milestone, running behind this row's
                dot so the line meets it rather than stopping short. */}
            {!isLast && (
              <span
                aria-hidden="true"
                className="absolute top-5 bottom-0 left-1.75 w-0.5 overflow-hidden rounded-pill bg-sand"
              >
                <Spine state={nodes[i + 1]?.state} index={i} />
              </span>
            )}

            <span className="relative z-10 mt-0.5">
              <Dot state={node.state} />
            </span>

            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "font-headline text-body-sm",
                  labelColor[node.state],
                )}
              >
                {node.label}
              </p>
              {node.at && (
                <p className="mt-0.5 text-caption text-ink-faint">
                  {shortDate(node.at)}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** The leg between two milestones: filled once reached, flowing while live. */
function Spine({
  state,
  index,
}: {
  state: JourneyState | undefined;
  index: number;
}) {
  const delay = { animationDelay: `${0.06 * index + 0.2}s` };

  if (state === "done") {
    return <span className="spine-done block h-full bg-mint" style={delay} />;
  }
  if (state === "failed") {
    return (
      <span className="spine-done block h-full bg-sage-300" style={delay} />
    );
  }
  if (state === "current") {
    return <span className="spine-live block h-3/5" style={delay} />;
  }
  return null;
}

function Dot({ state }: { state: JourneyState }) {
  if (state === "current") {
    return (
      <span className="relative grid size-4 place-items-center rounded-full bg-ink-soft ring-[3px] ring-cream">
        <span
          aria-hidden="true"
          className="absolute inset-0 animate-ping rounded-full bg-ink-soft opacity-40 motion-reduce:hidden"
        />
        <span className="relative size-1.5 rounded-full bg-paper" />
      </span>
    );
  }
  if (state === "failed") {
    return (
      <span className="grid size-4 place-items-center rounded-full bg-sage-600 text-paper ring-[3px] ring-clay-100">
        <Icon name="close" className="size-2.5" strokeWidth={3} />
      </span>
    );
  }
  if (state === "pending") {
    return (
      <span className="grid size-4 place-items-center rounded-full bg-sand">
        <span className="size-1 rounded-full bg-sand" />
      </span>
    );
  }
  return (
    <span className="grid size-4 place-items-center rounded-full bg-mint text-ink ring-[3px] ring-mint/25">
      <Icon name="check" className="size-2.5" strokeWidth={3} />
    </span>
  );
}
