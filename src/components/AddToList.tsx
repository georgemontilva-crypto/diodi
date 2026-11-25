import { Link } from 'react-router-dom';
import type { Pieza } from '../data/tienda';
import { agregar, quitar, useLista } from '../lista';

/**
 * Agrega o quita un producto de "Mi lista".
 * `compact`: botón redondo sobre la foto de la tarjeta. Si no, botón ancho con enlace a la lista.
 */
export default function AddToList({ pieza, compact = false, qty = 1 }: { pieza: Pieza; compact?: boolean; qty?: number }) {
  const lista = useLista();
  const inList = lista.some((i) => i.id === pieza.id);
  const toggle = () =>
    inList
      ? quitar(pieza.id)
      : agregar({ id: pieza.id, slug: pieza.slug, raw: pieza.raw, name: pieza.name, img: pieza.img }, qty);

  if (compact) {
    return (
      <button
        type="button"
        className={`addlist${inList ? ' is-in' : ''}`}
        aria-pressed={inList}
        aria-label={inList ? `Quitar ${pieza.name} de mi lista` : `Agregar ${pieza.name} a mi lista`}
        title={inList ? 'Quitar de mi lista' : 'Agregar a mi lista'}
        onClick={toggle}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          {inList ? (
            <path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" strokeWidth="1.8" />
          ) : (
            <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="1.6" />
          )}
        </svg>
      </button>
    );
  }

  return (
    <div className="addlist-wide">
      <button
        type="button"
        className={`btn ${inList ? 'btn--outline-umber' : 'btn--umber'}`}
        aria-pressed={inList}
        onClick={toggle}
      >
        {inList ? 'Quitar de mi lista' : 'Agregar a mi lista'}
      </button>
      {inList && (
        <Link className="link" to="/lista">
          Ver mi lista
        </Link>
      )}
    </div>
  );
}
