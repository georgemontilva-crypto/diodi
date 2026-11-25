import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { categorias, srcSet, totalTienda, type Categoria } from '../data/tienda';
import { fmt } from '../data/tienda';

/** Dos filas de vitrinas que avanzan en sentidos opuestos: cada una lleva a su categoría. */
function Fila({ items, reverse = false }: { items: Categoria[]; reverse?: boolean }) {
  const track = (hidden: boolean) => (
    <ul className="vitrinas__track" aria-hidden={hidden || undefined}>
      {items.map((c) => (
        <li key={c.slug}>
          <Link to={`/catalogo/${c.slug}`} tabIndex={hidden ? -1 : undefined}>
            <span className="vitrinas__plate">
              {c.img && <img srcSet={srcSet(c.img, 'c')} sizes="220px" alt="" width={256} height={256} loading="lazy" />}
            </span>
            <span className="vitrinas__name">{c.label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
  return (
    <div className={`vitrinas__row${reverse ? ' is-reverse' : ''}`}>
      {track(false)}
      {track(true)}
    </div>
  );
}

/** Portada: el catálogo completo de la tienda, con buscador. */
export default function TodaLaTienda() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  // Algunas categorías comparten foto de portada: cada foto sale una sola vez.
  const withImg = categorias.filter((c, i) => c.img && categorias.findIndex((x) => x.img === c.img) === i);
  const half = Math.ceil(withImg.length / 2);
  return (
    <section className="vitrinas" aria-labelledby="tienda-titulo">
      <div className="wrap vitrinas__head">
        <h2 id="tienda-titulo" data-reveal>
          Todo lo que se enciende, y lo que lo hace funcionar.
        </h2>
        <div className="vitrinas__side" data-reveal>
          <p>
            {fmt(totalTienda)} productos en {categorias.length} categorías: lámparas decorativas y técnicas, cintas, domótica,
            energía solar y material eléctrico.
          </p>
          <form
            className="search search--dark"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(q.trim() ? `/catalogo?q=${encodeURIComponent(q.trim())}` : '/catalogo');
            }}
          >
            <label htmlFor="buscar-portada" className="sr-only">
              Buscar en el catálogo
            </label>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <path d="M15.5 15.5L20 20" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            <input
              id="buscar-portada"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Busca un producto"
              autoComplete="off"
              enterKeyHint="search"
            />
            <button type="submit" className="search__go">
              Buscar
            </button>
          </form>
        </div>
      </div>
      <div className="vitrinas__rows">
        <Fila items={withImg.slice(0, half)} />
        <Fila items={withImg.slice(half)} reverse />
      </div>
      <div className="wrap vitrinas__foot">
        <Link className="btn btn--sand" to="/catalogo">
          Explorar el catálogo
        </Link>
      </div>
    </section>
  );
}
