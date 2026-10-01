import { Cormorant_Garamond, Nunito_Sans } from "next/font/google";

/**
 * Two families, chosen for how they *feel*:
 *
 *  - Cormorant Garamond — a calligraphic, high-contrast serif with soft,
 *    flowing italics. Reads like a handwritten bedtime note; carries every
 *    headline, the wordmark and the product titles.
 *  - Nunito Sans — a humanist sans with gently rounded terminals: calm and
 *    friendly at body sizes, crisp for labels, buttons and prices.
 *
 * Two families instead of a stack of single-role faces keeps the font
 * payload small (both self-hosted by next/font, no runtime request to Google).
 */
export const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--ff-serif",
  display: "swap",
  preload: true,
  fallback: ["Georgia", "Times New Roman", "serif"],
});

export const sans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--ff-sans",
  display: "swap",
  preload: true,
  fallback: ["ui-sans-serif", "system-ui", "Segoe UI", "Helvetica Neue", "sans-serif"],
});

/* Role aliases — every typographic role resolves to one of the two families
   (see the @theme font tokens in globals.css). Kept as exports so existing
   imports keep working without loading anything extra. */
export const ui = sans;
export const numeral = sans;
export const title = serif;
export const logo = serif;
export const pdpHeading = serif;
export const editorialDisplay = serif;
