import { Link } from 'react-router-dom';
import { useTitle } from '../hooks';

export default function NotFound() {
  useTitle('Página no encontrada — DIODI LED');
  return (
    <div className="notfound">
      <div className="wrap">
        <h1>Esta página está a oscuras.</h1>
        <p>La dirección no existe o el producto ya no está en el catálogo.</p>
        <Link className="btn btn--sand" to="/catalogo">
          Ir al catálogo
        </Link>
      </div>
    </div>
  );
}
