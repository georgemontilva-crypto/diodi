import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Logo from './Logo';
import ContactLink from './ContactLink';

export default function Nav() {
  const [open, setOpen] = useState(false);
  const { pathname, hash } = useLocation();

  useEffect(() => setOpen(false), [pathname, hash]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const links = (
    <>
      <NavLink to="/catalogo">Catálogo</NavLink>
      <Link to="/#asesoria">Asesoría</Link>
      <NavLink to="/contacto">Ubicaciones</NavLink>
    </>
  );

  return (
    <header className={`nav${open ? ' is-open' : ''}`}>
      <div className="nav__bar">
        <Link to="/" className="nav__brand" aria-label="DIODI, ir al inicio">
          <Logo size={26} />
          <span>DIODI</span>
        </Link>
        <nav className="nav__links" aria-label="Principal">
          {links}
        </nav>
        <ContactLink className="btn btn--sand btn--small nav__cta" message="Hola DIODI, quiero asesoría de iluminación.">
          Pedir asesoría
        </ContactLink>
        <button
          className="nav__toggle"
          type="button"
          aria-expanded={open}
          aria-controls="menu-movil"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Cerrar' : 'Menú'}
        </button>
      </div>
      <nav id="menu-movil" className="nav__panel" aria-label="Menú" hidden={!open}>
        {links}
        <ContactLink className="btn btn--sand" message="Hola DIODI, quiero asesoría de iluminación.">
          Pedir asesoría
        </ContactLink>
      </nav>
    </header>
  );
}
