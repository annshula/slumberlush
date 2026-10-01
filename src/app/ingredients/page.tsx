import { permanentRedirect } from "next/navigation";

/** Leftover route from the reference template — Slumberlush has no ingredient pages. Safe to delete this folder. */
export default function IngredientsIndex() {
  permanentRedirect("/guides");
}
