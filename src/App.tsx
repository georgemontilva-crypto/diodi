import { lazy, Suspense, useEffect, useRef } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Nav from './components/Nav';
import Footer from './components/Footer';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import { dismissLoader } from './loader';

const Product = lazy(() => import('./pages/Product'));
const Studio = lazy(() => import('./pages/Studio'));
const Sala = lazy(() => import('./pages/Sala'));

function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView();
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  const { pathname } = useLocation();
  // En la portada, la pantalla de carga espera a que la escena esté lista; en el resto se va enseguida.
  const landedOn = useRef(pathname);
  useEffect(() => {
    if (landedOn.current !== '/') dismissLoader();
  }, []);
  // /studio dibuja una sola escena sin interfaz: de ahí salen los renders del catálogo.
  if (pathname === '/studio') {
    return (
      <Suspense fallback={null}>
        <Studio />
      </Suspense>
    );
  }
  return (
    <>
      <a className="skip" href="#contenido">
        Saltar al contenido
      </a>
      <ScrollManager />
      <Nav />
      <main id="contenido">
        <Suspense fallback={<div className="page-loading" />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/catalogo" element={<Catalog />} />
            <Route path="/producto/:slug" element={<Product />} />
            <Route path="/sala-iluminak" element={<Sala />} />
            <Route path="/contacto" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
