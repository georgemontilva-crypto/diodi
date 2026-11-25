import { useSyncExternalStore } from 'react';
import { openStores, type Store } from '../config';

// La tienda elegida se recuerda entre visitas: es la que suele quedarle cerca al cliente.
const KEY = 'diodi:tienda';
const listeners = new Set<() => void>();
let current = (() => {
  try {
    return localStorage.getItem(KEY) ?? openStores[0].id;
  } catch {
    return openStores[0].id;
  }
})();

export function useStore(): [Store, (id: string) => void] {
  const id = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
  );
  const set = (next: string) => {
    current = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // Sin almacenamiento: vale para esta visita.
    }
    listeners.forEach((l) => l());
  };
  return [openStores.find((s) => s.id === id) ?? openStores[0], set];
}

/** Selector de tienda para enviar consultas por WhatsApp. */
export default function StoreChooser({ label = 'Tienda' }: { label?: string }) {
  const [store, setStore] = useStore();
  return (
    <div className="storechooser">
      <span className="storechooser__label" id="lbl-tienda">
        {label}
      </span>
      <div className="storechooser__options" role="radiogroup" aria-labelledby="lbl-tienda">
        {openStores.map((s) => (
          <button key={s.id} type="button" role="radio" aria-checked={store.id === s.id} onClick={() => setStore(s.id)}>
            {s.city.split(',')[0]}
          </button>
        ))}
      </div>
    </div>
  );
}
