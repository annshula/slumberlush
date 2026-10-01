import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge only knows Tailwind's built-in scales. Our type scale
 * (`text-heading-2`, `text-body-sm`, …) must be registered as font sizes,
 * otherwise `cn("text-heading-2", "text-milk")` treats both as colours and
 * silently drops the size.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display-xl",
            "display",
            "heading-lg",
            "heading",
            "heading-sm",
            "heading-1",
            "heading-2",
            "heading-3",
            "body-lg",
            "body",
            "body-sm",
            "eyebrow",
            "caption",
            "subheading",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
