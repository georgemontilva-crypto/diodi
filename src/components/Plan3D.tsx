import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from 'react';
import type { ArchOptions, ArchStage } from '../three/arch';

export interface Plan3DHandle {
  stage: ArchStage | null;
}

interface Props {
  options: ArchOptions;
  label: string;
  className?: string;
  fallback?: ReactNode;
  onReady?: (stage: ArchStage) => void;
  onFail?: () => void;
}

/** Canvas con un escenario arquitectónico "del plano a la luz". Las opciones se leen al montar. */
const Plan3D = forwardRef<Plan3DHandle, Props>(function Plan3D({ options, label, className, fallback, onReady, onFail }, ref) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<ArchStage | null>(null);
  const [failed, setFailed] = useState(false);
  const initial = useRef(options);
  const callbacks = useRef({ onReady, onFail });
  callbacks.current = { onReady, onFail };

  useImperativeHandle(ref, () => ({
    get stage() {
      return stage.current;
    },
  }));

  useEffect(() => {
    let cancelled = false;
    const fail = (err: unknown) => {
      if (cancelled) return;
      console.warn('No se pudo iniciar el escenario 3D', err);
      setFailed(true);
      callbacks.current.onFail?.();
    };
    // Con la pantalla de carga a la vista, se deja que su animación arranque antes de montar la escena.
    const wait = document.getElementById('loader') ? 700 : 0;
    new Promise((r) => window.setTimeout(r, wait))
      .then(() => import('../three/arch'))
      .then(({ ArchStage }) => {
        if (cancelled || !canvas.current) return;
        try {
          stage.current = new ArchStage(canvas.current, initial.current);
        } catch (err) {
          fail(err);
          return;
        }
        callbacks.current.onReady?.(stage.current);
      })
      .catch(fail);
    return () => {
      cancelled = true;
      stage.current?.dispose();
      stage.current = null;
    };
  }, []);

  if (failed) return <>{fallback}</>;
  return <canvas ref={canvas} className={`stage ${className ?? ''}`} role="img" aria-label={label} />;
});

export default Plan3D;
