"use client";

import { useEffect, useRef } from "react";

import { BagContents } from "@/components/cart/BagContents";
import { useCart } from "@/components/cart/CartProvider";
import { Icon } from "@/components/ui/Icon";

/**
 * Slide-in bag on a native modal <dialog>: focus trap, Esc and an inert page
 * behind come from the platform. Focus returns to whatever opened it.
 */
export function CartDrawer() {
  const { isOpen, close, count, announcement } = useCart();
  const ref = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<Element | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      returnFocus.current = document.activeElement;
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  return (
    <>
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
      <dialog
        ref={ref}
        className="sheet fixed inset-y-2 right-2 left-auto h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] rounded-3xl shadow-drift sm:w-115"
        aria-labelledby="bag-title"
        onClose={() => {
          close();
          (returnFocus.current as HTMLElement | null)?.focus?.();
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <h2
              id="bag-title"
              className="font-serif text-heading-3"
              tabIndex={-1}
            >
              Your bag{" "}
              {count > 0 && <span className="text-ink-soft">({count})</span>}
            </h2>
            <button
              type="button"
              onClick={close}
              className="grid size-11 place-items-center rounded-xl bg-sand/70 hover:bg-sand"
              aria-label="Close bag"
            >
              <Icon name="close" />
            </button>
          </div>
          {isOpen && <BagContents onNavigate={close} />}
        </div>
      </dialog>
    </>
  );
}
