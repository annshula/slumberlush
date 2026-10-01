"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Full-bleed hero background film with a landscape cut for desktop and a
 * portrait cut for phones and tablets.
 *
 *  - Each cut has a poster frame painted as a CSS background underneath, so
 *    the hero appears instantly and is the LCP element; the video fades in
 *    over it once it is actually playing. A background on a hidden element is
 *    never downloaded, so each screen only fetches its own poster, and a
 *    media-scoped preload gets that poster in at top priority.
 *  - The video file is requested only for the cut that fits the screen, and
 *    never for visitors who prefer reduced motion — they keep the still frame.
 *  - It pauses whenever the hero is off screen or the tab is hidden.
 */
export type HeroCut = {
  src: string;
  poster: string;
  /** CSS object-position, so the subject survives cropping on odd aspect ratios. */
  position?: string;
};

/** Viewport width (px) from which the landscape cut is used. */
const DESKTOP_MIN = 1024;

export function HeroVideo({
  desktop,
  mobile,
  className,
}: {
  desktop: HeroCut;
  mobile: HeroCut;
  className?: string;
}) {
  const [cut, setCut] = useState<"desktop" | "mobile" | null>(null);
  const [playing, setPlaying] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const wide = window.matchMedia(`(min-width: ${DESKTOP_MIN}px)`);
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setPlaying(false);
      setCut(calm.matches ? null : wide.matches ? "desktop" : "mobile");
    };
    update();
    wide.addEventListener("change", update);
    calm.addEventListener("change", update);
    return () => {
      wide.removeEventListener("change", update);
      calm.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const wrap = wrapRef.current;
    if (!cut || !video || !wrap) return;
    let visible = true;
    const sync = () => {
      if (visible && !document.hidden) video.play().catch(() => {});
      else video.pause();
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      sync();
    });
    io.observe(wrap);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [cut]);

  const active = cut === "desktop" ? desktop : cut === "mobile" ? mobile : null;

  return (
    <div ref={wrapRef} aria-hidden="true" className={cn("overflow-hidden", className)}>
      <link
        rel="preload"
        as="image"
        href={desktop.poster}
        media={`(min-width: ${DESKTOP_MIN}px)`}
        fetchPriority="high"
      />
      <link
        rel="preload"
        as="image"
        href={mobile.poster}
        media={`(max-width: ${DESKTOP_MIN - 1}px)`}
        fetchPriority="high"
      />
      <div
        className="absolute inset-0 hidden bg-cover lg:block"
        style={{ backgroundImage: `url(${desktop.poster})`, backgroundPosition: desktop.position }}
      />
      <div
        className="absolute inset-0 bg-cover lg:hidden"
        style={{ backgroundImage: `url(${mobile.poster})`, backgroundPosition: mobile.position }}
      />
      {active && (
        <video
          key={cut}
          ref={videoRef}
          src={active.src}
          poster={active.poster}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          onPlaying={() => setPlaying(true)}
          className={cn(
            "absolute inset-0 size-full object-cover transition-opacity duration-1000 ease-out-soft",
            playing ? "opacity-100" : "opacity-0",
          )}
          style={{ objectPosition: active.position }}
        />
      )}
    </div>
  );
}
