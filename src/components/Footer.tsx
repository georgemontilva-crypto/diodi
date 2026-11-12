import { Link } from 'react-router-dom';
import Logo from './Logo';
import { site } from '../config';
import { categories } from '../data/catalog';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer__grid">
        <div className="footer__brand">
          <Logo size={44} title="DIODI" />
          <p className="footer__name">DIODI LED</p>
          <p className="signature">Light of things</p>
        </div>
        <div>
          <h2 className="footer__title">Catálogo</h2>
          <ul>
            {categories.map((c) => (
              <li key={c.id}>
                <Link to={`/catalogo?categoria=${c.id}`}>{c.label}</Link>
              </li>
            ))}
            <li>
              <Link to="/catalogo">Ver todo</Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="footer__title">Ubicaciones</h2>
          <ul>
            {site.locations.map((l) => (
              <li key={l.city}>
                <a href={l.mapUrl} target="_blank" rel="noopener noreferrer">
                  {l.city}
                  <span>{l.address}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="footer__title">Contacto</h2>
          <ul>
            <li>
              <Link to="/#asesoria">Asesoría de iluminación</Link>
            </li>
            <li>
              <Link to="/contacto">Cómo llegar</Link>
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
        <p>© {new Date().getFullYear()} DIODI LED. Estilo, diseño y asesoría en iluminación.</p>
      </div>
    </footer>
  );
}
