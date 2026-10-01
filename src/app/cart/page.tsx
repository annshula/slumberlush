import type { Metadata } from "next";

import { BagContents } from "@/components/cart/BagContents";

export const metadata: Metadata = {
  title: "Your bag",
  robots: { index: false, follow: false },
};

/** Full-page bag (no-JS-friendly fallback for the drawer). */
export default function CartPage() {
  return (
    <div className="container-page max-w-2xl pt-10 pb-24">
      <h1 className="text-center font-serif text-display font-normal lg:text-left">
        Your bag
      </h1>
      <div className="mt-8 flex min-h-80 flex-col rounded-media bg-cream p-2">
        <BagContents />
      </div>
    </div>
  );
}
