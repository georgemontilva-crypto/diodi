// Datos de contacto de la marca. Es el único archivo que hay que tocar
// para cambiar WhatsApp, Instagram o direcciones.

export const site = {
  name: 'DIODI LED',
  tagline: 'Light of things',
  claim: 'Estilo, diseño y asesoría en iluminación.',

  // Número de WhatsApp en formato internacional, solo dígitos (ej. "584141234567").
  // Mientras esté vacío, los botones de contacto llevan a la página de contacto.
  whatsapp: '',

  // Usuario de Instagram sin @ (ej. "diodiled"). Vacío = no se muestra el enlace.
  instagram: '',

  locations: [
    {
      city: 'Valencia',
      address: 'Av. 105 Eloy Blanco',
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=Av+105+Eloy+Blanco+con+Calle+13+Valencia+Venezuela',
    },
    {
      city: 'Caracas',
      address: 'Avenida Francisco de Miranda',
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=F4VV%2BG7H+Caracas',
    },
  ],
};

/** Enlace de contacto: WhatsApp con mensaje prellenado, o la página de contacto si no hay número. */
export function contactHref(message?: string): string {
  if (!site.whatsapp) return '/contacto';
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${site.whatsapp}${text}`;
}

export const isExternal = (href: string) => /^https?:/.test(href);
