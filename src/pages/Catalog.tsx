import { useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { categories, products, type CategoryId } from '../data/catalog';
import { delay, useLightWave, useTitle } from '../hooks';

export default function Catalog() {
  useTitle('Catálogo — DIODI LED');
  const grid = useRef<HTMLUListElement>(null);
  useLightWave(grid);
  const [params, setParams] = useSearchParams();
  const raw = params.get('categoria');
  const active = categories.some((c) => c.id === raw) ? (raw as CategoryId) : null;
  const list = active ? products.filter((p) => p.category === active) : products;

  const select = (id: CategoryId | null) => setParams(id ? { categoria: id } : {}, { replace: true, preventScrollReset: true });

  return (
    <div className="catalog">
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
        <ul className="grid" ref={grid}>
          {list.map((p, i) => (
            <li key={p.slug} data-reveal style={delay((i % 3) * 100 + 120)}>
              <ProductCard product={p} eager={i < 3} />
            </li>
          ))}
        </ul>
        <p className="catalog__note" data-reveal>
          ¿Buscas algo que no está aquí? Tenemos más piezas en Valencia y Caracas.
        </p>
      </div>
    </div>
  );
}
