import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Stage3D, { type Stage3DHandle } from './Stage3D';
import { tones } from '../data/catalog';
import { delay, useMedia } from '../hooks';

const OPTIONS = [
  { ...tones.calida, note: 'Para salas, dormitorios y todo lo que pida calma.' },
  { ...tones.neutra, note: 'Para cocinas, baños y zonas de trabajo.' },
  { ...tones.fria, note: 'Para vitrinas, talleres y donde importe el detalle.' },
];

/** Los tres tonos del Spotlight 360 sobre la misma escena, en 3D y en vivo. */
export default function ToneDemo() {
  const [active, setActive] = useState(0);
  const section = useRef<HTMLElement>(null);
  const ref = useRef<Stage3DHandle>(null);
  const seen = useRef(false);
  const narrow = useMedia('(max-width: 720px)');

  // La luz se enciende cuando la sección entra en pantalla.
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        seen.current = true;
        ref.current?.stage?.setPower(true);
        io.disconnect();
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    ref.current?.stage?.setShift(narrow ? [0, 0.04] : [0.1, 0.07]);
  }, [narrow]);

  const pick = (i: number) => {
    setActive(i);
    ref.current?.stage?.setTone(OPTIONS[i].color);
    ref.current?.stage?.setPower(true);
  };

  return (
    <section className="tones" aria-labelledby="tonos-titulo" ref={section}>
      <div className="tones__media">
        <Stage3D
          ref={ref}
          label={`Spotlight 360 iluminando una pared con luz ${OPTIONS[active].label.toLowerCase()}. Arrastra para girarlo.`}
          options={{
            model: 'spot360',
            ghost: 'SPOTLIGHT 360',
            bare: true,
            ghostWidth: 4.4,
            ghostY: 1.1,
            tone: OPTIONS[0].color,
            tilt: 0.74,
            azimuth: -0.62,
            distance: narrow ? 0.9 : 0.98,
            shift: narrow ? [0, 0.04] : [0.1, 0.07],
            interactive: true,
          }}
          onReady={(s) => {
            s.setTone(OPTIONS[active].color);
            if (seen.current) s.setPower(true);
          }}
          fallback={OPTIONS.map((t, i) => (
            <img
              key={t.id}
              src={`/renders/tono-${t.id}.webp`}
              alt={i === active ? `Spotlight 360 iluminando una pared con luz ${t.label.toLowerCase()}` : ''}
              className={i === active ? 'is-active' : ''}
              loading="lazy"
              width={1600}
              height={1000}
            />
          ))}
        />
      </div>
      <div className="wrap tones__body">
        <div data-reveal>
          <h2 id="tonos-titulo">Tres tonos en la misma luminaria.</h2>
          <p className="tones__note">{OPTIONS[active].note}</p>
        </div>
        <div className="tones__controls" data-reveal style={delay(140)}>
          <div className="segmented" role="radiogroup" aria-label="Tono de luz">
            {OPTIONS.map((t, i) => (
              <button key={t.id} type="button" role="radio" aria-checked={i === active} onClick={() => pick(i)}>
                <i style={{ background: t.color }} />
                {t.label}
              </button>
            ))}
          </div>
          <Link className="link" to="/producto/spotlight-360">
            Probar el Spotlight 360
          </Link>
        </div>
      </div>
    </section>
  );
}
