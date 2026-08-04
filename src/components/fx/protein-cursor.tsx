"use client";

import * as React from "react";

/**
 * Custom, gym-themed pointer for fine-pointer devices:
 *  - a glowing yellow **dumbbell** that tracks the pointer 1:1 and tilts with
 *    your movement direction,
 *  - a soft ring that lags behind with easing and swells over interactive
 *    targets (the dumbbell pumps up with it),
 *  - a "protein powder" spark trail that scatters as you move.
 *
 * Pure rAF + direct style writes (no React re-renders) so it stays smooth.
 * Disabled for touch input and when the user prefers reduced motion.
 */
export function ProteinCursor() {
  const [enabled, setEnabled] = React.useState(false);
  const dbRef = React.useRef<HTMLDivElement>(null);
  const dbInnerRef = React.useRef<HTMLDivElement>(null);
  const ringRef = React.useRef<HTMLDivElement>(null);
  const sparksRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    setEnabled(true);
    document.documentElement.classList.add("has-custom-cursor");

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let px = mx;
    let rx = mx;
    let ry = my;
    let tilt = 0;
    let raf = 0;
    let lastSpark = 0;
    let visible = false;

    const db = () => dbRef.current;
    const dbInner = () => dbInnerRef.current;
    const ring = () => ringRef.current;

    const spawnSpark = (x: number, y: number) => {
      const host = sparksRef.current;
      if (!host) return;
      const s = document.createElement("span");
      const angle = Math.random() * Math.PI * 2;
      const dist = 6 + Math.random() * 16;
      s.className = "protein-spark";
      s.style.setProperty("--tx", `${Math.cos(angle) * dist}px`);
      s.style.setProperty("--ty", `${Math.sin(angle) * dist + 10}px`);
      const size = 3 + Math.random() * 3;
      s.style.width = `${size}px`;
      s.style.height = `${size}px`;
      s.style.left = `${x}px`;
      s.style.top = `${y}px`;
      host.appendChild(s);
      s.addEventListener("animationend", () => s.remove(), { once: true });
    };

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (!visible) {
        visible = true;
        document.documentElement.classList.add("cursor-visible");
      }

      const target = e.target as Element | null;
      const interactive = !!target?.closest?.(
        "a, button, input, textarea, select, [role=button], label, summary, [data-cursor='grow']"
      );
      ring()?.classList.toggle("is-active", interactive);
      db()?.classList.toggle("is-active", interactive);

      const now = performance.now();
      if (now - lastSpark > 38) {
        lastSpark = now;
        spawnSpark(mx, my);
      }
    };

    const onDown = () => {
      ring()?.classList.add("is-down");
      db()?.classList.add("is-down");
    };
    const onUp = () => {
      ring()?.classList.remove("is-down");
      db()?.classList.remove("is-down");
    };
    const onLeave = () => document.documentElement.classList.remove("cursor-visible");
    const onEnter = () => document.documentElement.classList.add("cursor-visible");

    const tick = () => {
      // Ring and dumbbell share one eased position so the dumbbell always sits
      // centered inside the ring (snappy enough to feel precise).
      rx += (mx - rx) * 0.32;
      ry += (my - ry) * 0.32;
      const pos = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
      const r = ring();
      if (r) r.style.transform = pos;
      const d = db();
      if (d) d.style.transform = pos;

      // Tilt the dumbbell toward horizontal movement, then ease back to level.
      const vx = mx - px;
      px = mx;
      const targetTilt = Math.max(-28, Math.min(28, vx * 1.6));
      tilt += (targetTilt - tilt) * 0.12;
      const inner = dbInner();
      if (inner) inner.style.transform = `rotate(${tilt.toFixed(2)}deg)`;

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      document.documentElement.classList.remove("has-custom-cursor", "cursor-visible");
    };
  }, []);

  if (!enabled) return null;

  return (
    <div aria-hidden className="protein-cursor-root">
      <div ref={sparksRef} className="protein-cursor-sparks" />
      <div ref={ringRef} className="protein-cursor-ring" />
      <div ref={dbRef} className="protein-cursor-dumbbell">
        <div ref={dbInnerRef} className="protein-cursor-dumbbell-inner">
          <svg viewBox="0 0 32 32" className="protein-cursor-db-svg">
            {/* handle */}
            <rect x="11" y="14.5" width="10" height="3" rx="1.5" />
            {/* inner plates */}
            <rect x="7.5" y="9.5" width="4" height="13" rx="1.6" />
            <rect x="20.5" y="9.5" width="4" height="13" rx="1.6" />
            {/* outer plates */}
            <rect x="3.75" y="12" width="3.5" height="8" rx="1.5" />
            <rect x="24.75" y="12" width="3.5" height="8" rx="1.5" />
          </svg>
        </div>
      </div>
    </div>
  );
}
