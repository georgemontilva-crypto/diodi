import TLink from './TLink';
import { categorias, fmt, madre, srcSet } from '../data/tienda';

/**
 * Las 35 categorías como vitrinas del mismo tamaño. La luz la pone useLight (en la página):
 * cada vitrina lleva data-lit y se enciende según lo cerca que tenga la lámpara.
 */
export default function CategoryIndex() {
  return (
    <ol className="lightgrid">
      {categorias.map((c) => {
        const m = madre(c);
        return (
          <li key={c.slug}>
            <TLink to={`/catalogo/${c.slug}`} vt="cat-foto" className="tile" data-lit>
              <span className="tile__frame">
                <span className="tile__plate" data-vt-src>
                  {c.img ? (
                    <img
                      srcSet={srcSet(c.img, 'c')}
                      sizes="(min-width: 1180px) 220px, (min-width: 860px) 24vw, 45vw"
                      alt=""
                      width={512}
                      height={512}
                    />
                  ) : (
                    // Sin foto de portada: las iniciales de la categoría.
                    <span className="tile__initials">
                      {c.label
                        .split(/\s+/)
                        .map((w) => w[0])
                        .join('')
                        .slice(0, 2)}
                    </span>
                  )}
                  <span className="tile__shade" />
                </span>
              </span>
              <span className="tile__text">
                <span className="tile__name">
                  {m && <small>{m.label}</small>}
                  {c.label}
                </span>
                <span className="tile__count">
                  {fmt(c.total)}
                  <span className="sr-only"> productos</span>
                </span>
              </span>
            </TLink>
          </li>
        );
      })}
    </ol>
  );
}
