import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { isCustomerAccountConfigured } from "@/lib/shopify/config";
import { isSignedIn } from "@/lib/shopify/guard";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  cancelled: "Sign-in was cancelled. You can try again whenever you are ready.",
  expired: "That sign-in link expired. Please start again.",
  state_mismatch:
    "We could not verify that sign-in request. Please start again.",
  nonce_mismatch:
    "We could not verify that sign-in request. Please start again.",
  exchange_failed:
    "We could not complete the sign-in. Please try again in a moment.",
  missing_code: "The sign-in response was incomplete. Please try again.",
  unconfigured:
    "Sign-in is not connected to the store yet — please check your Shopify settings.",
  provider: "We could not complete the sign-in. Please try again in a moment.",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;

  if (await isSignedIn()) redirect("/account");

  const rawError = Array.isArray(params.error) ? params.error[0] : params.error;
  const errorMessage = rawError
    ? (ERROR_MESSAGES[rawError] ?? ERROR_MESSAGES.provider)
    : null;

  const rawReturnTo = Array.isArray(params.returnTo)
    ? params.returnTo[0]
    : params.returnTo;
  const returnTo =
    rawReturnTo && rawReturnTo.startsWith("/") && !rawReturnTo.startsWith("//")
      ? rawReturnTo
      : "/account";

  return (
    <section className="min-h-[70vh] bg-ivory pt-14 pb-24">
      <div className="container-page relative z-10">
        <div className="mx-auto max-w-md pt-10 text-center">
          <span className="mx-auto mb-6 grid size-16 place-items-center rounded-full bg-blush text-sage-600">
            <Icon name="shield" className="size-7" />
          </span>
          <h1 className="font-serif text-heading-1">
            Sign in
          </h1>
          <p className="mx-auto mt-1 text-body text-ink-soft">
            See your orders, track deliveries and manage your profile. No
            password is stored by this site — sign-in runs through a secure,
            encrypted flow handled by our store provider.
          </p>

          {errorMessage && (
            <div className="mt-6 rounded-panel bg-clay-100 px-5 py-4 text-left">
              <p className="text-body-sm text-sage-700">{errorMessage}</p>
            </div>
          )}

          {!isCustomerAccountConfigured() ? (
            <div className="mt-8 rounded-panel bg-paper px-6 py-8 text-left shadow-soft">
              <p className="font-headline text-lg text-ink">
                Accounts are not connected yet
              </p>
              <p className="mt-2 text-body-sm text-ink-soft">
                Sign-in is not available on this store yet. You can still browse
                and check out as normal.
              </p>
            </div>
          ) : (
            <div className="mt-8">
              <Button
                href={`/account/authorize?returnTo=${encodeURIComponent(returnTo)}`}
                withArrow
                className="w-full justify-center"
              >
                Continue securely
              </Button>
            </div>
          )}

          <div className="mt-8 flex gap-3 rounded-panel bg-paper p-4 text-left shadow-soft">
            <Icon
              name="shield"
              className="mt-0.5 size-5 shrink-0 text-sage-600"
            />
            <p className="text-body-sm leading-relaxed text-ink-soft">
              Sign-in uses a secure, encrypted flow handled by our payment and
              accounts provider. Your credentials never reach this site.
            </p>
          </div>

          <p className="mt-8 text-center text-caption text-ink-faint">
            By continuing you agree to our{" "}
            <Link href="/pages/terms" className="underline underline-offset-4">
              terms
            </Link>{" "}
            and{" "}
            <Link href="/pages/privacy" className="underline underline-offset-4">
              privacy policy
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
