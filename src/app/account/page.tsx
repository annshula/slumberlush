import type { Metadata } from "next";
import Link from "next/link";

import { AccountHeader } from "@/components/account/AccountHeader";
import { EmptyState } from "@/components/account/EmptyState";
import { OrderRow } from "@/components/account/OrderRow";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { getCustomer, listOrders } from "@/lib/shopify/customer-service";
import { requireCustomer } from "@/lib/shopify/guard";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AccountOverviewPage() {
  await requireCustomer("/account");

  // One failing panel must never blank the dashboard.
  const [customerResult, ordersResult] = await Promise.allSettled([
    getCustomer(),
    listOrders({ first: 5 }),
  ]);

  const customer =
    customerResult.status === "fulfilled" ? customerResult.value : null;
  const orders =
    ordersResult.status === "fulfilled" ? ordersResult.value : null;
  const first = customer?.firstName ?? "there";
  const initials =
    (customer?.firstName?.[0] ?? "") + (customer?.lastName?.[0] ?? "");
  const defaultAddress = customer?.defaultAddressId
    ? customer.addresses.find((a) => a.id === customer.defaultAddressId)
    : null;

  return (
    <div className="min-w-0">
      <AccountHeader
        eyebrow="Welcome back"
        title={`Hi, ${first}`}
        body="Your profile, your saved address and everything you have ordered — all in one place."
      />

      <Reveal
        as="div"
        variant="up"
        stagger={0.08}
        className="mt-8 grid gap-4 sm:mt-10 sm:gap-6 md:grid-cols-2"
      >
        {/* Profile */}
        <div className="min-w-0 rounded-panel bg-paper p-5 shadow-soft sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
            <h2 className="min-w-0 font-serif text-heading-sm text-ink uppercase">
              Profile
            </h2>
            <Link
              href="/account/profile"
              className="group/link flex shrink-0 items-center gap-1 font-label text-[0.7rem] tracking-[0.14em] text-sage-600 uppercase"
            >
              Edit
              <Icon
                name="arrow-right"
                className="size-3.5 transition-transform duration-500 ease-out-soft group-hover/link:translate-x-1"
              />
            </Link>
          </div>
          <div className="mt-5 flex items-center gap-4 sm:mt-6">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-blush font-serif text-xl text-sage-600 uppercase sm:size-14">
              {initials || <Icon name="user" className="size-5" />}
            </span>
            <div className="min-w-0">
              <p className="font-headline text-lg wrap-break-word text-ink">
                {[customer?.firstName, customer?.lastName]
                  .filter(Boolean)
                  .join(" ") || "Your name"}
              </p>
              <p className="text-body-sm wrap-break-word text-ink-soft">
                {customer?.emailAddress ?? "No email on file"}
              </p>
            </div>
          </div>
        </div>

        {/* Default address */}
        <div className="min-w-0 rounded-panel bg-paper p-5 shadow-soft sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
            <h2 className="min-w-0 font-serif text-heading-sm text-ink uppercase">
              Default address
            </h2>
            <Link
              href="/account/addresses"
              className="group/link flex shrink-0 items-center gap-1 font-label text-[0.7rem] tracking-[0.14em] text-sage-600 uppercase"
            >
              All
              <Icon
                name="arrow-right"
                className="size-3.5 transition-transform duration-500 ease-out-soft group-hover/link:translate-x-1"
              />
            </Link>
          </div>
          <div className="mt-5 flex items-start gap-4 sm:mt-6">
            <span className="grid size-12 shrink-0 place-items-center rounded-[12px] bg-cream text-ink-soft sm:size-14">
              <Icon name="map-pin" className="size-5" />
            </span>
            {defaultAddress ? (
              <address className="flex min-w-0 flex-col not-italic">
                {defaultAddress.formatted.map((line, i) => (
                  <span
                    key={i}
                    className="text-body-sm wrap-break-word text-ink-soft"
                  >
                    {line}
                  </span>
                ))}
              </address>
            ) : (
              <p className="min-w-0 text-body-sm text-ink-soft">
                No default address yet. Add one at checkout and it will live
                here.
              </p>
            )}
          </div>
        </div>
      </Reveal>

      {/* Orders */}
      <div className="mt-10 sm:mt-12">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h2 className="min-w-0 font-serif text-heading-sm text-ink uppercase">
            Recent orders
          </h2>
          <Link
            href="/account/orders"
            className="link-underline shrink-0 font-label text-[0.72rem] tracking-[0.2em] text-sage-600 uppercase"
          >
            View all
          </Link>
        </div>

        {!orders || orders.orders.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon="bag"
              art="pram"
              title="No orders yet"
              body="When you place your first order it will show up here with live tracking and easy returns."
            >
              <Button href="/products" withArrow className="w-full sm:w-auto">
                Shop the range
              </Button>
            </EmptyState>
          </div>
        ) : (
          <Reveal
            as="ul"
            variant="up"
            stagger={0.06}
            className="mt-6 flex flex-col gap-3"
          >
            {orders.orders.map((order) => (
              <li key={order.id}>
                <OrderRow order={order} />
              </li>
            ))}
          </Reveal>
        )}
      </div>
    </div>
  );
}
