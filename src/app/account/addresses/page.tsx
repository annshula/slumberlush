import type { Metadata } from "next";

import { AccountHeader } from "@/components/account/AccountHeader";
import { EmptyState } from "@/components/account/EmptyState";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { getCustomer } from "@/lib/shopify/customer-service";
import { requireCustomer } from "@/lib/shopify/guard";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Addresses",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AddressesPage() {
  await requireCustomer("/account/addresses");

  const customer = await getCustomer();
  const addresses = customer.addresses;
  const defaultId = customer.defaultAddressId;

  return (
    <div className="min-w-0">
      <AccountHeader
        title="Addresses"
        body="Saved delivery and billing addresses on your account."
        crumbs={[{ label: "Addresses" }]}
      />

      {addresses.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon="map-pin"
            art="cloud"
            title="No addresses yet"
            body="Your saved delivery addresses will appear here once you add one at checkout."
          >
            <Button href="/products" withArrow className="w-full sm:w-auto">
              Browse the range
            </Button>
          </EmptyState>
        </div>
      ) : (
        <Reveal
          as="ul"
          variant="up"
          stagger={0.06}
          className="mt-8 grid gap-4 sm:mt-10 sm:gap-5 md:grid-cols-2"
        >
          {addresses.map((address, i) => {
            const isDefault = address.id === defaultId;
            const name =
              [address.firstName, address.lastName].filter(Boolean).join(" ") ||
              "This address";
            const lines =
              address.formatted.length > 0
                ? address.formatted
                : [address.address1, address.address2, address.city].filter(
                    (v): v is string => Boolean(v),
                  );
            /* Cards alternate blush/lilac so a wall of them still reads as
               distinct entries once they stack into one column on a phone. */
            const warm = isDefault || i % 2 === 0;

            return (
              <li
                key={address.id}
                className={cn(
                  "relative flex min-w-0 flex-col overflow-hidden rounded-panel bg-paper shadow-soft transition-shadow duration-500 ease-out-soft hover:shadow-drift",
                  isDefault && "ring-2 ring-sage-200",
                )}
              >
                {/* Tinted band with the pin sitting on the seam — the same
                    device as the sign-out dialog, scaled down. The pin claims
                    the lower-left, so the badge is centred on the right rather
                    than stacked above it, and the line-art steps aside when a
                    badge is present instead of crowding the same corner. */}
                <div
                  className={cn(
                    "relative h-16",
                    warm ? "bg-blush" : "bg-cream",
                  )}
                >
                  {isDefault && (
                    <span className="absolute top-1/2 right-4 flex -translate-y-1/2 items-center gap-1.5 rounded-tag bg-paper/85 px-3 py-1.5 font-label text-[0.6rem] tracking-[0.16em] text-sage-600 uppercase shadow-soft backdrop-blur-sm">
                      <Icon name="check" className="size-3" strokeWidth={2.4} />
                      Default
                    </span>
                  )}
                  <span
                    className={cn(
                      "absolute bottom-0 left-5 grid size-11 translate-y-1/2 place-items-center rounded-full shadow-soft",
                      warm
                        ? "bg-sage-600 text-paper"
                        : "bg-ink-soft text-paper",
                    )}
                  >
                    <Icon name="map-pin" className="size-4" />
                  </span>
                </div>

                <div className="flex min-w-0 flex-1 flex-col px-5 pt-9 pb-5 sm:px-6 sm:pb-6">
                  <p className="font-headline text-lg wrap-break-word text-ink">
                    {name}
                  </p>

                  {lines.length > 0 ? (
                    <address className="mt-2 flex flex-col not-italic">
                      {lines.map((line, li) => (
                        <span
                          key={li}
                          className="text-body-sm wrap-break-word text-ink-soft"
                        >
                          {line}
                        </span>
                      ))}
                    </address>
                  ) : (
                    <p className="mt-2 text-body-sm text-ink-faint">
                      No full address on file
                    </p>
                  )}

                  {address.phoneNumber && (
                    <p className="mt-3 flex items-center gap-2 text-caption text-ink-faint">
                      <Icon name="globe" className="size-3.5 shrink-0" />
                      <span className="wrap-break-word">
                        {address.phoneNumber}
                      </span>
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </Reveal>
      )}
    </div>
  );
}
