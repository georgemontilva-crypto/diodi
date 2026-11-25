import TLink from './TLink';
import { categoria, resumen, ruta, srcSet, type Pieza } from '../data/tienda';
import AddToList from './AddToList';

/** Tarjeta de producto del catálogo de la tienda: foto, nombre, datos clave y botón de lista. */
export default function PiezaCard({ pieza, eager = false }: { pieza: Pieza; eager?: boolean }) {
  const meta = resumen(pieza) || (pieza.cats[0] ? ruta(categoria(pieza.cats[0])!) : '');
  return (
    <article className="pcard">
      <TLink to={`/p/${pieza.slug}`} vt="pieza-foto" className="pcard__link">
        <div className="pcard__media" data-vt-src>
          {pieza.img ? (
            <img
              srcSet={srcSet(pieza.img)}
              sizes="(min-width: 1180px) 270px, (min-width: 720px) 30vw, 46vw"
              alt=""
              width={512}
              height={512}
              loading={eager ? 'eager' : 'lazy'}
              decoding="async"
            />
          ) : (
            <span className="pcard__empty">Foto en tienda</span>
          )}
        </div>
        <h3>{pieza.name}</h3>
        {meta && <p className="pcard__meta">{meta}</p>}
      </TLink>
      <AddToList pieza={pieza} compact />
    </article>
  );
}
