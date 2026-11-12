import { useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Stage3D, { type Stage3DHandle } from './Stage3D';
import type { Stage } from '../three/stage';

const SPECS: [string, string][] = [
  ['IP54', 'Protección contra polvo y salpicaduras'],
  ['CRI 90', 'Colores fieles'],
  ['36°', 'Ángulo de apertura'],
  ['0,9', 'Factor de potencia'],
];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Despiece del downlight Lamba guiado por el scroll: se abre, se rotula y se vuelve a armar. */
export default function LambaScroll() {
  const section = useRef<HTMLElement>(null);
  const intro = useRef<HTMLDivElement>(null);
  const outro = useRef<HTMLDivElement>(null);
  const labels = useRef<(HTMLDivElement | null)[]>([]);
  const progress = useRef(0);
  const pt = useRef({ x: 0, y: 0 });
  const stageRef = useRef<Stage3DHandle>(null);
  const sync = useRef<() => void>(() => {});

  useEffect(() => {
    const update = () => {
      const el = section.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - window.innerHeight)));
      progress.current = p;
      // Solo se redibuja cuando el scroll cambia algo.
      const stage = stageRef.current?.stage;
      if (stage) {
        stage.setExplode(smooth(0.08, 0.42, p) * (1 - smooth(0.66, 0.86, p)), true);
        stage.setAzimuth(0.4 + p * 2.6);
      }
      if (intro.current) {
        const o = 1 - smooth(0.05, 0.2, p);
        intro.current.style.opacity = String(o);
        intro.current.style.visibility = o < 0.01 ? 'hidden' : 'visible';
      }
      if (outro.current) {
        const o = smooth(0.84, 0.95, p);
        outro.current.style.opacity = String(o);
        outro.current.style.visibility = o < 0.01 ? 'hidden' : 'visible';
      }
    };
    sync.current = update;
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  const onFrame = useCallback((stage: Stage) => {
    const p = progress.current;
    const show = smooth(0.3, 0.42, p) * (1 - smooth(0.62, 0.7, p));
    stage.lamp.anchors?.forEach((a, i) => {
      const el = labels.current[i];
      if (!el) return;
      stage.project(a.object, pt.current, a.side * 0.64);
      el.style.opacity = String(show);
      el.style.transform = `translate(${pt.current.x.toFixed(1)}px, ${pt.current.y.toFixed(1)}px)`;
    });
  }, []);

  const names = [
    'Aro de montaje con clips',
    'Disipador de aluminio',
    'LED OSRAM · CRI 90',
    'Óptica de 36°',
    'Aro con protección IP54',
  ];
  const sides = [1, -1, 1, -1, 1];

  return (
    <section className="lamba" ref={section} aria-labelledby="lamba-titulo">
      <div className="lamba__sticky">
        <Stage3D
          ref={stageRef}
          onReady={() => sync.current()}
          className="lamba__stage"
          label="Despiece del downlight Lamba: aro de montaje, disipador, LED, óptica y aro embellecedor"
          options={{ model: 'lamba', ghost: null, power: 1, autoRotate: 0, distance: 1.02, onFrame }}
          fallback={<img src="/renders/lamba-on.webp" alt="Downlight Lamba" />}
        />
        <div className="lamba__intro wrap" ref={intro}>
          <h2 id="lamba-titulo">
            Lamba,
            <br />
            por dentro.
          </h2>
          <p>Lo que no se ve de un downlight es lo que decide cómo ilumina y cuánto dura. Sigue bajando para abrirlo.</p>
        </div>
        <div className="lamba__labels" aria-hidden="true">
          {names.map((n, i) => (
            <div
              key={n}
              ref={(el) => {
                labels.current[i] = el;
              }}
              className={`callout ${sides[i] > 0 ? 'callout--right' : 'callout--left'}`}
            >
              <span>{n}</span>
            </div>
          ))}
        </div>
        <div className="lamba__outro wrap" ref={outro}>
          <dl className="lamba__specs">
            {SPECS.map(([value, label]) => (
              <div key={value}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <Link className="btn btn--sand" to="/producto/lamba">
            Ver Lamba en 3D
          </Link>
        </div>
      </div>
    </section>
  );
}
