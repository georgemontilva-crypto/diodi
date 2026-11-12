import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { categoryOf, type Product } from '../data/catalog';

/**
 * Tarjeta de catálogo. La luminaria está apagada y se enciende al pasar el cursor
 * (o al llegar al centro de la pantalla en táctil).
 */
export default function ProductCard({ product, eager = false }: { product: Product; eager?: boolean }) {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia('(hover: none)').matches) return;
    const io = new IntersectionObserver(([e]) => el.classList.toggle('is-lit', e.isIntersecting), {
      rootMargin: '-30% 0px -30% 0px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Link ref={ref} to={`/producto/${product.slug}`} className="card">
      <div className="card__media">
        <img src={`/renders/${product.slug}-off.webp`} alt="" loading={eager ? 'eager' : 'lazy'} width={960} height={1200} />
        <img
          className="card__on"
          src={`/renders/${product.slug}-on.webp`}
          alt={`${product.name} encendida`}
          loading={eager ? 'eager' : 'lazy'}
          width={960}
          height={1200}
        />
        <span className="card__badge">Ver en 3D</span>
      </div>
      <div className="card__text">
        <h3>{product.name}</h3>
        <p>{categoryOf(product).singular}</p>
      </div>
    </Link>
  );
}
