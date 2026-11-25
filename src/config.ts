// Datos de contacto de la marca. Es el único archivo que hay que tocar
// para cambiar WhatsApp, Instagram, direcciones u horarios.

export interface Store {
  id: string;
  name: string;
  city: string;
  state: string;
  /** Dirección; vacía mientras la tienda no la tenga publicada. */
  address: string;
  hours?: string;
  /** WhatsApp en formato internacional, solo dígitos. */
  whatsapp?: string;
  mapUrl?: string;
  /** Tienda por abrir: se muestra, pero no recibe pedidos. */
  soon?: boolean;
}

export const stores: Store[] = [
  {
    id: 'maracaibo',
    name: 'DIODI Maracaibo',
    city: 'Maracaibo',
    state: 'Zulia',
    address: 'Calle 72 con Av. 13A, Tierra Negra',
    hours: '9:00 a. m. – 6:00 p. m.',
    whatsapp: '584246164939',
    mapUrl: 'https://maps.google.com/?q=10.668939,-71.617508',
  },
  {
    id: 'valencia',
    name: 'DIODI Valencia',
    city: 'Valencia',
    state: 'Carabobo',
    address: '',
    whatsapp: '584129471944',
  },
  {
    id: 'chacao',
    name: 'DIODI Chacao',
    city: 'Chacao, Caracas',
    state: 'Miranda',
    address: '',
    whatsapp: '584128894544',
  },
  {
    id: 'prisma',
    name: 'Prisma',
    city: 'Boleíta, Caracas',
    state: 'Miranda',
    address: 'Edificio San Pablo, Local A, 4ta. Transversal, Urb. Boleíta, Municipio Sucre',
    soon: true,
  },
  {
    id: 'michelena',
    name: 'DIODI Michelena',
    city: 'San Diego, Valencia',
    state: 'Carabobo',
    address: 'Av. Principal, Parcela 7, Manzana MC-6, PB, Urb. Complejo Los Jarales',
    soon: true,
  },
];

/** Tiendas abiertas que atienden por WhatsApp. */
export const openStores = stores.filter((s) => !s.soon && s.whatsapp);

export const site = {
  name: 'DIODI LED',
  tagline: 'Light of things',
  claim: 'Estilo, diseño y asesoría en iluminación.',
  // Usuario de Instagram sin @ (ej. "diodiled"). Vacío = no se muestra el enlace.
  instagram: '',
};

export function whatsappHref(store: Store, message: string) {
  return `https://wa.me/${store.whatsapp}?text=${encodeURIComponent(message)}`;
}

/** Enlace de contacto general: lleva a las tiendas, donde cada una tiene su WhatsApp. */
export function contactHref(_message?: string): string {
  return '/tiendas';
}

export const isExternal = (href: string) => /^https?:/.test(href);
