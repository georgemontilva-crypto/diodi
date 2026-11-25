// La luz del catálogo: una lámpara invisible sigue al cursor (o al centro de la pantalla
// en teléfono) y cada vitrina se enciende según lo cerca que la tenga.
//
// Marcado que entiende, dentro del elemento raíz:
//   [data-lit]        vitrina; recibe --l (0 apagada … 1 encendida)
//   [data-lit-title]  título; recibe --tx / --ty (posición de la luz dentro de él)
//   [data-lit-pool]   charco de luz que se mueve con la lámpara

import { useLayoutEffect, type RefObject } from 'react';

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

/** Luz ambiente cuando el cursor no está sobre la sala. */
const AMBIENT = 0.5;

export function useLight(root: RefObject<HTMLElement | null>, key: unknown = null) {
  useLayoutEffect(() => {
    const el = root.current;
    // Con movimiento reducido no hay lámpara: las vitrinas quedan encendidas (ver CSS).
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const tiles = [...el.querySelectorAll<HTMLElement>('[data-lit]')];
    const title = el.querySelector<HTMLElement>('[data-lit-title]');
    const pool = el.querySelector<HTMLElement>('[data-lit-pool]');
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    const cur = tiles.map(() => 0);
    const shown = tiles.map(() => -1);
    tiles.forEach((t) => t.style.setProperty('--l', '0'));
    const start = performance.now();
    const ptr = { x: window.innerWidth * 0.3, y: window.innerHeight * 0.32, over: false };
    const lamp = { x: ptr.x, y: ptr.y, on: fine ? 0 : 1 };
    let raf = 0;

    const frame = () => {
      raf = 0;
      const now = performance.now();
      const vh = window.innerHeight;
      // Primero se lee todo…
      const box = el.getBoundingClientRect();
      const rects = tiles.map((t) => t.getBoundingClientRect());
      const titleBox = title?.getBoundingClientRect();
      const inside = fine && ptr.over && ptr.y >= box.top && ptr.y <= box.bottom;
      const radius = (rects[0]?.width ?? 220) * 2.25;

      // La lámpara va detrás del cursor con un poco de retraso; en teléfono se queda en el centro.
      const goal = fine ? ptr : { x: window.innerWidth / 2, y: vh * 0.46 };
      let busy = false;
      const ease = (from: number, to: number, k: number, eps: number) => {
        if (Math.abs(to - from) < eps) return to;
        busy = true;
        return from + (to - from) * k;
      };
      lamp.x = ease(lamp.x, goal.x, 0.16, 0.4);
      lamp.y = ease(lamp.y, goal.y, 0.16, 0.4);
      lamp.on = ease(lamp.on, !fine || inside ? 1 : 0, 0.1, 0.004);

      // …y después se escribe.
      tiles.forEach((t, i) => {
        const r = rects[i];
        let target: number;
        if (now - start < 120 + i * 38) {
          // Encendido de la sala: las vitrinas prenden una tras otra.
          target = 0;
          busy = true;
        } else if (fine) {
          const d = Math.hypot(r.left + r.width / 2 - lamp.x, r.top + r.height / 2 - lamp.y);
          const near = 0.12 + 0.88 * smooth(clamp(1 - d / radius));
          target = AMBIENT + (near - AMBIENT) * lamp.on;
        } else {
          const d = Math.abs(r.top + r.height * 0.4 - lamp.y);
          target = 0.26 + 0.74 * smooth(clamp(1 - d / (vh * 0.52)));
        }
        const visible = r.bottom > -160 && r.top < vh + 160;
        cur[i] = visible ? ease(cur[i], target, 0.13, 0.004) : target;
        if (Math.abs(cur[i] - shown[i]) > 0.003) {
          shown[i] = cur[i];
          t.style.setProperty('--l', cur[i].toFixed(3));
        }
      });
      if (pool) {
        pool.style.transform = `translate3d(${(lamp.x - box.left).toFixed(1)}px, ${(lamp.y - box.top).toFixed(1)}px, 0)`;
        pool.style.opacity = (0.35 + 0.65 * lamp.on).toFixed(3);
      }
      if (title && titleBox) {
        title.style.setProperty('--tx', `${(lamp.x - titleBox.left).toFixed(1)}px`);
        title.style.setProperty('--ty', `${(lamp.y - titleBox.top).toFixed(1)}px`);
      }
      if (busy) raf = requestAnimationFrame(frame);
    };
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      ptr.x = e.clientX;
      ptr.y = e.clientY;
      ptr.over = true;
      wake();
    };
    const leave = () => {
      ptr.over = false;
      wake();
    };

    window.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', leave);
    window.addEventListener('scroll', wake, { passive: true });
    window.addEventListener('resize', wake);
    wake();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', leave);
      window.removeEventListener('scroll', wake);
      window.removeEventListener('resize', wake);
      tiles.forEach((t) => t.style.removeProperty('--l'));
    };
  }, [root, key]);
}
