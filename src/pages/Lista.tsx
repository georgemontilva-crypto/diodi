import { useState } from 'react';
import { Link } from 'react-router-dom';
import StoreChooser, { useStore } from '../components/StoreChooser';
import { whatsappHref } from '../config';
import { img } from '../data/tienda';
import { cantidad, mensaje, quitar, useLista, vaciar } from '../lista';
import { useTitle } from '../hooks';

/** "Mi lista": productos guardados para consultar precio y disponibilidad con una tienda. */
export default function Lista() {
  useTitle('Mi lista — DIODI LED');
  const items = useLista();
  const [store] = useStore();
  const [confirm, setConfirm] = useState(false);
  const units = items.reduce((t, i) => t + i.qty, 0);

  return (
    <div className="shop shop--list">
      <header className="wrap shop__head">
        <h1>Mi lista</h1>
        <p className="shop__lead">
          {items.length
            ? `${items.length} ${items.length === 1 ? 'producto' : 'productos'}, ${units} ${units === 1 ? 'unidad' : 'unidades'}. Envíala a una tienda y te responden con precio y disponibilidad.`
            : 'Guarda aquí los productos que te interesan y envíalos a una tienda por WhatsApp.'}
        </p>
      </header>

      <div className="wrap">
        {items.length === 0 ? (
          <div className="shop__empty">
            <p>Tu lista está vacía.</p>
            <Link className="btn btn--umber" to="/catalogo">
              Ir al catálogo
            </Link>
          </div>
        ) : (
          <div className="listing">
            <ul className="listing__items">
              {items.map((i) => (
                <li key={i.id}>
                  <Link to={`/p/${i.slug}`} className="listing__thumb" tabIndex={-1} aria-hidden="true">
                    {i.img && <img src={img(i.img, 256)} alt="" width={96} height={96} loading="lazy" />}
                  </Link>
                  <div className="listing__text">
                    <Link to={`/p/${i.slug}`}>{i.name}</Link>
                    <span>Ref. {i.id}</span>
                  </div>
                  <div className="qty" role="group" aria-label={`Cantidad de ${i.name}`}>
                    <button type="button" onClick={() => cantidad(i.id, i.qty - 1)} aria-label="Menos">
                      −
                    </button>
                    <output>{i.qty}</output>
                    <button type="button" onClick={() => cantidad(i.id, i.qty + 1)} aria-label="Más">
                      +
                    </button>
                  </div>
                  <button type="button" className="listing__remove" onClick={() => quitar(i.id)} aria-label={`Quitar ${i.name}`}>
                    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                      <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.6" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>

            <aside className="listing__send" aria-labelledby="enviar">
              <h2 id="enviar">Enviar a una tienda</h2>
              <StoreChooser />
              <a
                className="btn btn--umber"
                href={whatsappHref(store, mensaje(store.name, items))}
                target="_blank"
                rel="noopener noreferrer"
              >
                Enviar a {store.name}
              </a>
              <p>Se abre WhatsApp con la lista escrita; solo tienes que enviarla.</p>
              {confirm ? (
                <div className="listing__confirm">
                  <span>¿Vaciar la lista?</span>
                  <button
                    type="button"
                    className="link"
                    onClick={() => {
                      vaciar();
                      setConfirm(false);
                    }}
                  >
                    Sí, vaciar
                  </button>
                  <button type="button" className="link" onClick={() => setConfirm(false)}>
                    No
                  </button>
                </div>
              ) : (
                <button type="button" className="link listing__clear" onClick={() => setConfirm(true)}>
                  Vaciar lista
                </button>
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
