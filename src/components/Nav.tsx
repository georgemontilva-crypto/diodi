import { useEffect, useState, type CSSProperties } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Logo from './Logo';
import ContactLink from './ContactLink';

const LINKS = [
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/sala-iluminak', label: 'Sala Iluminak' },
  { to: '/#asesoria', label: 'Asesoría' },
  { to: '/contacto', label: 'Ubicaciones' },
];

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
