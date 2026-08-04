"use client";

import * as React from "react";

/**
 * Custom, protein-themed pointer for fine-pointer devices:
 *  - a glowing volt-lime core dot that tracks the pointer 1:1,
 *  - a ring that lags behind with easing and swells over interactive targets,
 *  - a "protein powder" spark trail that scatters as you move,
 *  - a scoop/dumbbell glyph that fades in when hovering something clickable.
 *
 * Pure rAF + direct style writes (no React re-renders) so it stays smooth.
 * Disabled for touch input and when the user prefers reduced motion.
 */
export function ProteinCursor() {
  const [enabled, setEnabled] = React.useState(false);
  const dotRef = React.useRef<HTMLDivElement>(null);
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
    let rx = mx;
    let ry = my;
    let raf = 0;
    let lastSpark = 0;
    let visible = false;

    const dot = () => dotRef.current;
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
      const d = dot();
      if (d) d.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;

      const target = e.target as Element | null;
      const interactive = !!target?.closest?.(
        "a, button, input, textarea, select, [role=button], label, summary, [data-cursor='grow']"
      );
      ring()?.classList.toggle("is-active", interactive);

      const now = performance.now();
      if (now - lastSpark > 38) {
        lastSpark = now;
        spawnSpark(mx, my);
      }
    };

    const onDown = () => ring()?.classList.add("is-down");
    const onUp = () => ring()?.classList.remove("is-down");
    const onLeave = () => document.documentElement.classList.remove("cursor-visible");
    const onEnter = () => document.documentElement.classList.add("cursor-visible");

    const tick = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      const r = ring();
      if (r) r.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
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
      <div ref={ringRef} className="protein-cursor-ring">
        {/* dumbbell glyph, revealed on hover */}
        <svg viewBox="0 0 24 24" className="protein-cursor-glyph" fill="none">
          <path
            d="M6.5 8.5v7M4 10v3M17.5 8.5v7M20 10v3M6.5 12h11"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div ref={dotRef} className="protein-cursor-dot" />
    </div>
  );
}
