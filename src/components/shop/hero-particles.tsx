"use client";

import * as React from "react";
import * as THREE from "three";

/**
 * A lightweight three.js layer for the hero: a slowly drifting field of warm
 * golden particles with subtle pointer parallax, composited over the video with
 * additive blending. Purely decorative and fully disabled for reduced motion.
 */
export function HeroParticles({ className }: { className?: string }) {
  const mountRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 100);
    camera.position.z = 28;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // Two particle clusters at different depths for parallax.
    const COUNT = 900;
    const positions = new Float32Array(COUNT * 3);
    const speeds = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 70;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
      speeds[i] = 0.6 + Math.random() * 1.6;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    // Soft round sprite so points read as glowing dust, not squares.
    const sprite = (() => {
      const c = document.createElement("canvas");
      c.width = c.height = 64;
      const ctx = c.getContext("2d")!;
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, "rgba(255,214,64,1)");
      g.addColorStop(0.4, "rgba(255,196,32,0.55)");
      g.addColorStop(1, "rgba(255,196,32,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 64);
      const tex = new THREE.CanvasTexture(c);
      return tex;
    })();

    const material = new THREE.PointsMaterial({
      size: 0.55,
      map: sprite,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.9,
    });
    const points = new THREE.Points(geo, material);
    scene.add(points);

    // Pointer parallax target.
    let targetX = 0;
    let targetY = 0;
    const onMove = (e: PointerEvent) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove);

    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h || 1;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    let raf = 0;
    const clock = new THREE.Clock();
    const pos = geo.attributes.position as THREE.BufferAttribute;

    const render = () => {
      const dt = clock.getDelta();
      // Drift particles upward; wrap around when they exit the top.
      for (let i = 0; i < COUNT; i++) {
        let y = pos.getY(i) + speeds[i] * dt * 1.4;
        if (y > 25) y = -25;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;

      points.rotation.y += dt * 0.04;
      // Ease camera toward pointer for a gentle parallax.
      camera.position.x += (targetX * 3 - camera.position.x) * 0.05;
      camera.position.y += (-targetY * 2 - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(render);
    };

    if (reduce) {
      // Render a single static frame, no animation loop.
      renderer.render(scene, camera);
    } else {
      raf = requestAnimationFrame(render);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      ro.disconnect();
      geo.dispose();
      material.dispose();
      sprite.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className={className} aria-hidden />;
}
