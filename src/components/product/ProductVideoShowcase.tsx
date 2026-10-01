"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * Product video row, above "The details" — a full-bleed, auto-drifting rail
 * of portrait tiles. A native `overflow-x-auto` list (not a CSS transform
 * marquee), so it can also be dragged or flicked by hand; a rAF loop nudges
 * `scrollLeft` while idle and turns around at either end rather than
 * wrapping, so nothing here needs a duplicated list of cards.
 *
 * Every tile autoplays muted + looped, but only while it is actually on
 * screen (each card's own IntersectionObserver) — the row renders every card
 * up front, so an unconditional autoplay would start all 8 clips' network
 * load and decode at once.
 */

/**
 * A clip, or — until clips are recorded — a still with a slow drift. Drop
 * MP4s into `public/videos/<product-handle>/` and list them in the PDP route;
 * tiles without a `src` render as moving photo cards with a caption.
 */
export type ShowcaseVideo = {
  src?: string;
  poster?: string;
  alt: string;
  /** Small caption chip on the tile, e.g. "Sofa nights". */
  caption?: string;
};

/** Drift speed, px/second. Slow enough to read a card as it goes past. */
const SPEED_PX_PER_S = 26;

/** px of travel before a press becomes a drag instead of a click. */
const DRAG_THRESHOLD = 5;

export function ProductVideoShowcase({
  videos,
  className,
}: {
  videos: ShowcaseVideo[];
  className?: string;
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [dragging, setDragging] = useState(false);

  /** Held in refs, not state: pausing is per-frame input to the drift loop and
      must not re-render the row every time a cursor crosses it. */
  const pausedRef = useRef(false);
  const dirRef = useRef<1 | -1>(1);
  const resumeTimer = useRef<number | null>(null);
  /**
   * Mouse drag only — touch and trackpad already pan an `overflow-x-auto`
   * list natively. Pointer capture is taken on movement, never on
   * `pointerdown`: capturing on the way down would retarget the click that
   * follows to this <ul>, silently swallowing a tap on the play area. A few
   * pixels of travel decide it — under the threshold the tap goes through,
   * over it the row takes the drag.
   */
  const dragRef = useRef<{ id: number; x: number; left: number; moved: boolean } | null>(null);

  const pause = useCallback(() => {
    if (resumeTimer.current !== null) window.clearTimeout(resumeTimer.current);
    resumeTimer.current = null;
    pausedRef.current = true;
  }, []);

  /** Pause, then pick the drift back up on its own — used after a drag, a
      wheel or the pointer leaving, where holding the pause forever would
      leave the row parked. */
  const pauseThenResume = useCallback((ms: number) => {
    if (resumeTimer.current !== null) window.clearTimeout(resumeTimer.current);
    pausedRef.current = true;
    resumeTimer.current = window.setTimeout(() => {
      resumeTimer.current = null;
      pausedRef.current = false;
    }, ms);
  }, []);

  useEffect(
    () => () => {
      if (resumeTimer.current !== null) window.clearTimeout(resumeTimer.current);
    },
    [],
  );

  useEffect(() => {
    const track = trackRef.current;
    if (videos.length === 0 || !track) return;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) return;

    let frame = 0;
    let last: number | null = null;
    /** An off-screen row doesn't need to move — an idle rAF loop writing to a
        scroll container is exactly the kind of thing that shows up in a long
        task trace on a low-end phone. */
    let onScreen = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry!.isIntersecting;
      },
      { rootMargin: "240px" },
    );
    observer.observe(track);

    const tick = (nowMs: number) => {
      frame = requestAnimationFrame(tick);
      const elapsed = last === null ? 16 : Math.min(nowMs - last, 64);
      last = nowMs;
      if (pausedRef.current || !onScreen || document.hidden) return;

      const max = track.scrollWidth - track.clientWidth;
      if (max <= 8) return;

      let next = track.scrollLeft + dirRef.current * SPEED_PX_PER_S * (elapsed / 1000);
      if (next >= max) {
        next = max;
        dirRef.current = -1;
      } else if (next <= 0) {
        next = 0;
        dirRef.current = 1;
      }
      track.scrollLeft = next;
    };

    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [videos.length]);

  if (videos.length === 0) return null;

  const onPointerDown = (e: ReactPointerEvent<HTMLUListElement>) => {
    const track = trackRef.current;
    if (!track || e.pointerType !== "mouse" || e.button !== 0) return;
    dragRef.current = { id: e.pointerId, x: e.clientX, left: track.scrollLeft, moved: false };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLUListElement>) => {
    const track = trackRef.current;
    const drag = dragRef.current;
    if (!track || !drag || drag.id !== e.pointerId) return;

    const dx = e.clientX - drag.x;
    if (!drag.moved) {
      if (Math.abs(dx) < DRAG_THRESHOLD) return;
      drag.moved = true;
      track.setPointerCapture(e.pointerId);
      setDragging(true);
      pause();
    }
    track.scrollLeft = drag.left - dx;
  };

  const endDrag = (e: ReactPointerEvent<HTMLUListElement>) => {
    const track = trackRef.current;
    const drag = dragRef.current;
    if (!track || !drag || drag.id !== e.pointerId) return;
    dragRef.current = null;
    if (!drag.moved) return;
    if (track.hasPointerCapture(e.pointerId)) track.releasePointerCapture(e.pointerId);
    setDragging(false);
    pauseThenResume(1600);
  };

  return (
    <div className={cn("relative", className)}>
      <ul
        ref={trackRef}
        aria-label="Product videos"
        className={cn(
          "flex cursor-grab gap-4 overflow-x-auto overscroll-x-contain pb-2 select-none scrollbar-none",
          dragging && "cursor-grabbing",
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDragStart={(e) => e.preventDefault()}
        onPointerEnter={pause}
        onPointerLeave={() => {
          if (!dragRef.current) pauseThenResume(400);
        }}
        onWheel={() => pauseThenResume(1600)}
        onFocus={pause}
        onBlur={() => pauseThenResume(400)}
      >
        {videos.map((video, i) => (
          <li key={video.src ?? `${video.poster}-${i}`} className="h-88 w-64 shrink-0 sm:h-96 sm:w-72">
            {video.src ? <VideoCard video={video} /> : <StillCard video={video} index={i} />}
          </li>
        ))}
      </ul>

      {/* Edge fades say the row continues past what's visible. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-linear-to-r from-ivory to-transparent sm:w-12"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-linear-to-l from-ivory to-transparent sm:w-12"
      />
    </div>
  );
}

/** Photo stand-in for a clip: lazy image with a slow Ken Burns drift (CSS only). */
function StillCard({ video, index }: { video: ShowcaseVideo; index: number }) {
  return (
    <figure className="relative size-full overflow-hidden rounded-media bg-sage-900">
      {video.poster && (
        <Image
          src={video.poster}
          alt={video.alt}
          fill
          sizes="288px"
          draggable={false}
          className={cn("kenburns object-cover", index % 2 === 1 && "[animation-direction:alternate-reverse]")}
        />
      )}
      <span aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-sage-900/60 via-transparent to-transparent" />
      {video.caption && (
        <figcaption className="absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-full bg-porcelain/90 px-3 py-1.5 font-ui text-[0.75rem] font-medium text-ink backdrop-blur">
          <span className="size-1.5 rounded-full bg-clay-600" aria-hidden="true" />
          {video.caption}
        </figcaption>
      )}
    </figure>
  );
}

function VideoCard({ video }: { video: ShowcaseVideo }) {
  const ref = useRef<HTMLVideoElement>(null);

  // Play only while the card is actually visible — the row renders every
  // card up front (no virtualization), so an unconditional autoplay would
  // start every clip's decode/network load at once.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry!.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative size-full overflow-hidden rounded-media bg-ink">
      <video
        ref={ref}
        className="size-full object-cover"
        poster={video.poster}
        preload="metadata"
        muted
        loop
        playsInline
        aria-label={video.alt}
      >
        <source src={video.src} type="video/mp4" />
      </video>
    </div>
  );
}
