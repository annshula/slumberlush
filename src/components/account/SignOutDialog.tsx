"use client";

import { useEffect, useRef, useState } from "react";

import { Icon } from "@/components/ui/Icon";

/**
 * Sign-out confirmation on a native <dialog> (focus trap, Esc and inert
 * background come from the platform). "Stay signed in" is the default action,
 * because signing out revokes the Shopify tokens.
 */
export function SignOutDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="signout-title"
      className="sheet m-auto w-[min(92vw,420px)] p-8 shadow-drift"
    >
      <h2 id="signout-title" className="font-serif text-heading-2">
        Sign out?
      </h2>
      <p className="mt-3 text-body-sm text-ink-soft">
        You&apos;ll need to sign in again to see your orders. Your bag stays on this device.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row-reverse">
        <button type="button" autoFocus className="btn-primary flex-1" onClick={onClose}>
          Stay signed in
        </button>
        <a
          href="/account/logout"
          className="btn-outline flex-1"
          aria-disabled={leaving}
          onClick={() => setLeaving(true)}
        >
          {leaving ? "Signing out…" : "Sign out"}
        </a>
      </div>
    </dialog>
  );
}

/** Shared label + icon for every sign-out trigger. */
export function SignOutLabel() {
  return (
    <>
      <Icon name="logout" className="size-4 shrink-0" />
      Sign out
    </>
  );
}
