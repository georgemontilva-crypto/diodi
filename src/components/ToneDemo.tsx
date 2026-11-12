import { useState } from 'react';
import { Link } from 'react-router-dom';
import { tones } from '../data/catalog';

const OPTIONS = [
  { ...tones.calida, note: 'Para salas, dormitorios y todo lo que pida calma.' },
  { ...tones.neutra, note: 'Para cocinas, baños y zonas de trabajo.' },
  { ...tones.fria, note: 'Para vitrinas, talleres y donde importe el detalle.' },
];

/** Los tres tonos del Spotlight 360 sobre la misma escena. */
export default function ToneDemo() {
  const [active, setActive] = useState(0);
  return (
    <section className="tones" aria-labelledby="tonos-titulo">
      <div className="tones__media">
        {OPTIONS.map((t, i) => (
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
      </div>
      <div className="wrap tones__body">
        <div>
          <h2 id="tonos-titulo">Tres tonos en la misma luminaria.</h2>
          <p className="tones__note">{OPTIONS[active].note}</p>
        </div>
        <div className="tones__controls">
          <div className="segmented" role="radiogroup" aria-label="Tono de luz">
            {OPTIONS.map((t, i) => (
              <button key={t.id} type="button" role="radio" aria-checked={i === active} onClick={() => setActive(i)}>
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
