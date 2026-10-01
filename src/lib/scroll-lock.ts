"use client";

import { useEffect } from "react";

/**
 * One scroll lock for every overlay on the site.
 *
 * Two things made the page keep scrolling behind an open panel:
 *
 *  1. Lenis drives scrolling by listening to wheel/touch and calling
 *     `window.scrollTo` itself. `overflow: hidden` on <body> does not reach it,
 *     so the page carried on moving under the drawer. The instance is
 *     registered here and stopped for the duration of the lock.
 *
 *  2. The header drawer, the cart and the sign-out dialog each wrote
 *     `document.body.style.overflow` directly. Opening the cart from the drawer
 *     and closing the drawer released the lock while the cart was still up.
 *     Locks are counted instead, so scrolling only resumes when the last
 *     overlay closes.
 */

type Stoppable = { stop: () => void; start: () => void };

let lenis: Stoppable | null = null;
let locks = 0;
let restore: { overflow: string; paddingRight: string } | null = null;

/** Called once by SmoothScrollProvider so the lock can pause inertial scroll. */
export function registerScrollLockTarget(instance: Stoppable | null) {
  lenis = instance;
}

function lock() {
  locks += 1;
  if (locks > 1) return;

  const root = document.documentElement;
  // Reserve the scrollbar's width so the page does not jump sideways when it
  // disappears — the fixed header would visibly shift otherwise.
  const scrollbar = window.innerWidth - root.clientWidth;

  restore = {
    overflow: document.body.style.overflow,
    paddingRight: document.body.style.paddingRight,
  };

  root.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
  if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;

  lenis?.stop();
}

function unlock() {
  locks = Math.max(0, locks - 1);
  if (locks > 0) return;

  document.documentElement.style.overflow = "";
  document.body.style.overflow = restore?.overflow ?? "";
  document.body.style.paddingRight = restore?.paddingRight ?? "";
  restore = null;

  lenis?.start();
}

/**
 * Holds the page still while `active` is true, releasing on unmount so a panel
 * that disappears mid-transition can never strand the lock.
 */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    lock();
    return unlock;
  }, [active]);
}
