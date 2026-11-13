import { useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { categories, products, type CategoryId } from '../data/catalog';
import { delay, useLightWave, useTitle } from '../hooks';

export default function Catalog() {
  useTitle('Catálogo — DIODI LED');
  const root = useRef<HTMLDivElement>(null);
  useLightWave(root);
  const [params, setParams] = useSearchParams();
  const raw = params.get('categoria');
  const active = categories.some((c) => c.id === raw) ? (raw as CategoryId) : null;
  // Con "Todo" se muestra cada tipo en su propio bloque; con un filtro, solo ese.
  const groups = categories
    .filter((c) => !active || c.id === active)
    .map((c) => ({ ...c, items: products.filter((p) => p.category === c.id) }));

  const select = (id: CategoryId | null) => setParams(id ? { categoria: id } : {}, { replace: true, preventScrollReset: true });

  return (
    <div className="catalog" ref={root}>
      <header className="wrap catalog__head">
        <h1 data-reveal>Catálogo</h1>
        <p data-reveal style={delay(90)}>
          Cada pieza se puede girar, encender y probar en 3D.
        </p>
        <div className="filters" role="group" aria-label="Filtrar por tipo" data-reveal style={delay(180)}>
          <button type="button" aria-pressed={!active} onClick={() => select(null)}>
            Todo
          </button>
          {categories.map((c) => (
            <button key={c.id} type="button" aria-pressed={active === c.id} onClick={() => select(c.id)}>
              {c.label}
            </button>
          ))}
        </div>
      </header>
      <div className="wrap">
        {groups.map((g, gi) => (
          <section key={g.id} className="catalog__group" aria-labelledby={`tipo-${g.id}`}>
            <div className="catalog__group-head" data-reveal>
              <h2 id={`tipo-${g.id}`}>{g.label}</h2>
              <p>{g.intro}</p>
            </div>
            <ul className="grid">
              {g.items.map((p, i) => (
                <li key={p.slug} data-reveal style={delay((i % 3) * 100 + 80)}>
                  <ProductCard product={p} eager={gi === 0 && i < 3} />
                </li>
              ))}
            </ul>
          </section>
        ))}
        <p className="catalog__note" data-reveal>
          ¿Buscas algo que no está aquí? Tenemos más piezas en Valencia y Caracas.
        </p>
      </div>
    </div>
  );
}
