"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Full-bleed hero background video.
 *
 *  - The poster frame is a real <Image> (priority) underneath, so the hero
 *    paints immediately and is the LCP element; the video fades in over it
 *    once it is actually playing.
 *  - The video file is only requested on screens wide enough to show it
 *    (`minWidth`) and never for visitors who prefer reduced motion, so phones
 *    and low-motion users keep the still frame and download nothing extra.
 *  - It pauses whenever the hero is off screen or the tab is hidden.
 */
export function HeroVideo({
  src,
  poster,
  alt = "",
  minWidth = 1024,
  position = "70% 50%",
  className,
}: {
  src: string;
  poster: string;
  alt?: string;
  /** Viewport width (px) from which the video is loaded. */
  minWidth?: number;
  /** CSS object-position, so the subject survives cropping on odd aspect ratios. */
  position?: string;
  className?: string;
}) {
  const [enabled, setEnabled] = useState(false);
  const [playing, setPlaying] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const wide = window.matchMedia(`(min-width: ${minWidth}px)`);
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setEnabled(wide.matches && !calm.matches);
    update();
    wide.addEventListener("change", update);
    calm.addEventListener("change", update);
    return () => {
      wide.removeEventListener("change", update);
      calm.removeEventListener("change", update);
    };
  }, [minWidth]);

  useEffect(() => {
    const video = videoRef.current;
    const wrap = wrapRef.current;
    if (!enabled || !video || !wrap) return;
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
  }, [enabled]);

  return (
    <div ref={wrapRef} className={cn("overflow-hidden", className)} aria-hidden={alt === "" || undefined}>
      <Image
        src={poster}
        alt={alt}
        fill
        priority
        fetchPriority="high"
        sizes="100vw"
        className="object-cover"
        style={{ objectPosition: position }}
      />
      {enabled && (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
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
          style={{ objectPosition: position }}
        />
      )}
    </div>
  );
}
