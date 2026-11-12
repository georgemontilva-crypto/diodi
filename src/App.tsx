import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Nav from './components/Nav';
import Footer from './components/Footer';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';

const Product = lazy(() => import('./pages/Product'));
const Studio = lazy(() => import('./pages/Studio'));

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
            <Route path="/contacto" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
