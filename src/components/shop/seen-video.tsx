"use client";

import * as React from "react";
import { Volume2, VolumeX } from "lucide-react";

/** Small looping clip for the "Seen & Trusted By" row; tap toggles sound. */
export function SeenVideo({ src, poster, label }: { src: string; poster?: string; label: string }) {
  const ref = React.useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = React.useState(true);

  function toggle() {
    const v = ref.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    if (v.paused) void v.play();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`${muted ? "Unmute" : "Mute"} ${label}`}
      className="relative block aspect-[9/14] w-full overflow-hidden rounded-xl bg-neutral-900 ring-1 ring-black/5 md:rounded-2xl"
    >
      <video
        ref={ref}
        className="absolute inset-0 size-full object-cover"
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
      <span className="absolute bottom-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm md:bottom-3 md:right-3 md:size-9">
        {muted ? <VolumeX className="size-3 md:size-4" /> : <Volume2 className="size-3 md:size-4" />}
      </span>
    </button>
  );
}
