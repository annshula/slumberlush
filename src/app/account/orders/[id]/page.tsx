import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AccountHeader } from "@/components/account/AccountHeader";
import { OrderItemStatus } from "@/components/account/OrderItemStatus";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import {
  financialStatus,
  fulfillmentStatus,
  groupShipments,
  RETURN_WINDOW_DAYS,
  returnEligibility,
  toneClasses,
} from "@/lib/account/order-status";
import { formatMoney, shortDate } from "@/lib/money";
import { getOrder, getOrderReturnStatus } from "@/lib/shopify/customer-service";
import { requireCustomer } from "@/lib/shopify/guard";
import type { Money } from "@/lib/shopify/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Order details",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

const panel = "rounded-panel bg-paper p-6 shadow-soft";
const panelHeading = "font-serif text-heading-sm text-ink uppercase";
const badge =
  "rounded-tag px-3 py-1.5 font-label text-[0.66rem] tracking-[0.14em] uppercase";

/**
 * One order, in three zones: what you paid at the top, every item and where it
 * has got to in the middle, then the paperwork underneath. Products are listed
 * exactly once — the status card carries the price, so there is no second
 * "items" table repeating the same four rows.
 */
export default async function OrderDetailPage({ params }: PageProps) {
  await requireCustomer("/account/orders");
  const { id } = await params;
  const order = await getOrder(decodeURIComponent(id));
  if (!order) notFound();

  // Never allowed to fail the page — see getOrderReturnStatus's own comment.
  const returns = await getOrderReturnStatus(order.id);

  const financial = financialStatus(order.financialStatus);
  const fulfillment = fulfillmentStatus(order.fulfillments[0]?.status ?? null);
  const hasTracking = order.fulfillments.some(
    (f) => f.trackingInformation.length > 0,
  );

  /* Which shipment each item is actually in, so a card can show that box's
     real stage rather than an order-wide average of all of them. */
  const shipments = groupShipments(order);
  const shipmentByItem = new Map(
    shipments.flatMap((group) =>
      group.lineItems.map((item) => [item.id, group] as const),
    ),
  );

  /* What can still go back, and why not when nothing can — the 30-day window
     we promise on the storefront is enforced here rather than only advertised. */
  const returns30 = returnEligibility(order, returns);
  const itemCount = order.lineItems.reduce((sum, l) => sum + l.quantity, 0);

  /* Always the currency the order was actually charged in. The header's
     currency picker converts live storefront prices through Shopify Markets;
     applying today's rate to a past payment would print a number the shopper
     never paid and cannot match to their bank statement. */
  const currency =
    order.totalPrice?.currencyCode ??
    order.subtotal?.currencyCode ??
    order.lineItems.find((l) => l.totalPrice)?.totalPrice?.currencyCode ??
    null;

  const money = (value: Money | null) =>
    value ? formatMoney(value.amount, value.currencyCode ?? currency ?? undefined) : "—";

  return (
    <div className="min-w-0">
      <AccountHeader
        eyebrow="Order"
        title={order.name}
        body={`Placed ${shortDate(order.processedAt)} · ${itemCount} item${itemCount === 1 ? "" : "s"}`}
        crumbs={[
          { label: "Orders", href: "/account/orders" },
          { label: order.name },
        ]}
      >
        {/* The total is the fact people open this page for, so it gets display
            type rather than being buried at the bottom of a totals table. */}
        <div className="mt-7 flex flex-wrap items-end gap-x-10 gap-y-5">
          <div>
            <p className="eyebrow text-ink-faint">Order total</p>
            <p className="mt-2 font-serif text-[clamp(1.75rem,1.3rem+1.6vw,2.5rem)] leading-none tracking-[0.02em] text-ink uppercase">
              {money(order.totalPrice)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 pb-1">
            <span className={cn(badge, toneClasses[financial.tone])}>
              {financial.label}
            </span>
            <span className={cn(badge, toneClasses[fulfillment.tone])}>
              {fulfillment.label}
            </span>
          </div>
        </div>
      </AccountHeader>

      {order.cancelledAt && (
        <div className="mt-8 flex gap-3 rounded-panel bg-clay-100 px-5 py-4">
          <Icon
            name="close"
            className="mt-0.5 size-4 shrink-0 text-sage-700"
            strokeWidth={2.2}
          />
          <p className="text-body-sm text-sage-700">
            This order was cancelled on {shortDate(order.cancelledAt)}.
          </p>
        </div>
      )}

      <Reveal
        as="div"
        variant="up"
        stagger={0.08}
        className="mt-12 flex flex-col gap-12"
      >
        {/* ── Item by item ─────────────────────────────────────────────── */}
        <section aria-labelledby="items-heading">
          <div className="flex items-baseline justify-between gap-6">
            <div>
              <h2 id="items-heading" className={panelHeading}>
                Item by item
              </h2>
              <p className="mt-2 font-serif text-2xl text-ink-soft">
                where everything has got to
              </p>
            </div>
            {hasTracking && (
              <span className="hidden shrink-0 items-center gap-2 text-body-sm text-ink-faint sm:flex">
                <Icon name="truck" className="size-4" />
                Tracked
              </span>
            )}
          </div>

          {/* One card per product, never one stepper for the whole order: a
              single delivered box would otherwise drag every other item to
              "Delivered" while it is still in transit. */}
          <ul className="mt-6 flex flex-col gap-3">
            {order.lineItems.map((line) => {
              const group = shipmentByItem.get(line.id);
              if (!group) return null;
              return (
                <OrderItemStatus
                  key={line.id}
                  item={line}
                  group={group}
                  order={order}
                  returns={returns}
                />
              );
            })}
          </ul>

          {/* The 30-day promise, kept honest: when it has run out the button
              goes dead and says so, rather than sending someone to a form that
              would only reject them. */}
          <div
            className={cn(
              "mt-6 flex flex-wrap items-center justify-between gap-5 rounded-panel px-6 py-6",
              returns30.items.length > 0 ? "bg-blush" : "bg-cream",
            )}
          >
            <div className="min-w-0">
              <p className="font-headline text-ink">
                {returns30.items.length > 0
                  ? "Something not quite right?"
                  : "Returns closed"}
              </p>
              <p className="mt-1.5 text-body-sm text-ink-soft">
                {returns30.items.length === 0
                  ? returns30.reason
                  : returns30.closesAt
                    ? `Damaged, defective or wrong item? Request a return by ${shortDate(returns30.closesAt.toISOString())}. Opened personal-care items can't otherwise be returned.`
                    : `Damaged, defective or wrong item? You have ${RETURN_WINDOW_DAYS} days from delivery to request a return.`}
              </p>
            </div>

            {returns30.items.length > 0 ? (
              <Button
                href={`/account/orders/${id}/return`}
                variant="outline"
                withArrow
              >
                Return order
              </Button>
            ) : (
              <Button
                variant="outline"
                disabled
                title={returns30.reason ?? undefined}
                className="disabled:pointer-events-none disabled:opacity-40"
              >
                Return order
              </Button>
            )}
          </div>

          {returns30.items.length === 0 && (
            <p className="mt-4 text-body-sm text-ink-faint">
              {hasTracking
                ? "Tracking updates land here as soon as the carrier scans your parcel."
                : "We will add tracking here the moment your parcel leaves us."}
            </p>
          )}
        </section>

        {/* ── Paperwork ────────────────────────────────────────────────── */}
        <section
          aria-labelledby="summary-heading"
          className="grid gap-6 md:grid-cols-2"
        >
          <div className={panel}>
            <h2 id="summary-heading" className={panelHeading}>
              Payment
            </h2>

            <dl className="mt-5 space-y-2.5 text-body-sm">
              <Row label="Subtotal" value={money(order.subtotal)} />
              <Row label="Shipping" value={money(order.totalShipping)} />
              <Row label="Tax" value={money(order.totalTax)} />
              {order.totalRefunded && Number(order.totalRefunded.amount) > 0 && (
                <Row
                  label="Refunded"
                  value={`− ${money(order.totalRefunded)}`}
                  tone="rose"
                />
              )}
              <div className="flex items-baseline justify-between gap-4 pt-4">
                <dt className="font-serif text-lg text-ink uppercase">
                  Total
                </dt>
                <dd className="font-serif text-[1.6rem] leading-none tracking-[0.02em] text-ink uppercase">
                  {money(order.totalPrice)}
                </dd>
              </div>
            </dl>

            <div className="mt-5 space-y-1.5 pt-4 text-caption text-ink-faint">
              {currency && (
                <p>
                  Charged in{" "}
                  <span className="text-ink-soft">{currency}</span> — the
                  currency at the time you ordered, not the one selected in the
                  header.
                </p>
              )}
              {order.email && (
                <p>
                  Receipt sent to{" "}
                  <span className="text-ink-soft">{order.email}</span>
                </p>
              )}
            </div>
          </div>

          <div className={panel}>
            <h2 className={panelHeading}>Delivery</h2>

            {order.shippingAddress ? (
              <div className="mt-5">
                <p className="eyebrow text-ink-faint">Shipping to</p>
                <p className="mt-2.5 text-body-sm whitespace-pre-line text-ink-soft">
                  {order.shippingAddress.formatted.join("\n")}
                </p>
              </div>
            ) : (
              <p className="mt-5 text-body-sm text-ink-faint">
                No shipping address on this order.
              </p>
            )}

            {order.billingAddress && (
              <div className="mt-5 pt-5">
                <p className="eyebrow text-ink-faint">Billed to</p>
                <p className="mt-2.5 text-body-sm whitespace-pre-line text-ink-soft">
                  {order.billingAddress.formatted.join("\n")}
                </p>
              </div>
            )}
          </div>
        </section>
      </Reveal>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "rose";
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-soft">{label}</dt>
      <dd className={tone === "rose" ? "text-sage-600" : "text-ink"}>
        {value}
      </dd>
    </div>
  );
}
