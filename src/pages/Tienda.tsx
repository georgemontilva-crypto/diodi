import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import CategoryIndex from '../components/CategoryIndex';
import PiezaCard from '../components/PiezaCard';
import { buscar, cargarTienda, categorias, fmt, ordenar, tiendaCargada, totalTienda, type Tienda as Datos } from '../data/tienda';
import { useLight } from '../light';
import { categories as coleccion } from '../data/catalog';
import { delay, useTitle } from '../hooks';

const STEP = 36;

export function useTienda() {
  const [data, setData] = useState<Datos | null>(tiendaCargada());
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (data) return;
    let live = true;
    cargarTienda()
      .then((d) => live && setData(d))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [data]);
  return { data, failed };
}

/** Catálogo completo: buscador y el índice de las 35 categorías. Con ?q= muestra resultados. */
export default function Tienda() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const q = params.get('q') ?? '';
  const [text, setText] = useState(q);
  const [limit, setLimit] = useState(STEP);
  const input = useRef<HTMLInputElement>(null);
  const room = useRef<HTMLDivElement>(null);
  const { data, failed } = useTienda();
  useTitle(q ? `«${q}» — Catálogo DIODI` : 'Catálogo — DIODI LED');

  // El icono de búsqueda del menú llega con ?buscar: el cursor va directo al campo.
  useEffect(() => {
    if (params.has('buscar')) input.current?.focus();
  }, [params, location.key]);
  useEffect(() => setText(q), [q]);
  useEffect(() => setLimit(STEP), [q]);

  // Mientras se escribe, los resultados se actualizan sin recargar.
  useEffect(() => {
    if (text === q) return;
    const t = window.setTimeout(
      () => setParams(text.trim() ? { q: text } : {}, { replace: true, preventScrollReset: true }),
      220,
    );
    return () => window.clearTimeout(t);
  }, [text, q, setParams]);

  // Direcciones viejas: /catalogo?categoria=…
  const legacy = params.get('categoria');
  if (legacy) {
    if (categorias.some((c) => c.slug === legacy)) return <Navigate to={`/catalogo/${legacy}`} replace />;
    if (coleccion.some((c) => c.id === legacy)) return <Navigate to={`/coleccion?categoria=${legacy}`} replace />;
  }

  // Las luminarias van antes que sus accesorios, igual que dentro de cada categoría.
  const results = q && data ? ordenar(buscar(data.piezas, q), 'destacados') : [];
  // Las vitrinas están cuando no hay búsqueda o cuando no encontró nada.
  const grid = !q || (!!data && !results.length);
  useLight(room, grid);

  return (
    <div className="shop shop--night" ref={room}>
      <div className="shop__pool" data-lit-pool aria-hidden="true" />
      <header className="wrap shop__head shop__head--room">
        <h1 className="lit-title" data-lit-title>
          Catálogo
        </h1>
        <p className="shop__lead" data-reveal style={delay(120)}>
          {fmt(totalTienda)} productos en {categorias.length} categorías. La luz enciende lo que tienes cerca.
        </p>
        <form
          className="search search--dark"
          role="search"
          data-reveal
          style={delay(200)}
          onSubmit={(e) => {
            e.preventDefault();
            setParams(text.trim() ? { q: text.trim() } : {}, { replace: true });
            input.current?.blur();
          }}
        >
          <label htmlFor="buscar" className="sr-only">
            Buscar en el catálogo
          </label>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M15.5 15.5L20 20" stroke="currentColor" strokeWidth="1.6" />
          </svg>
          <input
            ref={input}
            id="buscar"
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Lámparas, cintas, apliques…"
            autoComplete="off"
            enterKeyHint="search"
          />
          {text && (
            <button type="button" className="search__clear" onClick={() => setText('')} aria-label="Borrar búsqueda">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </button>
          )}
        </form>
      </header>

      <div className="wrap">
        {q ? (
          <section aria-labelledby="resultados" className="shop__results">
            <h2 id="resultados" className="shop__count" aria-live="polite">
              {!data
                ? failed
                  ? 'No se pudo cargar el catálogo. Recarga la página.'
                  : 'Buscando…'
                : results.length
                  ? `${fmt(results.length)} ${results.length === 1 ? 'resultado' : 'resultados'} para «${q}»`
                  : `Nada para «${q}». Prueba con otra palabra o explora las categorías.`}
            </h2>
            {results.length > 0 && (
              <>
                <ul className="pgrid">
                  {results.slice(0, limit).map((p, i) => (
                    <li key={p.id}>
                      <PiezaCard pieza={p} eager={i < 8} />
                    </li>
                  ))}
                </ul>
                {results.length > limit && (
                  <div className="shop__more">
                    <button type="button" className="btn btn--outline" onClick={() => setLimit((l) => l + STEP)}>
                      Ver más ({fmt(results.length - limit)})
                    </button>
                  </div>
                )}
              </>
            )}
            {data && !results.length && <CategoryIndex />}
          </section>
        ) : (
          <section aria-label="Categorías">
            <CategoryIndex />
          </section>
        )}
      </div>
    </div>
  );
}
