import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { categorias, madre, srcSet } from '../data/tienda';
import { fmt } from '../data/tienda';

/**
 * Índice de las 35 categorías, todas con el mismo peso. Con ratón, la foto de la categoría
 * sigue al cursor mientras se recorre la lista; en teléfono cada fila lleva su miniatura.
 */
export default function CategoryIndex() {
  const float = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<string | null>(null);
  const target = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });
  const raf = useRef(0);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const tick = () => {
    const el = float.current;
    if (!el) return;
    pos.current.x += (target.current.x - pos.current.x) * 0.18;
    pos.current.y += (target.current.y - pos.current.y) * 0.18;
    el.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)`;
    if (Math.abs(target.current.x - pos.current.x) + Math.abs(target.current.y - pos.current.y) > 0.5)
      raf.current = requestAnimationFrame(tick);
    else raf.current = 0;
  };
  const move = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    target.current = { x: e.clientX + 28, y: e.clientY - 120 };
    if (!hover) pos.current = { ...target.current };
    if (!raf.current) raf.current = requestAnimationFrame(tick);
  };

  const shown = categorias.find((c) => c.slug === hover);

  return (
    <div className="cindex" onPointerMove={move} onPointerLeave={() => setHover(null)}>
      <ol className="cindex__list">
        {categorias.map((c) => {
          const m = madre(c);
          return (
            <li key={c.slug}>
              <Link to={`/catalogo/${c.slug}`} onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(c.slug)}>
                <span className="cindex__thumb" aria-hidden="true">
                  {c.img && <img srcSet={srcSet(c.img, 'c')} sizes="64px" alt="" width={64} height={64} loading="lazy" />}
                </span>
                <span className="cindex__name">
                  {m && <small>{m.label}</small>}
                  {c.label}
                </span>
                <span className="cindex__count">
                  {fmt(c.total)}
                  <span className="sr-only"> productos</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
      <div ref={float} className={`cindex__float${shown?.img ? ' is-on' : ''}`} aria-hidden="true">
        {shown?.img && <img key={shown.slug} srcSet={srcSet(shown.img, 'c')} sizes="280px" alt="" width={512} height={512} />}
      </div>
    </div>
  );
}
