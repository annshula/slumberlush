"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Bed-size visualizer: a top-down drawing of a mattress with the chosen
 * blanket laid over it, to scale. Answers "will it cover my bed?" before the
 * shopper has to do the arithmetic. Pure SVG, no images.
 */

export type BlanketSize = {
  key: string;
  label: string;
  /** Inches. */
  width: number;
  length: number;
  weight?: string;
};

const BEDS = [
  { key: "twin", label: "Twin", width: 38, length: 75 },
  { key: "full", label: "Full", width: 54, length: 75 },
  { key: "queen", label: "Queen", width: 60, length: 80 },
  { key: "king", label: "King", width: 76, length: 80 },
] as const;

const SCALE = 2.4; // px per inch inside the SVG viewBox
const PAD = 26;

function verdict(blanket: BlanketSize, bed: (typeof BEDS)[number]): string {
  const side = Math.round((blanket.width - bed.width) / 2);
  if (side >= 8) return `Covers the ${bed.label.toLowerCase()} with about ${side}″ of drape each side — tuck in or let it fall.`;
  if (side >= 0) return `Covers the top of the ${bed.label.toLowerCase()} edge to edge, with a little to tuck.`;
  if (blanket.width >= bed.width * 0.7) return `Sits on top of the ${bed.label.toLowerCase()} as a cosy layer — size up for full coverage.`;
  return `A personal throw: perfect over one person, on the sofa or across the foot of the bed.`;
}

export function SizeVisualizer({
  sizes,
  className,
  tone = "light",
}: {
  sizes: BlanketSize[];
  className?: string;
  tone?: "light" | "dark";
}) {
  const [sizeIdx, setSizeIdx] = useState(Math.min(2, sizes.length - 1));
  const [bedIdx, setBedIdx] = useState(2);
  const blanket = sizes[sizeIdx];
  const bed = BEDS[bedIdx]!;
  if (!blanket) return null;

  const maxW = Math.max(...BEDS.map((b) => b.width), ...sizes.map((s) => s.width));
  const maxL = Math.max(...BEDS.map((b) => b.length), ...sizes.map((s) => s.length)) + 18;
  const vbW = maxW * SCALE + PAD * 2;
  const vbH = maxL * SCALE + PAD * 2;
  const cx = vbW / 2;

  const bedW = bed.width * SCALE;
  const bedL = bed.length * SCALE;
  const bedX = cx - bedW / 2;
  const bedY = PAD + 8;

  const blW = blanket.width * SCALE;
  const blL = blanket.length * SCALE;
  const blX = cx - blW / 2;
  const blY = bedY + 22 * SCALE; // starts below the pillows

  const dark = tone === "dark";

  return (
    <div className={cn("grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14", className)}>
      <div className={cn("relative rounded-media p-4 sm:p-8", dark ? "bg-white/5" : "bg-oat")}>
        <svg viewBox={`0 0 ${vbW} ${vbH}`} role="img" aria-label={`${blanket.label} blanket on a ${bed.label} bed: ${verdict(blanket, bed)}`} className="mx-auto h-auto w-full max-w-md">
          {/* Headboard */}
          <rect x={bedX - 6} y={bedY - 14} width={bedW + 12} height={14} rx={7} className={dark ? "fill-white/15" : "fill-linen"} />
          {/* Mattress */}
          <rect
            x={bedX}
            y={bedY}
            width={bedW}
            height={bedL}
            rx={14}
            className={cn("transition-all duration-700 ease-out-soft", dark ? "fill-white/10 stroke-white/25" : "fill-cloud stroke-linen")}
            strokeWidth={2}
          />
          {/* Pillows */}
          {(bed.width >= 54 ? [-1, 1] : [0]).map((side) => (
            <rect
              key={side}
              x={cx + side * (bedW / 4) - (bed.width >= 54 ? bedW / 2 - 18 : bedW - 24) / 2}
              y={bedY + 10}
              width={bed.width >= 54 ? bedW / 2 - 18 : bedW - 24}
              height={15 * SCALE}
              rx={16}
              className={cn("transition-all duration-700 ease-out-soft", dark ? "fill-white/20" : "fill-sand")}
            />
          ))}
          {/* The blanket */}
          <rect
            x={blX}
            y={blY}
            width={blW}
            height={blL}
            rx={18}
            className={cn("transition-all duration-700 ease-out-soft", dark ? "fill-honey-300/70" : "fill-dusk-300/75")}
            style={{ mixBlendMode: dark ? "screen" : "multiply" }}
          />
          {/* Plush ripples */}
          {Array.from({ length: Math.floor(blanket.length / 12) }, (_, i) => (
            <path
              key={i}
              d={`M ${blX + 14} ${blY + 22 + i * 12 * SCALE} q ${blW / 8} -8 ${blW / 4} 0 t ${blW / 4} 0 t ${blW / 4} 0 t ${blW / 4 - 28} 0`}
              className={cn("fill-none transition-all duration-700", dark ? "stroke-white/30" : "stroke-white/60")}
              strokeWidth={2}
              strokeLinecap="round"
            />
          ))}
        </svg>
        <p className={cn("mt-3 text-center text-[0.78rem]", dark ? "text-moon-100/70" : "text-ink-faint")}>
          Drawn to scale · {blanket.width}″ × {blanket.length}″ on a {bed.width}″ × {bed.length}″ mattress
        </p>
      </div>

      <div>
        <fieldset>
          <legend className={cn("eyebrow", dark && "text-moon-100")}>Blanket size</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {sizes.map((s, i) => (
              <button
                key={s.key}
                type="button"
                aria-pressed={i === sizeIdx}
                onClick={() => setSizeIdx(i)}
                className={cn(
                  "min-h-11 rounded-full px-5 text-body-sm font-bold transition-all duration-300",
                  i === sizeIdx
                    ? dark
                      ? "bg-honey-200 text-night-900"
                      : "bg-dusk-600 text-milk shadow-pillow"
                    : dark
                      ? "bg-white/8 text-moon-100 hover:bg-white/15"
                      : "bg-cloud text-ink shadow-soft hover:shadow-float",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="mt-6">
          <legend className={cn("eyebrow", dark && "text-moon-100")}>Your bed</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {BEDS.map((b, i) => (
              <button
                key={b.key}
                type="button"
                aria-pressed={i === bedIdx}
                onClick={() => setBedIdx(i)}
                className={cn(
                  "min-h-11 rounded-full px-5 text-body-sm font-bold transition-all duration-300",
                  i === bedIdx
                    ? dark
                      ? "bg-moon-100 text-night-900"
                      : "bg-night-900 text-milk"
                    : dark
                      ? "bg-white/8 text-moon-100 hover:bg-white/15"
                      : "bg-cloud text-ink shadow-soft hover:shadow-float",
                )}
              >
                {b.label}
              </button>
            ))}
          </div>
        </fieldset>
        <p aria-live="polite" className={cn("mt-8 font-serif text-heading-2", dark ? "text-milk" : "text-ink")}>
          {verdict(blanket, bed)}
        </p>
        <p className={cn("mt-3 text-body-sm", dark ? "text-moon-100/75" : "text-ink-soft")}>
          {blanket.label}: {blanket.width}″ × {blanket.length}″
          {blanket.weight ? ` · ${blanket.weight}` : ""}
        </p>
      </div>
    </div>
  );
}
