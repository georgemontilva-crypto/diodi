import { stores, whatsappHref } from '../config';
import { delay } from '../hooks';

/** Las tiendas: abiertas primero, con dirección, horario, WhatsApp y mapa; luego las que abren pronto. */
export default function Locations({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  return (
    <ul className={`locations locations--${tone}`}>
      {stores.map((s, i) => (
        <li key={s.id} className={s.soon ? 'is-soon' : undefined} data-reveal style={delay((i % 3) * 120)}>
          {s.soon && <p className="locations__soon">Muy pronto</p>}
          <h3>{s.name}</h3>
          <p className="locations__city">
            {s.city}, {s.state}
          </p>
          <dl>
            <div>
              <dt>Dirección</dt>
              <dd>{s.address || 'Por confirmar'}</dd>
            </div>
            {s.hours && (
              <div>
                <dt>Horario</dt>
                <dd>{s.hours}</dd>
              </div>
            )}
          </dl>
          {s.soon ? (
            <p className="locations__note">Abrimos muy pronto. Mientras tanto, te atendemos en nuestras otras tiendas.</p>
          ) : (
            <div className="locations__actions">
              {s.whatsapp && (
                <a
                  className={`btn btn--small ${tone === 'dark' ? 'btn--sand' : 'btn--umber'}`}
                  href={whatsappHref(s, `Hola, ${s.name}. Quisiera información.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp
                </a>
              )}
              {s.mapUrl && (
                <a className="link" href={s.mapUrl} target="_blank" rel="noopener noreferrer">
                  Cómo llegar
                </a>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
