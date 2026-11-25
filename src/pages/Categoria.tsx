import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import PiezaCard from '../components/PiezaCard';
import NotFound from './NotFound';
import { openStores, whatsappHref } from '../config';
import {
  buscar,
  categoria as findCategoria,
  categorias,
  madre,
  mountLabel,
  ordenar,
  ordenes,
  toneLabel,
  type Montaje,
  type Orden,
  type Tono,
} from '../data/tienda';
import { fmt } from '../data/tienda';
import { useTienda } from './Tienda';
import { useTitle } from '../hooks';

const STEP = 36;
const TONE_ORDER: Tono[] = ['2700k', '3000k', '3500k', '4000k', '4500k', '5000k', '6000k', '6500k', '3t', 'rgb'];

export default function Categoria() {
  const { slug = '' } = useParams();
  const cat = findCategoria(slug);
  const [params, setParams] = useSearchParams();
  const { data, failed } = useTienda();
  const [limit, setLimit] = useState(STEP);
  const [text, setText] = useState(params.get('q') ?? '');
  useTitle(cat ? `${cat.label} — Catálogo DIODI` : 'Catálogo — DIODI LED');

  const q = params.get('q') ?? '';
  const orden = (ordenes.some((o) => o.id === params.get('orden')) ? params.get('orden') : 'destacados') as Orden;
  const luz = params.getAll('luz') as Tono[];
  const montaje = params.getAll('montaje') as Montaje[];

  useEffect(() => setLimit(STEP), [slug, q, orden, luz.join(), montaje.join()]);
  // Al cambiar de categoría el campo de búsqueda toma lo que diga la dirección.
  const [seen, setSeen] = useState(slug);
  if (seen !== slug) {
    setSeen(slug);
    setText(q);
  }
  useEffect(() => {
    if (text === q) return;
    const t = window.setTimeout(() => update((p) => (text.trim() ? p.set('q', text) : p.delete('q'))), 220);
    return () => window.clearTimeout(t);
  }, [text, q]);

  const all = useMemo(() => (data && cat ? data.porCategoria[cat.slug] : []), [data, cat]);
  const found = useMemo(() => buscar(all, q), [all, q]);
  // Las cifras de cada filtro cuentan sobre lo que ya filtra el otro grupo.
  const byMount = montaje.length ? found.filter((p) => p.mount && montaje.includes(p.mount)) : found;
  const byTone = luz.length ? found.filter((p) => p.tone && luz.includes(p.tone)) : found;
  const list = ordenar(
    found.filter(
      (p) => (!luz.length || (p.tone && luz.includes(p.tone))) && (!montaje.length || (p.mount && montaje.includes(p.mount))),
    ),
    orden,
  );
  const toneCounts = TONE_ORDER.map((t) => ({ t, n: byMount.filter((p) => p.tone === t).length })).filter((x) => x.n);
  const mountCounts = (['empotrar', 'superficial'] as Montaje[])
    .map((m) => ({ m, n: byTone.filter((p) => p.mount === m).length }))
    .filter((x) => x.n);

  if (!cat) return <NotFound />;
  const parent = madre(cat);
  const children = categorias.filter((c) => c.parent === cat.slug);
  const filtered = !!(q || luz.length || montaje.length);

  function update(fn: (p: URLSearchParams) => void) {
    const next = new URLSearchParams(params);
    fn(next);
    setParams(next, { replace: true, preventScrollReset: true });
  }
  const toggle = (key: 'luz' | 'montaje', value: string) =>
    update((p) => {
      const cur = p.getAll(key);
      p.delete(key);
      (cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value]).forEach((v) => p.append(key, v));
    });

  return (
    <div className="shop shop--category">
      <header className="wrap shop__head">
        <nav className="crumbs" aria-label="Ruta">
          <Link to="/catalogo">Catálogo</Link>
          {parent && (
            <>
              <span aria-hidden="true">/</span>
              <Link to={`/catalogo/${parent.slug}`}>{parent.label}</Link>
            </>
          )}
        </nav>
        <h1>{cat.label}</h1>
        <p className="shop__lead">
          {fmt(cat.total)} productos en tienda.
          {cat.shown < cat.total &&
            cat.shown > 0 &&
            ` Aquí ves ${cat.shown}; pregunta por el resto en cualquiera de nuestras tiendas.`}
        </p>
        {children.length > 0 && (
          <ul className="subcats" aria-label={`Tipos de ${cat.label}`}>
            {children.map((c) => (
              <li key={c.slug}>
                <Link to={`/catalogo/${c.slug}`}>
                  {c.label} <span>{c.total}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </header>

      {cat.shown === 0 ? (
        <div className="wrap shop__empty">
          <p>Estos productos se consultan directamente en tienda.</p>
          <div className="shop__empty-actions">
            {openStores.map((s) => (
              <a
                key={s.id}
                className="btn btn--outline-umber btn--small"
                href={whatsappHref(s, `Hola, ${s.name}. Quisiera información sobre ${cat.label}.`)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Preguntar en {s.city.split(',')[0]}
              </a>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="toolbar">
            <div className="wrap toolbar__row">
              <div className="toolbar__search">
                <label htmlFor="buscar-cat" className="sr-only">
                  Buscar en {cat.label}
                </label>
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M15.5 15.5L20 20" stroke="currentColor" strokeWidth="1.6" />
                </svg>
                <input
                  id="buscar-cat"
                  type="search"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={`Buscar en ${cat.label}`}
                  autoComplete="off"
                  enterKeyHint="search"
                />
              </div>
              <label className="toolbar__sort">
                <span>Ordenar</span>
                <select
                  value={orden}
                  onChange={(e) =>
                    update((p) => (e.target.value === 'destacados' ? p.delete('orden') : p.set('orden', e.target.value)))
                  }
                >
                  {ordenes.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {(toneCounts.length > 0 || mountCounts.length > 0) && (
              <div className="wrap toolbar__filters">
                {toneCounts.length > 0 && (
                  <div className="chips" role="group" aria-label="Color de luz">
                    <span className="chips__label">Color de luz</span>
                    {toneCounts.map(({ t, n }) => (
                      <button key={t} type="button" aria-pressed={luz.includes(t)} onClick={() => toggle('luz', t)}>
                        <i className={`tone-dot tone-dot--${t}`} aria-hidden="true" />
                        {toneLabel(t)} <span>{n}</span>
                      </button>
                    ))}
                  </div>
                )}
                {mountCounts.length > 0 && (
                  <div className="chips" role="group" aria-label="Instalación">
                    <span className="chips__label">Instalación</span>
                    {mountCounts.map(({ m, n }) => (
                      <button key={m} type="button" aria-pressed={montaje.includes(m)} onClick={() => toggle('montaje', m)}>
                        {mountLabel(m)} <span>{n}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="wrap">
            <p className="shop__count" aria-live="polite">
              {!data
                ? failed
                  ? 'No se pudo cargar el catálogo. Recarga la página.'
                  : 'Cargando productos…'
                : `${fmt(list.length)} ${list.length === 1 ? 'producto' : 'productos'}`}
              {filtered && data && (
                <button
                  type="button"
                  className="shop__reset"
                  onClick={() => {
                    setText('');
                    setParams(orden === 'destacados' ? {} : { orden }, { replace: true, preventScrollReset: true });
                  }}
                >
                  Quitar filtros
                </button>
              )}
            </p>
            {data && list.length === 0 && <p className="shop__none">Ningún producto coincide. Prueba quitando algún filtro.</p>}
            <ul className="pgrid">
              {list.slice(0, limit).map((p, i) => (
                <li key={p.id}>
                  <PiezaCard pieza={p} eager={i < 8} />
                </li>
              ))}
            </ul>
            {list.length > limit && (
              <div className="shop__more">
                <button type="button" className="btn btn--outline-umber" onClick={() => setLimit((l) => l + STEP)}>
                  Ver más ({fmt(list.length - limit)})
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
