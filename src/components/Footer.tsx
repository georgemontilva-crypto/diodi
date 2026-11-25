import { Link } from 'react-router-dom';
import Logo from './Logo';
import { openStores, site, whatsappHref } from '../config';
import { categorias } from '../data/tienda';

// Las categorías principales (sin subcategorías), las más grandes primero.
const TOP = categorias.filter((c) => !c.parent).slice(0, 8);

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer__grid" data-reveal>
        <div className="footer__brand">
          <Logo size={44} title="DIODI" />
          <p className="footer__name">DIODI LED</p>
          <p className="signature">Light of things</p>
        </div>
        <div>
          <h2 className="footer__title">Catálogo</h2>
          <ul>
            {TOP.map((c) => (
              <li key={c.slug}>
                <Link to={`/catalogo/${c.slug}`}>{c.label}</Link>
              </li>
            ))}
            <li>
              <Link to="/catalogo">Las {categorias.length} categorías</Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="footer__title">Tiendas</h2>
          <ul>
            {openStores.map((s) => (
              <li key={s.id}>
                <a href={whatsappHref(s, `Hola, ${s.name}. Quisiera información.`)} target="_blank" rel="noopener noreferrer">
                  {s.name}
                  <span>{s.address || s.city}</span>
                </a>
              </li>
            ))}
            <li>
              <Link to="/tiendas">Todas las tiendas</Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="footer__title">Explora</h2>
          <ul>
            <li>
              <Link to="/coleccion">Colección 3D</Link>
            </li>
            <li>
              <Link to="/sala-iluminak">Sala Iluminak</Link>
            </li>
            <li>
              <Link to="/#asesoria">Asesoría de iluminación</Link>
            </li>
            <li>
              <Link to="/lista">Mi lista</Link>
            </li>
            {site.instagram && (
              <li>
                <a href={`https://instagram.com/${site.instagram}`} target="_blank" rel="noopener noreferrer">
                  Instagram
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="wrap footer__legal">
        <p>© {new Date().getFullYear()} DIODI LED. Iluminación, energía y material eléctrico.</p>
      </div>
    </footer>
  );
}
