"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  trackAddToCart,
  trackBeginCheckout,
  trackRemoveFromCart,
  type AnalyticsItem,
} from "@/lib/analytics";
import { useLocalization } from "@/components/localization/LocalizationProvider";
import { getExternalId } from "@/lib/ad-identity";

/**
 * The bag (same model as the reference storefront): lines live in
 * localStorage as { variantId, quantity } only. Names, labels and prices are
 * looked up in the server-provided `bagCatalog`, so a stale browser can never
 * show or submit a price — and Shopify re-prices everything when the checkout
 * cart is created server-side (/api/cart/checkout).
 */

export type BagVariant = {
  productName: string;
  variantLabel: string;
  price: number;
  image: string | null;
  href: string;
  available: boolean;
  /** True when the product's variants are pack sizes (buying more means picking a bigger pack, not a stepper). */
  hasPackOption: boolean;
};

export type BagCatalog = { currency: string; variants: Record<string, BagVariant> };

export type BagLine = { variantId: string; quantity: number };
export type ResolvedLine = BagLine & BagVariant & { lineTotal: number };

const STORAGE_KEY = "slumberlush.bag.v1";
const MAX_QTY = 10;

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]!) : null;
}

type CartContextValue = {
  lines: ResolvedLine[];
  count: number;
  subtotal: number;
  currency: string;
  isOpen: boolean;
  hydrated: boolean;
  open: () => void;
  close: () => void;
  add: (variantId: string, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  checkout: () => Promise<{ ok: true } | { ok: false; error: string }>;
  announcement: string;
};

const CartContext = createContext<CartContextValue | null>(null);

function readStored(): BagLine[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (l): l is BagLine =>
          typeof l?.variantId === "string" && Number.isInteger(l?.quantity) && l.quantity > 0,
      )
      .slice(0, 20);
  } catch {
    return [];
  }
}

function toItem(line: ResolvedLine | (BagVariant & { variantId: string }), quantity: number): AnalyticsItem {
  return {
    id: line.variantId,
    name: line.productName,
    variant: line.variantLabel,
    price: line.price,
    quantity,
  };
}

export function CartProvider({ catalog, children }: { catalog: BagCatalog; children: ReactNode }) {
  const [raw, setRaw] = useState<BagLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const { localizedPriceFor, requestPrices } = useLocalization();

  useEffect(() => {
    setRaw(readStored());
    setHydrated(true);
    const sync = (e: StorageEvent) => e.key === STORAGE_KEY && setRaw(readStored());
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
    } catch {
      /* private mode / quota — the bag still works for this tab */
    }
  }, [raw, hydrated]);

  // Live-priced in the visitor's currency once localization resolves, same
  // overlay the PDP uses — otherwise the bag would show base-currency prices
  // to a shopper who has been looking at localized ones the whole time.
  useEffect(() => {
    requestPrices(raw.map((l) => l.variantId));
  }, [raw, requestPrices]);

  // Lines whose variant no longer exists in the catalog are dropped silently.
  const lines = useMemo<ResolvedLine[]>(
    () =>
      raw.flatMap((l) => {
        const v = catalog.variants[l.variantId];
        if (!v) return [];
        const live = localizedPriceFor(l.variantId);
        const liveAmount = live ? Number.parseFloat(live.amount) : NaN;
        const price = Number.isFinite(liveAmount) ? liveAmount : v.price;
        return [{ ...l, ...v, price, lineTotal: Math.round(price * l.quantity * 100) / 100 }];
      }),
    [raw, catalog, localizedPriceFor],
  );

  // Shopify localizes every line into one currency together, so the first
  // resolved line's currency (if any) speaks for the whole bag.
  const currency =
    raw
      .map((l) => localizedPriceFor(l.variantId)?.currencyCode)
      .find((c): c is string => Boolean(c)) ?? catalog.currency;

  const count = lines.reduce((n, l) => n + l.quantity, 0);
  const subtotal = Math.round(lines.reduce((s, l) => s + l.lineTotal, 0) * 100) / 100;

  const add = useCallback(
    (variantId: string, quantity = 1) => {
      const v = catalog.variants[variantId];
      if (!v || !v.available) return;
      setRaw((prev) => {
        const existing = prev.find((l) => l.variantId === variantId);
        if (existing) {
          return prev.map((l) =>
            l.variantId === variantId ? { ...l, quantity: Math.min(MAX_QTY, l.quantity + quantity) } : l,
          );
        }
        return [...prev, { variantId, quantity: Math.min(MAX_QTY, quantity) }];
      });
      const live = localizedPriceFor(variantId);
      const liveAmount = live ? Number.parseFloat(live.amount) : NaN;
      const price = Number.isFinite(liveAmount) ? liveAmount : v.price;
      trackAddToCart(toItem({ ...v, variantId, price }, quantity), live?.currencyCode ?? catalog.currency);
      setAnnouncement(`Added to bag: ${v.productName}, ${v.variantLabel}.`);
      setOpen(true);
    },
    [catalog, localizedPriceFor],
  );

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    const q = Math.max(0, Math.min(MAX_QTY, Math.round(quantity)));
    setRaw((prev) =>
      q === 0 ? prev.filter((l) => l.variantId !== variantId) : prev.map((l) => (l.variantId === variantId ? { ...l, quantity: q } : l)),
    );
  }, []);

  const remove = useCallback(
    (variantId: string) => {
      const line = lines.find((l) => l.variantId === variantId);
      if (line) {
        trackRemoveFromCart(toItem(line, line.quantity), currency);
        setAnnouncement(`Removed from bag: ${line.productName}.`);
      }
      setRaw((prev) => prev.filter((l) => l.variantId !== variantId));
    },
    [lines, currency],
  );

  const checkout = useCallback(async (): Promise<{ ok: true } | { ok: false; error: string }> => {
    if (lines.length === 0) return { ok: false, error: "Your bag is empty." };
    try {
      // Meta's click-id / browser-id cookies, when the Pixel has loaded and
      // set them, plus a stable per-browser id (lib/ad-identity.ts) — all
      // carried through Shopify as cart attributes so the orders/paid
      // webhook's server-side Purchase event can include them. Without these,
      // that event has no fbc/fbp/external_id at all (there is no
      // browser-side Purchase pixel to fall back on; see route.ts).
      const fbc = readCookie("_fbc");
      const fbp = readCookie("_fbp");
      const externalId = getExternalId();
      const res = await fetch("/api/cart/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: lines.map(({ variantId, quantity }) => ({ variantId, quantity })),
          ...(fbc || fbp || externalId ? { meta: { fbc, fbp, externalId } } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { checkoutUrl?: string; error?: string };
      if (!res.ok || !data.checkoutUrl) {
        return { ok: false, error: data.error ?? "We couldn't start checkout. Please try again." };
      }
      trackBeginCheckout(lines.map((l) => toItem(l, l.quantity)), currency);
      window.location.assign(data.checkoutUrl);
      return { ok: true };
    } catch {
      return { ok: false, error: "We couldn't reach checkout. Check your connection and try again." };
    }
  }, [lines, currency]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count,
      subtotal,
      currency,
      isOpen,
      hydrated,
      open: () => setOpen(true),
      close: () => setOpen(false),
      add,
      setQuantity,
      remove,
      checkout,
      announcement,
    }),
    [lines, count, subtotal, currency, isOpen, hydrated, add, setQuantity, remove, checkout, announcement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
