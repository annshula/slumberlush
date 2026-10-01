"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Slide } from "yet-another-react-lightbox";

import { VideoTile } from "@/components/product/VideoTile";
import { Icon } from "@/components/ui/Icon";
import type { ViewMedia } from "@/lib/commerce/product-view";
import { cn } from "@/lib/utils";

const GalleryLightbox = dynamic(() => import("@/components/product/GalleryLightbox"), {
  ssr: false,
});

/** Horizontal travel before a touch gesture counts as a swipe rather than a tap. */
const SWIPE_THRESHOLD = 40;

/**
 * PDP gallery — sticky stage with the thumbnails beside it from lg up (a
 * vertical rail on the stage's left) and beneath it on phones (a horizontal
 * rail, as before).
 *
 *  - The stage is a native horizontally scroll-snapped track (scrollTo +
 *    snap-x), not a manually computed transform — the browser's own
 *    scroll/compositing engine drives the transition, so a slide can never
 *    render blank mid-animation the way a hand-rolled translate3d can.
 *  - Touch is tracked ourselves only to stop a fast flick from carrying
 *    momentum through more than one slide (native snap only guarantees
 *    landing *on* a snap point, not the *next* one); the arrows, ←/→ keys and
 *    the thumbnail rail scroll straight to a slide.
 *  - From lg up the column is `--gallery-h` tall and sticks to the middle of
 *    the viewport, so it stays level with the purchase panel as you scroll.
 *  - The first slide is server-rendered with `priority`, so the LCP image
 *    never waits for JS; every other slide shows a spinner over its reserved
 *    space until it has actually painted a frame.
 *  - Choosing a set in the purchase panel (`bl:variant` event) brings that
 *    set's photo to the stage.
 */
export function ProductGallery({
  media: allMedia,
  productName,
  fit = "contain",
  initialGroup = null,
}: {
  /** "flush": the whole photo, uncropped, with no tinted panel or padding around it. */
  fit?: "contain" | "flush" | "cover";
  media: ViewMedia[];
  productName: string;
  /** Colour shown first; the gallery then follows the purchase panel's swatch. */
  initialGroup?: string | null;
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const thumbsRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const [group, setGroup] = useState<string | null>(initialGroup?.toLowerCase() ?? null);

  /* Only the chosen colour's photos (plus any untagged shots/videos); every
     photo when nothing matches, so the gallery is never empty. */
  const media = useMemo(() => {
    if (!group) return allMedia;
    const matched = allMedia.filter(
      (m) => m.type === "video" || m.group === group || m.group === null,
    );
    return matched.some((m) => m.type === "image" && m.group === group) ? matched : allMedia;
  }, [allMedia, group]);
  const [zoomAt, setZoomAt] = useState<number | null>(null);
  const count = media.length;

  /** Which slide indices have actually painted a frame — everything else shows a spinner over its reserved space. */
  const [loaded, setLoaded] = useState<Set<number>>(() => new Set());
  const markLoaded = useCallback(
    (i: number) => setLoaded((prev) => (prev.has(i) ? prev : new Set(prev).add(i))),
    [],
  );

  const slides: Slide[] = useMemo(
    () =>
      media.map((m) =>
        m.type === "image"
          ? { src: m.url, alt: m.alt, width: m.width, height: m.height }
          : {
              type: "video" as const,
              poster: m.poster,
              width: m.width,
              height: m.height,
              sources: m.sources.map((s) => ({ src: s.src, type: s.type })),
            },
      ),
    [media],
  );

  const goTo = useCallback(
    (index: number, smooth = true) => {
      const track = trackRef.current;
      if (!track) return;
      const i = Math.max(0, Math.min(count - 1, index));
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      track.scrollTo({ left: i * track.clientWidth, behavior: smooth && !reduce ? "smooth" : "auto" });
      setActive(i);
    },
    [count],
  );

  // Track the visible slide as the user scrolls/swipes the track directly
  // (trackpad, mouse wheel, or a swipe that native snap already resolved).
  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const index = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
    if (index !== active) setActive(index);
  };

  /*
   * Native scroll-snap only guarantees landing *on* a snap point, not the
   * *next* one — a fast flick can carry momentum through more than one
   * slide. Tracking touch ourselves and always stepping by exactly one slide
   * keeps a swipe to one image per gesture, like a native app carousel.
   */
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);

  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch || count < 2) return;
    touchStart.current = { x: touch.clientX, y: touch.clientY };
    dragging.current = false;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const start = touchStart.current;
    const touch = e.touches[0];
    if (!start || !touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (!dragging.current && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
      dragging.current = true;
    }
    if (dragging.current) e.preventDefault();
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    const touch = e.changedTouches[0];
    touchStart.current = null;
    if (!start || !touch || !dragging.current) return;
    dragging.current = false;
    const dx = touch.clientX - start.x;
    if (dx <= -SWIPE_THRESHOLD) goTo(active + 1);
    else if (dx >= SWIPE_THRESHOLD) goTo(active - 1);
  };

  // Keep the active thumbnail in view — scroll the rail only, never the page.
  // The rail is horizontal on phones and vertical from lg up, so the axis is
  // read from the rail itself instead of assumed.
  useEffect(() => {
    const rail = thumbsRef.current;
    const thumb = rail?.children[active] as HTMLElement | undefined;
    if (!rail || !thumb) return;
    const railBox = rail.getBoundingClientRect();
    const box = thumb.getBoundingClientRect();
    if (rail.scrollHeight > rail.clientHeight + 1) {
      if (box.top < railBox.top)
        rail.scrollBy({ top: box.top - railBox.top - 8, behavior: "smooth" });
      else if (box.bottom > railBox.bottom)
        rail.scrollBy({
          top: box.bottom - railBox.bottom + 8,
          behavior: "smooth",
        });
    } else {
      if (box.left < railBox.left)
        rail.scrollBy({
          left: box.left - railBox.left - 8,
          behavior: "smooth",
        });
      else if (box.right > railBox.right)
        rail.scrollBy({
          left: box.right - railBox.right + 8,
          behavior: "smooth",
        });
    }
  }, [active]);

  // Colour chosen in the purchase panel → swap to that colour's photos;
  // otherwise bring the chosen variant's own photo to the stage.
  useEffect(() => {
    const onVariant = (e: Event) => {
      const detail = (e as CustomEvent<{ variantId: string; group?: string | null }>).detail;
      const nextGroup = detail?.group?.toLowerCase() ?? null;
      if (nextGroup && nextGroup !== group) {
        setGroup(nextGroup);
        return;
      }
      const index = media.findIndex(
        (m) => m.type === "image" && m.variantId === detail?.variantId,
      );
      if (index >= 0) goTo(index);
    };
    window.addEventListener("bl:variant", onVariant);
    return () => window.removeEventListener("bl:variant", onVariant);
  }, [media, goTo, group]);

  // A new colour starts from its first photo. Skipped on mount, so the
  // server-rendered LCP photo's load state is never wiped.
  const firstGroupRun = useRef(true);
  useEffect(() => {
    if (firstGroupRun.current) {
      firstGroupRun.current = false;
      return;
    }
    trackRef.current?.scrollTo({ left: 0, behavior: "auto" });
    setActive(0);
    setLoaded(new Set());
  }, [group]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label={`${productName} images and video`}
      /* Stuck to the middle of the viewport: the stage is `--gallery-h` tall,
         so half of what is left over sits above it and half below. */
      className="min-w-0 lg:sticky lg:top-[calc((100svh-var(--gallery-h))/2)] lg:self-start"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") goTo(active + 1);
        if (e.key === "ArrowLeft") goTo(active - 1);
      }}
    >
      {/* Reversed on lg so the rail — which stays after the stage in the DOM,
          keeping the stage first for keyboard and screen-reader order — lands
          to its left. */}
      <div className="flex flex-col gap-3 lg:flex-row-reverse lg:gap-4">
        <div className="group/stage relative min-w-0 flex-1">
          <ul
            ref={trackRef}
            onScroll={onScroll}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            className="scrollbar-none flex snap-x snap-mandatory touch-pan-y overflow-x-auto overscroll-x-contain rounded-media [&::-webkit-scrollbar]:hidden"
            aria-live="polite"
          >
            {media.map((item, i) => (
              <li
                key={i}
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${count}`}
                aria-hidden={i !== active}
                className="w-full shrink-0 snap-center"
              >
                {item.type === "image" ? (
                  <button
                    type="button"
                    onClick={() => setZoomAt(i)}
                    aria-label={`Zoom image ${i + 1}`}
                    className={cn(
                      "relative block w-full cursor-zoom-in overflow-hidden lg:aspect-auto lg:h-(--gallery-h)",
                      fit === "cover" ? "well aspect-4/5" : "aspect-square",
                      fit === "contain" && "well",
                    )}
                  >
                    <Image
                      src={item.url}
                      alt={item.alt}
                      fill
                      priority={i === 0}
                      fetchPriority={i === 0 ? "high" : undefined}
                      sizes="(min-width: 1024px) 50vw, 100vw"
                      className={cn(
                        fit === "cover"
                          ? "object-cover transition-opacity duration-300"
                          : fit === "flush"
                            ? "object-contain transition-opacity duration-300"
                            : "object-contain p-6 mix-blend-multiply transition-opacity duration-300 md:p-12",
                        // The first slide is the LCP element: it paints from
                        // the server HTML and never waits on hydration.
                        i !== 0 && !loaded.has(i) && "opacity-0",
                      )}
                      onLoad={() => markLoaded(i)}
                    />
                    {i !== 0 && !loaded.has(i) && (
                      <div className="absolute inset-0 grid place-items-center" aria-hidden="true">
                        <Icon name="spinner" className="size-8 animate-spin text-ink-soft" />
                      </div>
                    )}
                  </button>
                ) : (
                  <VideoTile
                    video={item}
                    className="aspect-square overflow-hidden bg-ink lg:aspect-auto lg:h-(--gallery-h)"
                  />
                )}
              </li>
            ))}
          </ul>

          {count > 1 && (
            <>
              <div className="glass pointer-events-none absolute bottom-4 left-4 rounded-tag px-3 py-1.5 text-[0.78rem] tabular-nums">
                {active + 1} / {count}
              </div>
              <div className="absolute right-4 bottom-4 hidden gap-2 md:flex">
                <button
                  type="button"
                  onClick={() => goTo(active - 1)}
                  disabled={active === 0}
                  className="glass grid size-11 place-items-center rounded-[12px] transition-opacity disabled:opacity-40"
                  aria-label="Previous image"
                >
                  <Icon name="arrow-right" className="size-4 rotate-180" />
                </button>
                <button
                  type="button"
                  onClick={() => goTo(active + 1)}
                  disabled={active === count - 1}
                  className="glass grid size-11 place-items-center rounded-[12px] transition-opacity disabled:opacity-40"
                  aria-label="Next image"
                >
                  <Icon name="arrow-right" className="size-4" />
                </button>
              </div>
            </>
          )}
        </div>

        {count > 1 && (
          /* Horizontal snap row under the stage on phones; a vertical scroller
             on its left from lg up, as tall as the stage it sits beside. */
          <ul
            ref={thumbsRef}
            className="scrollbar-none flex w-full snap-x snap-mandatory gap-2.5 overflow-x-auto overscroll-x-contain p-0.5 [&::-webkit-scrollbar]:hidden lg:max-h-(--gallery-h) lg:w-22 lg:shrink-0 lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto lg:p-0"
            aria-label="Choose image"
          >
            {media.map((item, i) => (
              <li key={i} className="shrink-0 snap-start">
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Show ${item.type === "video" ? "video" : "image"} ${i + 1}: ${item.alt}`}
                  aria-current={i === active}
                  className={cn(
                    "well relative block size-19 overflow-hidden rounded-[14px] transition-[box-shadow,opacity] duration-300 md:size-22",
                    i === active
                      ? "shadow-[inset_0_0_0_1.5px_var(--color-ink)]"
                      : "opacity-70 hover:opacity-100",
                  )}
                >
                  <Image
                    src={item.type === "image" ? item.url : item.poster}
                    alt=""
                    fill
                    sizes="88px"
                    className={cn(
                      "mix-blend-multiply",
                      item.type === "image" && fit === "contain"
                        ? "object-contain p-1.5"
                        : "object-cover",
                    )}
                  />
                  {item.type === "video" && (
                    <span className="absolute inset-0 grid place-items-center">
                      <span className="glass grid size-7 place-items-center rounded-full">
                        <Icon name="play" className="size-3 translate-x-px" />
                      </span>
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {zoomAt !== null && (
        <GalleryLightbox
          slides={slides}
          index={zoomAt}
          onClose={(i) => {
            setZoomAt(null);
            goTo(i, false);
          }}
        />
      )}
    </section>
  );
}
