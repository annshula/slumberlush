import type { Metadata } from "next";
import Link from "next/link";

import { AccountHeader } from "@/components/account/AccountHeader";
import { EmptyState } from "@/components/account/EmptyState";
import { OrderRow } from "@/components/account/OrderRow";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { listOrders } from "@/lib/shopify/customer-service";
import { requireCustomer } from "@/lib/shopify/guard";

export const metadata: Metadata = {
  title: "Order history",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ after?: string | string[] }>;
};

export default async function OrdersPage({ searchParams }: PageProps) {
  await requireCustomer("/account/orders");
  const params = await searchParams;
  const after = Array.isArray(params.after) ? params.after[0] : params.after;

  const { orders, hasNextPage, endCursor } = await listOrders({
    first: 10,
    after: after ?? null,
  });

  return (
    <div className="min-w-0">
      <AccountHeader
        title="Order history"
        body="Every order you have placed, with live fulfilment and delivery tracking."
        crumbs={[{ label: "Orders" }]}
      />

      {orders.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon="bag"
            art="pram"
            title="Nothing here yet"
            body="Your orders will appear here as soon as you place one."
          >
            <Button href="/products" withArrow className="w-full sm:w-auto">
              Browse the range
            </Button>
          </EmptyState>
        </div>
      ) : (
        <>
          <Reveal
            as="ul"
            variant="up"
            stagger={0.06}
            className="mt-10 flex flex-col gap-3"
          >
            {orders.map((order) => (
              <li key={order.id}>
                <OrderRow order={order} />
              </li>
            ))}
          </Reveal>

          <div className="mt-10 flex items-center justify-between gap-4 pt-6">
            {after ? (
              <Link
                href="/account/orders"
                className="group/link flex items-center gap-2 font-label text-[0.72rem] tracking-[0.2em] text-sage-600 uppercase"
              >
                <Icon
                  name="arrow-right"
                  className="size-3.5 rotate-180 transition-transform duration-500 ease-out-soft group-hover/link:-translate-x-1"
                />
                Most recent
              </Link>
            ) : (
              <span />
            )}
            {hasNextPage && endCursor ? (
              <Link
                href={`/account/orders?after=${encodeURIComponent(endCursor)}`}
                className="group/link flex items-center gap-2 font-label text-[0.72rem] tracking-[0.2em] text-sage-600 uppercase"
              >
                Older orders
                <Icon
                  name="arrow-right"
                  className="size-3.5 transition-transform duration-500 ease-out-soft group-hover/link:translate-x-1"
                />
              </Link>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
