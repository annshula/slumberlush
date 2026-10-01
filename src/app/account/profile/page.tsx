import type { Metadata } from "next";

import { AccountHeader } from "@/components/account/AccountHeader";
import { ProfileForm } from "@/components/account/ProfileForm";
import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";
import { getCustomer } from "@/lib/shopify/customer-service";
import { requireCustomer } from "@/lib/shopify/guard";

export const metadata: Metadata = {
  title: "Your profile",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  await requireCustomer("/account/profile");
  const customer = await getCustomer();

  return (
    <div className="min-w-0">
      <AccountHeader
        title="Profile"
        body="How we address you on orders, deliveries and every note in between."
        crumbs={[{ label: "Profile" }]}
      />

      <Reveal
        as="div"
        variant="up"
        stagger={0.08}
        className="mt-10 grid gap-6 lg:max-w-2xl"
      >
        <ProfileForm
          firstName={customer.firstName}
          lastName={customer.lastName}
        />

        <div className="rounded-panel bg-paper p-6 shadow-soft">
          <h2 className="font-serif text-heading-sm text-ink uppercase">
            Contact details
          </h2>
          <p className="mt-2 text-body-sm text-ink-soft">
            Managed by your secure customer account.
          </p>

          <dl className="mt-6 flex flex-col text-body-sm">
            <div className="flex items-center justify-between gap-4 py-3 first:pt-0">
              <dt className="flex items-center gap-2.5 text-ink-soft">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blush text-sage-600">
                  <Icon name="user" className="size-4" />
                </span>
                Email
              </dt>
              <dd className="min-w-0 truncate font-headline text-ink">
                {customer.emailAddress ?? "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3 last:pb-0">
              <dt className="flex items-center gap-2.5 text-ink-soft">
                <span className="grid size-9 shrink-0 place-items-center rounded-[12px] bg-cream text-ink-soft">
                  <Icon name="globe" className="size-4" />
                </span>
                Phone
              </dt>
              <dd className="min-w-0 truncate font-headline text-ink">
                {customer.phoneNumber ?? "—"}
              </dd>
            </div>
          </dl>

          <p className="mt-5 flex gap-2.5 rounded-tag bg-cream px-4 py-3 text-caption text-ink-faint">
            <Icon
              name="shield"
              className="mt-0.5 size-4 shrink-0 text-sage-600"
            />
            Email and phone change through a verified flow handled by our
            accounts provider.
          </p>
        </div>
      </Reveal>
    </div>
  );
}
