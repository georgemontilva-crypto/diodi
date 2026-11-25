import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AddToList from '../components/AddToList';
import PiezaCard from '../components/PiezaCard';
import StoreChooser, { useStore } from '../components/StoreChooser';
import NotFound from './NotFound';
import { whatsappHref } from '../config';
import { categoria, datos, madre, ordenar, srcSet } from '../data/tienda';
import { useTienda } from './Tienda';
import { useTitle } from '../hooks';

/** Ficha de un producto del catálogo de la tienda. */
export default function Pieza() {
  const { slug = '' } = useParams();
  const { data, failed } = useTienda();
  const [store] = useStore();
  const [qty, setQty] = useState(1);
  const p = data?.bySlug.get(slug);
  useTitle(p ? `${p.name} — DIODI` : 'Catálogo — DIODI LED');

  if (!data)
    return (
      <div className="piece piece--loading">
        {failed && <p className="wrap">No se pudo cargar el producto. Recarga la página.</p>}
      </div>
    );
  if (!p) return <NotFound />;

  const cat = p.cats[0] ? categoria(p.cats[0]) : null;
  const parent = cat ? madre(cat) : null;
  const ficha = datos(p);
  const related = cat
    ? ordenar(data.porCategoria[cat.slug], 'destacados')
        .filter((x) => x.id !== p.id)
        .slice(0, 8)
    : [];
  const ask = `Hola, ${store.name}. Quisiera precio y disponibilidad de:\n\n• ${qty} × ${p.raw} (ref. ${p.id})\n\nGracias.`;

  return (
    <article className="piece">
      <div className="wrap piece__grid">
        <div className="piece__media" data-vt="pieza-foto">
          {p.img ? (
            <img srcSet={srcSet(p.img)} sizes="(min-width: 900px) 560px, 92vw" alt={p.name} width={512} height={512} />
          ) : (
            <span className="pcard__empty">Foto en tienda</span>
          )}
        </div>

        <div className="piece__info">
          <nav className="crumbs" aria-label="Ruta">
            <Link to="/catalogo">Catálogo</Link>
            {parent && (
              <>
                <span aria-hidden="true">/</span>
                <Link to={`/catalogo/${parent.slug}`}>{parent.label}</Link>
              </>
            )}
            {cat && (
              <>
                <span aria-hidden="true">/</span>
                <Link to={`/catalogo/${cat.slug}`}>{cat.label}</Link>
              </>
            )}
          </nav>
          <h1>{p.name}</h1>
          <p className="piece__ref">Ref. {p.id}</p>

          {ficha.length > 0 && (
            <dl className="piece__specs">
              {ficha.map((d) => (
                <div key={d.label}>
                  <dt>{d.label}</dt>
                  <dd>{d.value}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="piece__buy">
            <div className="qty" role="group" aria-label="Cantidad">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Menos" disabled={qty <= 1}>
                −
              </button>
              <output aria-live="polite">{qty}</output>
              <button type="button" onClick={() => setQty((q) => Math.min(999, q + 1))} aria-label="Más">
                +
              </button>
            </div>
            <AddToList pieza={p} qty={qty} />
          </div>

          <div className="piece__ask">
            <h2>Precio y disponibilidad</h2>
            <p>Cada tienda te da el precio y el tiempo de entrega. Elige la tuya y escríbele.</p>
            <StoreChooser />
            <a className="btn btn--outline-umber" href={whatsappHref(store, ask)} target="_blank" rel="noopener noreferrer">
              Preguntar en {store.name}
            </a>
          </div>

          <p className="piece__note">
            Ficha resumida a partir de la referencia. Confirma medidas, acabados y accesorios con la tienda.
          </p>
        </div>
      </div>

      {related.length > 0 && cat && (
        <section className="wrap piece__related" aria-labelledby="relacionados">
          <div className="piece__related-head">
            <h2 id="relacionados">Más en {cat.label}</h2>
            <Link className="link" to={`/catalogo/${cat.slug}`}>
              Ver los {cat.total}
            </Link>
          </div>
          <ul className="pgrid">
            {related.map((x) => (
              <li key={x.id}>
                <PiezaCard pieza={x} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
