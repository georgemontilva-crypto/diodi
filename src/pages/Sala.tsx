import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Sala as SalaStage } from '../three/sala';
import { tones } from '../data/catalog';
import { useMedia } from '../hooks';

const VIEWS = [
  { id: 'general', label: 'Entrada' },
  { id: 'sofa', label: 'Sofá' },
  { id: 'luz', label: 'Lámparas' },
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
  const touch = useMedia('(hover: none)');
  const still = new URLSearchParams(window.location.search).has('still');

  useEffect(() => {
    document.title = 'Sala Iluminak · DIODI LED';
    let cancelled = false;
    import('../three/sala')
      .then(({ Sala: Stage }) => {
        if (cancelled || !canvas.current) return;
        const s = new Stage(canvas.current, { still, onMove: () => setMoved(true) });
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

  useEffect(() => stage.current?.setLights(on), [on, ready]);
  useEffect(() => stage.current?.setDay(day), [day, ready]);
  useEffect(() => {
    const t = TONES.find((x) => x.id === tone);
    if (t) stage.current?.setTone(t.color);
  }, [tone, ready]);

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
            aria-label="Sala Iluminak en 3D. Arrastra para mirar alrededor, toca el suelo o usa las flechas para caminar."
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
              ? 'Arrastra para mirar. Toca el suelo para caminar.'
              : 'Arrastra para mirar. Haz clic en el suelo o usa las flechas para caminar.'}
          </p>
        )}
        {!failed && (
          <div className="dock" role="group" aria-label="Controles de la sala">
            <div className="dock__item">
              <button className="switch" type="button" role="switch" aria-checked={on} onClick={() => setOn((v) => !v)}>
                <span className="switch__track">
                  <span className="switch__thumb" />
                </span>
                {on ? 'Lámparas encendidas' : 'Lámparas apagadas'}
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
