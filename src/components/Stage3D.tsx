import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from 'react';
import type { Stage, StageOptions } from '../three/stage';

export interface Stage3DHandle {
  stage: Stage | null;
}

interface Props {
  options: StageOptions;
  /** Descripción para lectores de pantalla. */
  label: string;
  className?: string;
  /** Se muestra si el dispositivo no puede dibujar 3D. */
  fallback?: ReactNode;
  /** La escena ya existe: buen momento para aplicarle el estado actual. */
  onReady?: (stage: Stage) => void;
  onFail?: () => void;
}

/**
 * Canvas con una escena de luminaria. three.js se descarga aparte, solo cuando hace falta.
 * Las opciones se leen una sola vez, al montar.
 */
const Stage3D = forwardRef<Stage3DHandle, Props>(function Stage3D({ options, label, className, fallback, onReady, onFail }, ref) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<Stage | null>(null);
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
      console.warn('No se pudo iniciar la escena 3D', err);
      setFailed(true);
      callbacks.current.onFail?.();
    };
    import('../three/stage')
      .then(({ Stage }) => {
        if (cancelled || !canvas.current) return;
        try {
          stage.current = new Stage(canvas.current, initial.current);
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

  if (failed) return <div className={`stage stage--fallback ${className ?? ''}`}>{fallback}</div>;
  return (
    <canvas
      ref={canvas}
      className={`stage ${options.interactive ? 'stage--interactive' : ''} ${className ?? ''}`}
      role="img"
      aria-label={label}
      tabIndex={options.interactive ? 0 : -1}
    />
  );
});

export default Stage3D;
