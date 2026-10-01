import Link from "next/link";
import type { ReactNode } from "react";

import { site } from "@/lib/site";

/**
 * Brand and customer-care pages (/pages/[slug]). Legal policies are NOT here —
 * they come verbatim from Shopify (lib/shopify/policies.ts).
 */

export type ContentPage = {
  slug: string;
  title: string;
  description: string;
  eyebrow: string;
  schemaType: "AboutPage" | "ContactPage" | "WebPage" | "FAQPage";
  intro: string;
  body: ReactNode;
  faqs?: { q: string; a: string }[];
};

export const contentPages: ContentPage[] = [
  {
    slug: "about",
    title: "About Slumberlush",
    eyebrow: "Our story",
    description:
      "Slumberlush makes cloud-soft sleep and comfort essentials — plush blankets, weighted blankets, sleepwear, robes and slippers — for slower evenings and deeper rest at home.",
    schemaType: "AboutPage",
    intro:
      "We started with one question: why does the softest thing in most homes get stuffed in a cupboard? Slumberlush makes the pieces you actually want to live in.",
    body: (
      <>
        <h2>What Slumberlush is</h2>
        <p>
          Slumberlush is a sleep and comfort brand. We make the soft things that turn a house into a home — oversized plush
          blankets, hand-knitted weighted blankets, buttery modal sleepwear, plush robes and cloud-cushioned slippers — and
          we&apos;re growing into pillows, bedding, mattress toppers and sleep masks.
        </p>
        <h2>What we believe</h2>
        <p>
          Rest isn&apos;t a luxury; it&apos;s maintenance. The way to make it easier is to make the bed and the sofa the most
          inviting places in the house — with fabrics chosen first for how they feel, sized for real life and easy to
          care for.
        </p>
        <h2>How orders work</h2>
        <p>
          Checkout is handled securely by Shopify. Orders ship with tracking and usually arrive in{" "}
          {site.delivery.minDays}–{site.delivery.maxDays} business days. Not quite right? Return it within{" "}
          {site.returnWindowDays} days. Questions any time:{" "}
          <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>.
        </p>
        <p>
          <Link href="/collections/all">Shop everything</Link> · <Link href="/pages/contact">Contact us</Link>
        </p>
      </>
    ),
  },
  {
    slug: "contact",
    title: "Contact us",
    eyebrow: "Customer care",
    description: "Contact Slumberlush customer care about orders, delivery, sizing, care or returns.",
    schemaType: "ContactPage",
    intro: "Questions about an order, a size or how to care for something? Write to us and a real person will reply.",
    body: (
      <>
        <h2>Email</h2>
        <p>
          <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>
        </p>
        <h2>Helpful to include</h2>
        <ul>
          <li>Your order number (it starts with #) if your question is about an order</li>
          <li>A photo, if something arrived damaged or incorrect</li>
          <li>Your bed or sofa size, if you&apos;d like help choosing a blanket size</li>
        </ul>
        <h2>Order tracking</h2>
        <p>
          Signed-in customers can follow every order from <Link href="/account/orders">Your account → Orders</Link>.
        </p>
      </>
    ),
  },
  {
    slug: "shipping",
    title: "Shipping & delivery",
    eyebrow: "Customer care",
    description: `Slumberlush orders ship with tracking and usually arrive in ${site.delivery.minDays}–${site.delivery.maxDays} business days. Free shipping on orders over $${site.freeShippingThreshold ?? 75}.`,
    schemaType: "WebPage",
    intro: `Every order ships with tracking and usually arrives in ${site.delivery.minDays}–${site.delivery.maxDays} business days.`,
    body: (
      <>
        <h2>Delivery times</h2>
        <p>
          Orders are typically delivered in {site.delivery.minDays}–{site.delivery.maxDays} business days. Estimates can
          vary by destination and during busy periods such as holidays.
        </p>
        <h2>Costs</h2>
        <p>
          {site.freeShippingThreshold
            ? `Shipping is free on orders over $${site.freeShippingThreshold}. `
            : ""}
          Shipping options and costs for your address are shown at checkout before you pay.
        </p>
        <h2>Tracking</h2>
        <p>
          You&apos;ll receive tracking details by email once your order ships, and signed-in customers can follow it from{" "}
          <Link href="/account/orders">Your account</Link>.
        </p>
        <h2>Something wrong with your delivery?</h2>
        <p>
          Contact us at <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a> with your order number and
          we&apos;ll help. See also our <Link href="/pages/refund-policy">refund policy</Link>.
        </p>
      </>
    ),
  },
  {
    slug: "accessibility",
    title: "Accessibility",
    eyebrow: "Our commitment",
    description: "Slumberlush's accessibility statement: our target of WCAG 2.2 AA and how to report a barrier.",
    schemaType: "WebPage",
    intro: "We want everyone to be able to shop at Slumberlush comfortably.",
    body: (
      <>
        <h2>Our target</h2>
        <p>
          This site is designed and tested against the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA:
          keyboard access throughout, visible focus, sufficient colour contrast, descriptive image text and respect for
          reduced-motion settings.
        </p>
        <h2>Found a barrier?</h2>
        <p>
          Please tell us at <a href={`mailto:${site.supportEmail}?subject=Accessibility`}>{site.supportEmail}</a> —
          include the page and what happened. We&apos;ll respond and fix what we can.
        </p>
      </>
    ),
  },
];

export function contentPageBySlug(slug: string): ContentPage | undefined {
  return contentPages.find((p) => p.slug === slug);
}

/** Shopify-managed legal pages: slug → policy key. */
export const policyPages = {
  "refund-policy": { key: "refundPolicy", title: "Refund policy" },
  "privacy-policy": { key: "privacyPolicy", title: "Privacy policy" },
  "terms-of-service": { key: "termsOfService", title: "Terms of service" },
} as const;
