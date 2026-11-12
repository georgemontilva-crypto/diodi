// Catálogo de DIODI. Cada producto apunta a un modelo 3D (src/three/models.ts).
// Para sumar un producto: agregar su entrada aquí y, si la forma es nueva, su modelo.

export type ModelId = 'earthtone' | 'midnight' | 'trend' | 'spot360' | 'lamba' | 'pendantDisc' | 'pendantDome';

export type CategoryId = 'mesa' | 'colgante' | 'empotrado';

export const categories: { id: CategoryId; label: string; singular: string }[] = [
  { id: 'mesa', label: 'Lámparas de mesa', singular: 'Lámpara de mesa' },
  { id: 'colgante', label: 'Colgantes', singular: 'Colgante' },
  { id: 'empotrado', label: 'Empotrados', singular: 'Empotrado' },
];

export interface Finish {
  id: string;
  label: string;
  swatch: string;
}

export interface Tone {
  id: string;
  label: string;
  /** Color de la luz en la escena 3D. */
  color: string;
}

export const tones: Record<'calida' | 'neutra' | 'fria', Tone> = {
  calida: { id: 'calida', label: 'Cálida', color: '#ffb163' },
  neutra: { id: 'neutra', label: 'Neutra', color: '#ffd9b0' },
  fria: { id: 'fria', label: 'Fría', color: '#e6ecff' },
};

export interface Product {
  slug: string;
  name: string;
  /** Texto fantasma en la pared de la escena, como en las piezas gráficas de la marca. */
  ghost: string;
  category: CategoryId;
  model: ModelId;
  summary: string;
  description: string;
  finishes: Finish[];
  /** Tonos de luz que se pueden probar en el visor. El primero es el inicial. */
  tones: Tone[];
  /** Controles extra del visor. */
  controls: ('tilt' | 'explode')[];
  specs: [string, string][];
  photos: { src: string; alt: string }[];
  /** Pista que se muestra sobre el visor. */
  hint: string;
}

const NEGRO: Finish = { id: 'negro', label: 'Negro', swatch: '#161514' };
const BLANCO: Finish = { id: 'blanco', label: 'Blanco', swatch: '#ece8e1' };
const TIERRA: Finish = { id: 'tierra', label: 'Tierra', swatch: '#6a4e3c' };

export const products: Product[] = [
  {
    slug: 'earthtone',
    name: 'Earthtone',
    ghost: 'EARTHTONE',
    category: 'mesa',
    model: 'earthtone',
    summary: 'Una línea de luz dentro de vidrio ámbar.',
    description:
      'Un filamento LED vertical recorre el cuerpo de vidrio ámbar y la pantalla cónica devuelve la luz hacia la mesa. Encendida es un punto cálido; apagada, una pieza de color tierra que se sostiene sola.',
    finishes: [TIERRA],
    tones: [tones.calida],
    controls: [],
    specs: [
      ['Tipo', 'Lámpara de mesa'],
      ['Cuerpo', 'Vidrio ámbar'],
      ['Acabado', 'Tierra mate'],
      ['Fuente de luz', 'Filamento LED vertical'],
      ['Tono de luz', 'Cálido'],
    ],
    photos: [{ src: '/img/earthtone-1.webp', alt: 'Lámpara de mesa Earthtone encendida sobre fondo oscuro' }],
    hint: 'Arrastra para girarla',
  },
  {
    slug: 'midnight',
    name: 'Midnight',
    ghost: 'MIDNIGHT',
    category: 'mesa',
    model: 'midnight',
    summary: 'Un disco de luz sobre un tallo mínimo.',
    description:
      'La pantalla es un disco acanalado que esconde la fuente y deja caer una luz pareja sobre la superficie. En negro se pierde en la noche y solo queda el círculo encendido; en blanco, toda la pieza brilla.',
    finishes: [NEGRO, BLANCO],
    tones: [tones.calida],
    controls: [],
    specs: [
      ['Tipo', 'Lámpara de mesa'],
      ['Pantalla', 'Disco acanalado'],
      ['Acabados', 'Negro mate · Blanco mate'],
      ['Emisión', 'Difusa, hacia abajo'],
      ['Tono de luz', 'Cálido'],
    ],
    photos: [
      { src: '/img/midnight-1.webp', alt: 'Lámpara de mesa Midnight en negro, encendida' },
      { src: '/img/midnight-2.webp', alt: 'Lámpara de mesa Midnight en blanco, encendida' },
    ],
    hint: 'Arrastra para girarla y prueba el acabado',
  },
  {
    slug: 'trend',
    name: 'Trend',
    ghost: 'TREND',
    category: 'mesa',
    model: 'trend',
    summary: 'Pantalla plisada, base cuadrada.',
    description:
      'Una pantalla plisada sobre un tallo recto y una base cuadrada. La luz sale por debajo de la pantalla y dibuja un círculo cálido alrededor de la base, sin deslumbrar a quien se sienta al lado.',
    finishes: [NEGRO],
    tones: [tones.calida],
    controls: [],
    specs: [
      ['Tipo', 'Lámpara de mesa'],
      ['Pantalla', 'Plisada, cónica'],
      ['Base', 'Cuadrada'],
      ['Acabado', 'Negro mate'],
      ['Tono de luz', 'Cálido'],
    ],
    photos: [{ src: '/img/trend-1.webp', alt: 'Lámpara de mesa Trend en negro, encendida' }],
    hint: 'Arrastra para girarla',
  },
  {
    slug: 'spotlight-360',
    name: 'Spotlight 360',
    ghost: 'SPOTLIGHT 360',
    category: 'empotrado',
    model: 'spot360',
    summary: 'Empotrado de 10 W que apunta a donde lo necesites.',
    description:
      'Queda al ras del techo y, cuando hace falta, el cuerpo sale, se inclina hasta 90° y gira 360° para llevar la luz a un cuadro, una mesa o una pared. Tiene tres tonos seleccionables en la misma luminaria.',
    finishes: [NEGRO, BLANCO],
    tones: [tones.calida, tones.neutra, tones.fria],
    controls: ['tilt'],
    specs: [
      ['Potencia', '10 W'],
      ['Flujo luminoso', '900 lm'],
      ['Temperatura', '3 tonos seleccionables'],
      ['Medidas', 'ø 9 × 9,6 cm'],
      ['Colores', 'Blanco · Negro'],
      ['Material', 'Aluminio'],
      ['Protección', 'IP20'],
      ['Voltaje', '85–265 V'],
      ['Ajuste vertical', '90°'],
      ['Rotación horizontal', '360°'],
    ],
    photos: [
      { src: '/img/spotlight-360-1.webp', alt: 'Spotlight 360 en negro y en blanco, empotrados en el techo' },
      { src: '/img/spotlight-360-2.webp', alt: 'Ficha técnica del Spotlight 360 de 10 W' },
      { src: '/img/spotlight-360-3.webp', alt: 'Spotlight 360 inclinado: ajuste vertical de 90° y rotación de 360°' },
    ],
    hint: 'Arrastra para girarlo 360° e inclínalo con el control',
  },
  {
    slug: 'lamba',
    name: 'Lamba',
    ghost: 'LAMBA',
    category: 'empotrado',
    model: 'lamba',
    summary: 'Un downlight pensado pieza por pieza.',
    description:
      'Disipador de aluminio, LED OSRAM y una óptica de 36° dentro de un aro que protege contra polvo y salpicaduras. Reproduce los colores con un CRI de 90, para que los materiales se vean como son.',
    finishes: [BLANCO, NEGRO],
    tones: [tones.calida],
    controls: ['explode'],
    specs: [
      ['Tipo', 'Downlight empotrado'],
      ['Índice de protección', 'IP54'],
      ['Reproducción cromática', 'CRI 90'],
      ['Factor de potencia', '0,9'],
      ['Ángulo de apertura', '36°'],
      ['Material', 'Aluminio'],
      ['LED', 'OSRAM Opto Semiconductors'],
    ],
    photos: [{ src: '/img/lamba-1.webp', alt: 'Bocetos y despiece del downlight Lamba con sus especificaciones' }],
    hint: 'Mueve el control para ver su despiece',
  },
  {
    slug: 'colgante-plato',
    name: 'Colgante Plato',
    ghost: 'PLATO',
    category: 'colgante',
    model: 'pendantDisc',
    summary: 'Negro por fuera, dorado por dentro.',
    description:
      'Un plato amplio y bajo, negro mate por fuera y dorado martillado por dentro. El interior rebota la luz y la vuelve más cálida; sobre una mesa o una barra abre un círculo ancho.',
    finishes: [NEGRO],
    tones: [tones.calida, tones.neutra],
    controls: [],
    specs: [
      ['Tipo', 'Lámpara colgante'],
      ['Exterior', 'Negro mate'],
      ['Interior', 'Dorado martillado'],
      ['Emisión', 'Directa, apertura amplia'],
    ],
    photos: [
      { src: '/img/colgante-plato-1.webp', alt: 'Colgante Plato visto desde abajo, con el interior dorado encendido' },
      { src: '/img/colgantes-1.webp', alt: 'Colgantes Plato y Domo instalados juntos' },
    ],
    hint: 'Arrastra hacia arriba para ver el interior',
  },
  {
    slug: 'colgante-domo',
    name: 'Colgante Domo',
    ghost: 'DOMO',
    category: 'colgante',
    model: 'pendantDome',
    summary: 'Luz concentrada con interior dorado.',
    description:
      'La forma cerrada del domo concentra la luz hacia abajo y deja ver el brillo dorado solo desde ciertos ángulos. Funciona solo o combinado con el Plato a distintas alturas.',
    finishes: [NEGRO],
    tones: [tones.calida, tones.neutra],
    controls: [],
    specs: [
      ['Tipo', 'Lámpara colgante'],
      ['Exterior', 'Negro mate'],
      ['Interior', 'Dorado martillado'],
      ['Emisión', 'Directa, concentrada'],
    ],
    photos: [
      { src: '/img/colgante-domo-1.webp', alt: 'Colgante Domo visto desde abajo, con el interior dorado encendido' },
      { src: '/img/colgantes-1.webp', alt: 'Colgantes Plato y Domo instalados juntos' },
    ],
    hint: 'Arrastra hacia arriba para ver el interior',
  },
];

export const bySlug = (slug: string) => products.find((p) => p.slug === slug);
export const categoryOf = (p: Product) => categories.find((c) => c.id === p.category)!;
