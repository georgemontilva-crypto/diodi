import { useEffect, useRef } from 'react';
import { Stage } from '../three/stage';
import { ArchStage, type ArchId } from '../three/arch';
import { bySlug, type ModelId } from '../data/catalog';

declare global {
  interface Window {
    __stageReady?: boolean;
    __capture?: (quality?: number) => string;
  }
}

/**
 * Escena suelta a pantalla completa, controlada por la URL. La usa tools/render.mjs
 * para generar las imágenes de public/renders.
 * Ej.: /studio?slug=midnight&power=1  ·  /studio?model=spot360&tilt=0.7&tone=e6ecff
 * Escenarios: /studio?arch=interior&split=0  (split=1 dibuja solo el plano)
 */
export default function Studio() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const num = (k: string) => (q.has(k) ? Number(q.get(k)) : undefined);
    let stage: Stage | ArchStage | undefined;
    let cancelled = false;
    document.body.style.background = '#0d0a07';
    document.body.style.overflow = 'hidden';

    (async () => {
      await document.fonts.load('800 200px "Montserrat Variable"').catch(() => {});
      await document.fonts.ready;
      if (cancelled || !canvas.current) return;
      const arch = q.get('arch');
      if (arch) {
        stage = new ArchStage(canvas.current, {
          scene: arch as ArchId,
          split: num('split') ?? 0,
          power: num('power') ?? 1,
          view: (q.get('view') as 'wide' | 'narrow' | null) ?? undefined,
          still: true,
        });
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            window.__capture = (quality = 0.88) => {
              stage?.renderStill();
              return canvas.current!.toDataURL('image/webp', quality);
            };
            stage?.renderStill();
            window.__stageReady = true;
          }),
        );
        return;
      }
      const product = bySlug(q.get('slug') ?? '');
      const lampStage = (stage = new Stage(canvas.current, {
        model: (q.get('model') ?? product?.model ?? 'earthtone') as ModelId,
        ghost: q.has('ghost') ? q.get('ghost') : (product?.ghost ?? null),
        ghostWidth: num('ghostWidth'),
        ghostY: num('ghostY'),
        finish: q.get('finish') ?? product?.finishes[0].id,
        tone: q.get('tone') ? `#${q.get('tone')}` : product?.tones[0].color,
        power: num('power') ?? 1,
        tilt: num('tilt'),
        explode: num('explode'),
        distance: num('distance'),
        shift: [num('sx') ?? 0, num('sy') ?? 0],
        still: true,
      }));
      const az = num('az');
      if (az !== undefined) lampStage.setAzimuth(az, true);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          stage?.renderStill();
          // Dibuja y exporta en el mismo tick para leer el canvas sin conservar el búfer.
          window.__capture = (quality = 0.88) => {
            stage?.renderStill();
            return canvas.current!.toDataURL('image/webp', quality);
          };
          window.__stageReady = true;
        }),
      );
    })();

    return () => {
      cancelled = true;
      stage?.dispose();
    };
  }, []);

  return <canvas ref={canvas} style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', display: 'block' }} />;
}
