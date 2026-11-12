import { useRef } from 'react';
import ProductCard from './ProductCard';
import type { Product } from '../data/catalog';
import { useLightWave } from '../hooks';

/** Carrusel horizontal de productos con scroll nativo. */
export default function Rail({ items, label }: { items: Product[]; label: string }) {
  const track = useRef<HTMLUListElement>(null);
  useLightWave(track);
  const move = (dir: number) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector('li');
    el.scrollBy({ left: dir * ((card?.clientWidth ?? 320) + 20) * 2, behavior: 'smooth' });
  };
  return (
    <div className="rail">
      <ul className="rail__track" ref={track} aria-label={label}>
        {items.map((p) => (
          <li key={p.slug}>
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
      <div className="rail__nav wrap">
        <button type="button" onClick={() => move(-1)} aria-label="Productos anteriores">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M15 5 8 12l7 7" fill="none" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </button>
        <button type="button" onClick={() => move(1)} aria-label="Productos siguientes">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
