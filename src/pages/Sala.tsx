import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { LampInfo, Sala as SalaStage } from '../three/sala';
import { tones } from '../data/catalog';
import { useMedia } from '../hooks';

const VIEWS = [
  { id: 'general', label: 'Entrada' },
  { id: 'sofa', label: 'Sofá' },
  { id: 'luz', label: 'Lámparas' },
  { id: 'tv', label: 'Pared del TV' },
];
const TONES = [tones.calida, tones.neutra];

declare global {
  interface Window {
    __salaShot?: (view: string, day: boolean) => string;
  }
}

/** La sala de la línea Iluminak, para recorrerla: se mira arrastrando y se camina tocando el suelo. */
export default function Sala() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<SalaStage | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [moved, setMoved] = useState(false);
  const [on, setOn] = useState(true);
  const [day, setDay] = useState(false);
  const [tone, setTone] = useState(TONES[0].id);
  const [lamp, setLamp] = useState<LampInfo | null>(null);
  const touch = useMedia('(hover: none)');
  const still = new URLSearchParams(window.location.search).has('still');

  useEffect(() => {
    document.title = 'Sala Iluminak · DIODI LED';
    let cancelled = false;
    import('../three/sala')
      .then(({ Sala: Stage }) => {
        if (cancelled || !canvas.current) return;
        const s = new Stage(canvas.current, { still, onMove: () => setMoved(true), onSelect: setLamp });
        stage.current = s;
        setReady(true);
        if (still) {
          window.__salaShot = (view, isDay) => {
            s.setDay(isDay);
            s.goTo(view);
            return s.snapshot(0.9);
          };
        }
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      stage.current?.dispose();
      stage.current = null;
    };
  }, [still]);

  useEffect(() => stage.current?.setDay(day), [day, ready]);
  useEffect(() => {
    const t = TONES.find((x) => x.id === tone);
    if (t) stage.current?.setTone(t.color);
  }, [tone, ready]);

  const patch = (p: Partial<Pick<LampInfo, 'on' | 'level' | 'aim'>>) => {
    if (!lamp) return;
    const next = stage.current?.setLamp(lamp.id, p);
    if (next) setLamp(next);
  };

  return (
    <section className={`sala${still ? ' sala--still' : ''}`} aria-labelledby="sala-titulo">
      <div className="sala__stage">
        {failed ? (
          <img src="/renders/sala-iluminak.webp" alt="Sala Iluminak: sofá curvo bajo las lámparas colgantes" />
        ) : (
          <canvas
            ref={canvas}
            tabIndex={0}
            role="img"
            aria-label="Sala Iluminak en 3D. Arrastra para mirar alrededor, toca el suelo o usa las flechas para caminar, y toca una lámpara para encenderla o apagarla."
          />
        )}
      </div>

      <header className="sala__head">
        <nav aria-label="Ruta">
          <Link to="/">Inicio</Link>
          <span aria-hidden="true">/</span>
          <span>Línea Iluminak</span>
        </nav>
        <h1 id="sala-titulo">Sala Iluminak</h1>
        <p>Camina por la sala y mira cómo cae la luz sobre la madera.</p>
      </header>

      <div className="sala__bottom">
        {!failed && (
          <p className={`sala__hint${moved ? ' is-used' : ''}`}>
            {touch
              ? 'Arrastra para mirar. Toca el suelo para caminar y cada lámpara para encenderla.'
              : 'Arrastra para mirar. Haz clic en el suelo para caminar y en cada lámpara para encenderla.'}
          </p>
        )}
        {!failed && lamp && (
          <div className="dock sala__lamp" role="group" aria-label={`Controles de ${lamp.name}`}>
            <div className="dock__item">
              <button
                className="switch"
                type="button"
                role="switch"
                aria-checked={lamp.on}
                onClick={() => patch({ on: !lamp.on })}
              >
                <span className="switch__track">
                  <span className="switch__thumb" />
                </span>
                {lamp.name}
              </button>
            </div>
            {lamp.id !== 'tv' && (
              <label className="dock__item dock__item--range">
                <span className="dock__label">Intensidad</span>
                <input
                  type="range"
                  min={20}
                  max={140}
                  step={1}
                  value={Math.round(lamp.level * 100)}
                  onChange={(e) => patch({ level: Number(e.target.value) / 100, on: true })}
                />
                <output>{Math.round(lamp.level * 100)}%</output>
              </label>
            )}
            {lamp.aim !== null && (
              <label className="dock__item dock__item--range">
                <span className="dock__label">Orientación</span>
                <input
                  type="range"
                  min={-40}
                  max={40}
                  step={1}
                  value={Math.round((lamp.aim * 180) / Math.PI)}
                  onChange={(e) => patch({ aim: (Number(e.target.value) * Math.PI) / 180 })}
                />
                <output>{Math.round((lamp.aim * 180) / Math.PI)}°</output>
              </label>
            )}
            <div className="dock__item">
              <button
                className="sala__close"
                type="button"
                onClick={() => setLamp(null)}
                aria-label="Cerrar controles de la lámpara"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </button>
            </div>
          </div>
        )}
        {!failed && (
          <div className="dock" role="group" aria-label="Controles de la sala">
            <div className="dock__item">
              <button
                className="switch"
                type="button"
                role="switch"
                aria-checked={on}
                onClick={() => {
                  stage.current?.setLights(!on);
                  setOn(!on);
                  setLamp((l) => (l && l.id !== 'tv' ? { ...l, on: !on } : l));
                }}
              >
                <span className="switch__track">
                  <span className="switch__thumb" />
                </span>
                Todas las luces
              </button>
            </div>
            <div className="dock__item">
              <span className="dock__label" id="lbl-hora">
                Ambiente
              </span>
              <div className="segmented" role="radiogroup" aria-labelledby="lbl-hora">
                <button type="button" role="radio" aria-checked={!day} onClick={() => setDay(false)}>
                  Noche
                </button>
                <button type="button" role="radio" aria-checked={day} onClick={() => setDay(true)}>
                  Día
                </button>
              </div>
            </div>
            <div className="dock__item">
              <span className="dock__label" id="lbl-tono-sala">
                Tono
              </span>
              <div className="segmented" role="radiogroup" aria-labelledby="lbl-tono-sala">
                {TONES.map((t) => (
                  <button key={t.id} type="button" role="radio" aria-checked={tone === t.id} onClick={() => setTone(t.id)}>
                    <i style={{ background: t.color }} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="dock__item">
              <span className="dock__label" id="lbl-vista">
                Ir a
              </span>
              <div className="sala__views" role="group" aria-labelledby="lbl-vista">
                {VIEWS.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      stage.current?.goTo(v.id);
                      setMoved(true);
                    }}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
