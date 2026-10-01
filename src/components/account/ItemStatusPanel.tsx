"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { Icon } from "@/components/ui/Icon";
import { useScrollLock } from "@/lib/scroll-lock";

/**
 * Opens one item's full status on its own surface: a bottom sheet on a phone,
 * a centred dialog from md up. The status stopped fitting on the card the
 * moment a return added milestones to it — a timeline squeezed into a 300px
 * row is a worse answer than a tap.
 *
 * Everything visible is passed in already rendered on the server; this
 * component owns nothing but the open state and the portal.
 */
export function ItemStatusPanel({
  face,
  label,
  children,
}: {
  /** The card's own contents, rendered by the server component. */
  face: ReactNode;
  /** Accessible name for the trigger and the dialog. */
  label: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${label} — see full status`}
        /* `touch-manipulation` drops the 300ms tap delay, and the press state
           gives a phone the feedback a hover state gives a mouse — without it
           the row feels dead until the sheet arrives. */
        className="group relative w-full cursor-pointer touch-manipulation overflow-hidden rounded-panel bg-paper text-left shadow-soft transition-[,box-shadow,background-color,transform] duration-500 ease-out-soft hover:shadow-drift focus-visible:outline-none active:scale-[0.995] active:bg-cream active:duration-100"
      >
        {face}
      </button>

      {/*
        Portalled to <body>. The account section sets `clip-path` to let its
        blobs bleed behind the nav, and a clip-path on an ancestor clips fixed
        children too — rendered in place this panel would be trapped inside the
        account column no matter its z-index. z-85 sits above the header and
        the cart drawer, below the sign-out dialog.
      */}
      {open &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-85 flex items-end justify-center md:items-center md:p-6">
            <div
              aria-hidden="true"
              onClick={() => setOpen(false)}
              className="sheet-scrim absolute inset-0 bg-ink/45 backdrop-blur-[3px]"
            />

            <div
              role="dialog"
              aria-modal="true"
              aria-label={label}
              className="status-panel relative flex max-h-[88svh] w-full flex-col overflow-hidden rounded-t-[1.75rem] bg-paper pb-[env(safe-area-inset-bottom)] shadow-drift md:max-h-[80vh] md:max-w-3xl md:rounded-panel md:pb-0"
            >
              {/* The grab handle is the sheet's own dismiss control, not just
                  decoration: it says "this can be dismissed" before anyone
                  reads a word, and on a phone that reaches the thumb far more
                  easily than a corner X does. A tall sheet leaves little scrim
                  to tap, so it has to be tappable itself. */}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="group/handle grid shrink-0 cursor-pointer touch-manipulation place-items-center py-3 md:hidden"
              >
                <span
                  aria-hidden="true"
                  className="h-1 w-11 rounded-pill bg-sand transition-colors duration-300 group-active/handle:bg-sage-300"
                />
              </button>

              {/* The dialog gets the corner X instead — a pointer has no
                  trouble with it, and there is no handle to grab. */}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="absolute top-4 right-4 z-10 hidden size-11 place-items-center rounded-full text-ink-soft transition-colors duration-300 hover:bg-blush hover:text-sage-600 md:grid"
              >
                <Icon name="close" className="size-4" strokeWidth={2.2} />
              </button>

              {children}
            </div>
          </div>,
          document.body,
        )}
    </li>
  );
}
