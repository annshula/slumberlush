"use client";

import { useRef, useState } from "react";

import { Icon } from "@/components/ui/Icon";
import { trackViewVideo } from "@/lib/analytics";
import type { ViewVideo } from "@/lib/commerce/product-view";

/**
 * Click-to-play video: only the poster loads until the visitor asks for the
 * video (preload="none"), so video never competes with LCP. Native controls.
 *
 * The frame letterboxes instead of cropping (`object-contain`): the shots are
 * vertical (9:16) and the gallery stage is not, so covering the frame would cut
 * the top and bottom off the picture.
 */
export function VideoTile({
  video,
  className,
}: {
  video: ViewVideo;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const tracked = useRef(false);

  const smallest = video.sources[0];
  const hd =
    video.sources.find((s) => (s.width ?? 0) >= 720) ??
    video.sources[video.sources.length - 1];

  return (
    <div className={className} style={{ position: "relative" }}>
      <video
        ref={ref}
        className="absolute inset-0 size-full bg-ink object-contain"
        poster={
          video.poster
            ? `${video.poster}${video.poster.includes("?") ? "&" : "?"}width=900`
            : undefined
        }
        preload="none"
        playsInline
        controls={playing}
        aria-label={video.alt}
        onPlay={() => {
          if (!tracked.current) {
            tracked.current = true;
            trackViewVideo(video.alt, 0);
          }
        }}
      >
        {hd && (
          <source src={hd.src} type={hd.type} media="(min-width: 768px)" />
        )}
        {smallest && <source src={smallest.src} type={smallest.type} />}
      </video>
      {!playing && (
        <button
          type="button"
          onClick={() => {
            setPlaying(true);
            void ref.current?.play();
          }}
          className="group absolute inset-0 grid place-items-center bg-linear-to-t from-ink/35 via-transparent to-transparent"
          aria-label={`Play video: ${video.alt}`}
        >
          <span className="glass grid size-18 place-items-center rounded-full text-ink transition-transform duration-300 group-hover:scale-105">
            <Icon name="play" className="size-6 translate-x-0.5" />
          </span>
        </button>
      )}
    </div>
  );
}
