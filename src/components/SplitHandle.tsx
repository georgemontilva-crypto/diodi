import { useRef } from 'react';

interface Props {
  /** 0–1: fracción del ancho dibujada como plano. */
  value: number;
  onChange: (value: number) => void;
  /** Se llama cuando la persona toma el control (para cortar animaciones automáticas). */
  onGrab?: () => void;
}

const MIN = 0.04;
const MAX = 0.96;
const clamp = (v: number) => Math.min(MAX, Math.max(MIN, v));

/** Línea divisoria arrastrable entre el plano y el espacio iluminado. Va dentro de un contenedor con position: relative. */
export default function SplitHandle({ value, onChange, onGrab }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const fromPointer = (clientX: number) => {
    const box = root.current?.parentElement?.getBoundingClientRect();
    if (!box) return;
    onChange(clamp((clientX - box.left) / box.width));
  };

  return (
    <div className="split" ref={root} style={{ left: `${value * 100}%` }}>
      <span className="split__tag split__tag--plan" aria-hidden="true">
        Plano
      </span>
      <span className="split__tag split__tag--light" aria-hidden="true">
        Luz
      </span>
      <button
        type="button"
        className="split__grip"
        role="slider"
        aria-label="Del plano a la luz"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round((1 - value) * 100)}
        aria-valuetext={`${Math.round((1 - value) * 100)} % iluminado`}
        onPointerDown={(e) => {
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          onGrab?.();
        }}
        onPointerMove={(e) => dragging.current && fromPointer(e.clientX)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 0.1 : 0.03;
          const next: Record<string, number> = {
            ArrowLeft: value - step,
            ArrowRight: value + step,
            Home: MIN,
            End: MAX,
          };
          if (!(e.key in next)) return;
          e.preventDefault();
          onGrab?.();
          onChange(clamp(next[e.key]));
        }}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path d="M9 7 4 12l5 5M15 7l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </button>
    </div>
  );
}
