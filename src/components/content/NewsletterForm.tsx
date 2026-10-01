"use client";

import { useActionState, useId } from "react";

import { subscribeNewsletter, type NewsletterState } from "@/app/actions/newsletter";
import { cn } from "@/lib/utils";

const initial: NewsletterState = { status: "idle", message: "" };

export function NewsletterForm({ compact = false, tone = "light" }: { compact?: boolean; tone?: "light" | "dark" }) {
  const [state, action, pending] = useActionState(subscribeNewsletter, initial);
  const id = useId();
  const dark = tone === "dark";

  return (
    <form action={action} noValidate aria-describedby={`${id}-msg`}>
      <label htmlFor={`${id}-email`} className={cn(compact ? "eyebrow" : "text-body-sm font-medium")}>
        {compact ? "Bedtime letters" : "Email address"}
      </label>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          aria-invalid={state.status === "error" || undefined}
          className={cn(
            "field min-w-0 flex-1",
            dark && "bg-white/10 text-ivory shadow-none placeholder:text-sage-300 focus:shadow-[inset_0_0_0_2px_var(--color-sage-200)]",
          )}
        />
        {/* honeypot */}
        <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
        <button
          type="submit"
          className={cn(dark ? "btn-secondary bg-ivory hover:bg-cream" : "btn-primary", "shrink-0")}
          disabled={pending}
        >
          {pending ? "Joining…" : "Subscribe"}
        </button>
      </div>
      <p
        id={`${id}-msg`}
        role={state.status === "error" ? "alert" : "status"}
        className={cn(
          "mt-3 min-h-5 text-body-sm",
          state.status === "error" ? (dark ? "text-clay-200" : "text-error") : dark ? "text-sage-200" : "text-ink-soft",
        )}
      >
        {state.message || "Unsubscribe anytime. No spam, no discount games."}
      </p>
    </form>
  );
}
