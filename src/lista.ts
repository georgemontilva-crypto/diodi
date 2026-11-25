// "Mi lista": productos que el visitante quiere consultar. Vive en este navegador
// y se envía como mensaje de WhatsApp a la tienda que elija.

import { useSyncExternalStore } from 'react';

export interface ItemLista {
  id: string;
  slug: string;
  /** Nombre tal como lo registra la tienda (así lo reconocen al leer el mensaje). */
  raw: string;
  name: string;
  img: string | null;
  qty: number;
}

const KEY = 'diodi:lista';
let items: ItemLista[] = read();
const listeners = new Set<() => void>();

function read(): ItemLista[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x) => x && typeof x.id === 'string') : [];
  } catch {
    return [];
  }
}

function write(next: ItemLista[]) {
  items = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Sin almacenamiento (modo privado estricto): la lista vive mientras la página esté abierta.
  }
  listeners.forEach((l) => l());
}

// Otra pestaña cambió la lista.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return;
    items = read();
    listeners.forEach((l) => l());
  });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useLista = () => useSyncExternalStore(subscribe, () => items);
export const enLista = (id: string) => items.some((i) => i.id === id);

export function agregar(item: Omit<ItemLista, 'qty'>, qty = 1) {
  const found = items.find((i) => i.id === item.id);
  write(found ? items.map((i) => (i.id === item.id ? { ...i, qty: i.qty + qty } : i)) : [...items, { ...item, qty }]);
}

export function quitar(id: string) {
  write(items.filter((i) => i.id !== id));
}

export function cantidad(id: string, qty: number) {
  if (qty < 1) return quitar(id);
  write(items.map((i) => (i.id === id ? { ...i, qty: Math.min(999, qty) } : i)));
}

export function vaciar() {
  write([]);
}

/** Mensaje para la tienda: una línea por producto con su referencia. */
export function mensaje(storeName: string, list: ItemLista[]) {
  const lines = list.map((i) => `• ${i.qty} × ${i.raw} (ref. ${i.id})`);
  return `Hola, ${storeName}. Quisiera precio y disponibilidad de estos productos:\n\n${lines.join('\n')}\n\nGracias.`;
}
