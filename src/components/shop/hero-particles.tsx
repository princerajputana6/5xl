"use client";

import * as React from "react";
import * as THREE from "three";

/**
 * A lightweight three.js layer for the hero: a slow-motion field of golden
 * **dumbbells** drifting upward and tumbling, with subtle pointer parallax,
 * composited over the video with additive blending. Purely decorative and
 * fully disabled for reduced motion.
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
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.z = 28;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // ---- Dumbbell sprite texture (drawn once) --------------------------
    const makeDumbbellTexture = () => {
      const S = 128;
      const c = document.createElement("canvas");
      c.width = c.height = S;
      const ctx = c.getContext("2d")!;
      ctx.clearRect(0, 0, S, S);
      ctx.shadowColor = "rgba(255,200,40,0.9)";
      ctx.shadowBlur = 14;
      ctx.fillStyle = "#ffcf33";
      const rr = (x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        ctx.fill();
      };
      const cy = S / 2;
      // handle bar
      rr(40, cy - 6, 48, 12, 6);
      // inner plates
      rr(26, cy - 26, 16, 52, 7);
      rr(86, cy - 26, 16, 52, 7);
      // outer plates
      rr(12, cy - 18, 12, 36, 6);
      rr(104, cy - 18, 12, 36, 6);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };
    const tex = makeDumbbellTexture();

    // ---- Dumbbell sprites ----------------------------------------------
    const COUNT = 44;
    type Bell = {
      sprite: THREE.Sprite;
      mat: THREE.SpriteMaterial;
      speed: number;
      spin: number;
    };
    const bells: Bell[] = [];
    const group = new THREE.Group();
    scene.add(group);

    for (let i = 0; i < COUNT; i++) {
      const mat = new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0.18 + Math.random() * 0.4,
        rotation: Math.random() * Math.PI * 2,
      });
      const sprite = new THREE.Sprite(mat);
      const scale = 1.1 + Math.random() * 2.2;
      sprite.scale.set(scale, scale, 1);
      sprite.position.set(
        (Math.random() - 0.5) * 64,
        (Math.random() - 0.5) * 46,
        (Math.random() - 0.5) * 22
      );
      group.add(sprite);
      bells.push({
        sprite,
        mat,
        speed: 0.5 + Math.random() * 1.3,
        spin: (Math.random() - 0.5) * 0.6,
      });
    }

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

    const render = () => {
      const dt = Math.min(clock.getDelta(), 0.05);
      for (const b of bells) {
        // Drift upward; wrap around when past the top.
        b.sprite.position.y += b.speed * dt * 1.2;
        if (b.sprite.position.y > 24) {
          b.sprite.position.y = -24;
          b.sprite.position.x = (Math.random() - 0.5) * 64;
        }
        // Tumble.
        b.mat.rotation += b.spin * dt;
      }
      // Ease camera toward pointer for a gentle parallax.
      camera.position.x += (targetX * 3 - camera.position.x) * 0.05;
      camera.position.y += (-targetY * 2 - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(render);
    };

    if (reduce) {
      renderer.render(scene, camera);
    } else {
      raf = requestAnimationFrame(render);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      ro.disconnect();
      for (const b of bells) b.mat.dispose();
      tex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className={className} aria-hidden />;
}
