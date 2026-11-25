import { useEffect, useState, type CSSProperties } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Logo from './Logo';
import ContactLink from './ContactLink';
import { useLista } from '../lista';

const LINKS = [
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/coleccion', label: 'Colección 3D' },
  { to: '/sala-iluminak', label: 'Sala Iluminak' },
  { to: '/tiendas', label: 'Tiendas' },
];

/** Acceso a "Mi lista" con el número de productos guardados. */
function ListLink() {
  const items = useLista();
  const n = items.length;
  return (
    <Link
      to="/lista"
      className="nav__icon nav__list"
      aria-label={n ? `Mi lista, ${n} ${n === 1 ? 'producto' : 'productos'}` : 'Mi lista'}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path d="M6 4h12v16l-6-4-6 4z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
      {n > 0 && (
        <span key={n} className="nav__badge" aria-hidden="true">
          {n > 99 ? '99+' : n}
        </span>
      )}
    </Link>
  );
}

const step = (i: number) => ({ '--i': i }) as CSSProperties;

export default function Nav() {
  const [open, setOpen] = useState(false);
  const { pathname, hash } = useLocation();

  useEffect(() => setOpen(false), [pathname, hash]);
  useEffect(() => {
    if (!open) return;
    // Con el menú abierto la página de fondo no se desplaza.
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      root.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <header className={`nav${open ? ' is-open' : ''}`}>
      <div className="nav__bar">
        <Link to="/" className="nav__brand" aria-label="DIODI, ir al inicio">
          <Logo size={26} />
          <span>DIODI</span>
        </Link>
        <nav className="nav__links" aria-label="Principal">
          {LINKS.map((l) =>
            l.to.includes('#') ? (
              <Link key={l.to} to={l.to}>
                {l.label}
              </Link>
            ) : (
              <NavLink key={l.to} to={l.to}>
                {l.label}
              </NavLink>
            ),
          )}
        </nav>
        <div className="nav__tools">
          <Link to="/catalogo?buscar" className="nav__icon" aria-label="Buscar en el catálogo">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M15.5 15.5L20 20" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </Link>
          <ListLink />
        </div>
        <ContactLink className="btn btn--sand btn--small nav__cta" message="Hola DIODI, quiero asesoría de iluminación.">
          Pedir asesoría
        </ContactLink>
        <button
          className="nav__toggle"
          type="button"
          aria-expanded={open}
          aria-controls="menu-movil"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
        </button>
      </div>

      {/* Menú de teléfono: cortina a pantalla completa; los enlaces entran uno tras otro. */}
      <nav id="menu-movil" className="nav__panel" aria-label="Menú" inert={!open}>
        <ul>
          {LINKS.map((l, i) => (
            <li key={l.to} style={step(i)}>
              <Link to={l.to} onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="nav__panel-foot" style={step(LINKS.length)}>
          <ContactLink className="btn btn--sand" message="Hola DIODI, quiero asesoría de iluminación.">
            Pedir asesoría
          </ContactLink>
          <p className="signature">Light of things</p>
        </div>
      </nav>
    </header>
  );
}
