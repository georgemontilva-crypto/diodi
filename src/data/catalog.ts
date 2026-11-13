// Catálogo de DIODI. Cada producto apunta a un modelo 3D (src/three/models.ts).
// Para sumar un producto: agregar su entrada aquí y, si la forma es nueva, su modelo.

export type ModelId =
  | 'earthtone'
  | 'midnight'
  | 'trend'
  | 'pendantDisc'
  | 'pendantDome'
  | 'pendantStone'
  | 'pendantSpiral'
  | 'spot360'
  | 'surfaceCan'
  | 'surfaceTilt'
  | 'lamba'
  | 'miniSpot'
  | 'linearFour'
  | 'magSpot'
  | 'magGrille'
  | 'magLinear'
  | 'magGlobe'
  | 'wallCurved'
  | 'wallTrap'
  | 'wallBifocus'
  | 'wallEmerald'
  | 'wallCube'
  | 'bollard';

export type CategoryId = 'magnetico' | 'empotrado' | 'superficie' | 'aplique' | 'exterior' | 'colgante' | 'mesa';

export const categories: { id: CategoryId; label: string; singular: string; intro: string }[] = [
  {
    id: 'magnetico',
    label: 'Sistema magnético',
    singular: 'Sistema magnético',
    intro: 'Un riel en el techo y módulos que se enganchan con imán: se mueven, se cambian y se suman sin herramientas.',
  },
  {
    id: 'empotrado',
    label: 'Empotrados',
    singular: 'Empotrado',
    intro: 'Quedan al ras del techo: solo se ve el aro y la luz que dejan.',
  },
  {
    id: 'superficie',
    label: 'De superficie',
    singular: 'De superficie',
    intro: 'Para techos donde no se puede empotrar. El cuerpo queda a la vista y forma parte del espacio.',
  },
  {
    id: 'aplique',
    label: 'Apliques de pared',
    singular: 'Aplique de pared',
    intro: 'Dibujan la luz sobre la pared, hacia arriba y hacia abajo. Con protección para exterior.',
  },
  { id: 'exterior', label: 'Exterior', singular: 'Exterior', intro: 'Para caminos, jardines y terrazas.' },
  {
    id: 'colgante',
    label: 'Colgantes',
    singular: 'Colgante',
    intro: 'Piezas que bajan del techo y marcan el centro de una mesa o una sala.',
  },
  { id: 'mesa', label: 'Lámparas de mesa', singular: 'Lámpara de mesa', intro: 'Luz de cerca, para acompañar.' },
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
  calida: { id: 'calida', label: 'Cálida', color: '#ffc387' },
  neutra: { id: 'neutra', label: 'Neutra', color: '#ffe3c6' },
  fria: { id: 'fria', label: 'Fría', color: '#e9efff' },
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
  /** Nombre del selector de acabados cuando no es el cuerpo lo que cambia (p. ej. "Reflector"). */
  finishLabel?: string;
  /** Tonos de luz que se pueden probar en el visor. El primero es el inicial. */
  tones: Tone[];
  /** Versiones del mismo producto (número de haces, de LED...). Empieza en `initial` o en la primera. */
  variants?: { label: string; initial?: string; options: { id: string; label: string }[] };
  /** Controles extra del visor. */
  controls: ('tilt' | 'pan' | 'explode')[];
  /** Inclinación máxima en grados (por defecto 90). */
  tiltMax?: number;
  specs: [string, string][];
  photos: { src: string; alt: string }[];
  /** Pista que se muestra sobre el visor. */
  hint: string;
}

const NEGRO: Finish = { id: 'negro', label: 'Negro', swatch: '#161514' };
const BLANCO: Finish = { id: 'blanco', label: 'Blanco', swatch: '#ece8e1' };
const TIERRA: Finish = { id: 'tierra', label: 'Tierra', swatch: '#6a4e3c' };
const ORO: Finish = { id: 'oro', label: 'Oro', swatch: '#d9a745' };
const CROMO: Finish = { id: 'cromo', label: 'Cromo', swatch: '#d9dadc' };
const PIEDRA: Finish = { id: 'piedra', label: 'Piedra', swatch: '#b5afa4' };
const ARENA: Finish = { id: 'arena', label: 'Arena', swatch: '#b99c79' };

const RIEL: [string, string] = ['Montaje', 'Riel magnético'];
const FUENTE: [string, string] = ['Fuente del sistema', 'Inteligente Tuya Zigbee, 200 W (REF MS33)'];

export const products: Product[] = [
  /* ── Sistema magnético ── */
  {
    slug: 'spot-magnetico',
    name: 'Spot magnético',
    ghost: 'SPOT',
    category: 'magnetico',
    model: 'magSpot',
    summary: 'Un cilindro que apunta a donde lo lleves.',
    description:
      'Se engancha al riel con imán y se desliza a cualquier punto. El cabezal se inclina y gira sobre su eje para llevar la luz a un cuadro, una repisa o una mesa, y cambia de sitio en segundos cuando cambia el espacio.',
    finishes: [NEGRO, BLANCO],
    tones: [tones.calida, tones.neutra, tones.fria],
    controls: ['tilt', 'pan'],
    specs: [
      ['Tipo', 'Spot orientable'],
      RIEL,
      ['Orientación', 'Inclinable y giratorio 360°'],
      ['Acabados', 'Negro · Blanco'],
      FUENTE,
    ],
    photos: [],
    hint: 'Inclina y gira el cabezal con los controles',
  },
  {
    slug: 'lineal-de-puntos',
    name: 'Lineal de puntos',
    ghost: 'PUNTOS',
    category: 'magnetico',
    model: 'magGrille',
    summary: 'Una fila de LED, cada uno en su celda.',
    description:
      'Cada LED queda al fondo de una celda negra que oculta la fuente: se ve la luz sobre la superficie, no el punto que la emite. En 6 o 12 LED, para acentuar una barra, un pasillo o una vitrina.',
    finishes: [NEGRO, BLANCO],
    tones: [tones.calida, tones.neutra],
    variants: {
      label: 'LED',
      options: [
        { id: '6', label: '6' },
        { id: '12', label: '12' },
      ],
    },
    controls: [],
    specs: [
      ['Tipo', 'Lineal de acento'],
      RIEL,
      ['Versiones', '6 y 12 LED'],
      ['Óptica', 'Celdas antideslumbrantes'],
      ['Acabados', 'Negro · Blanco'],
      FUENTE,
    ],
    photos: [],
    hint: 'Arrastra para verlo desde otro ángulo',
  },
  {
    slug: 'lineal-difuso',
    name: 'Lineal difuso',
    ghost: 'LINEAL',
    category: 'magnetico',
    model: 'magLinear',
    summary: 'Una línea de luz continua.',
    description:
      'Un difusor opal reparte la luz sin puntos ni sombras duras. Es la luz general del sistema: la que llena el espacio mientras los spots ponen el acento.',
    finishes: [NEGRO, BLANCO],
    tones: [tones.calida, tones.neutra, tones.fria],
    controls: [],
    specs: [['Tipo', 'Lineal de luz general'], RIEL, ['Difusor', 'Opal'], ['Acabados', 'Negro · Blanco'], FUENTE],
    photos: [],
    hint: 'Arrastra para verlo desde otro ángulo',
  },
  {
    slug: 'globo-magnetico',
    name: 'Globo magnético',
    ghost: 'GLOBO',
    category: 'magnetico',
    model: 'magGlobe',
    summary: 'Una esfera de luz colgada del riel.',
    description:
      'Una esfera opal que brilla entera y suaviza el conjunto. Convive en el mismo riel con spots y lineales, y aporta el punto decorativo sin sumar otra instalación.',
    finishes: [NEGRO, BLANCO],
    tones: [tones.calida, tones.neutra],
    controls: [],
    specs: [['Tipo', 'Módulo decorativo'], RIEL, ['Difusor', 'Esfera opal'], ['Acabados', 'Negro · Blanco'], FUENTE],
    photos: [],
    hint: 'Arrastra para verlo desde otro ángulo',
  },

  /* ── Empotrados ── */
  {
    slug: 'lamba',
    name: 'Lamba',
    ghost: 'LAMBA',
    category: 'empotrado',
    model: 'lamba',
    summary: 'Un downlight pensado pieza por pieza.',
    description:
      'Disipador de aluminio, LED OSRAM y una óptica profunda dentro de un cono negro que esconde la fuente. Reproduce los colores con un CRI de 90, para que los materiales se vean como son.',
    finishes: [BLANCO, NEGRO],
    finishLabel: 'Aro',
    tones: [tones.calida, tones.neutra, tones.fria],
    controls: ['explode'],
    specs: [
      ['Tipo', 'Downlight empotrado antideslumbrante'],
      ['Potencias', '7 · 10 · 15 · 20 W'],
      ['Ángulo de apertura', '24° · 36°'],
      ['Reproducción cromática', 'CRI 90'],
      ['Factor de potencia', '0,9'],
      ['Índice de protección', 'IP54'],
      ['Material', 'Aluminio'],
      ['LED', 'OSRAM Opto Semiconductors'],
    ],
    photos: [{ src: '/img/lamba-1.webp', alt: 'Bocetos y despiece del downlight Lamba con sus especificaciones' }],
    hint: 'Mueve el control para ver su despiece',
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
    slug: 'mini',
    name: 'Mini',
    ghost: 'MINI',
    category: 'empotrado',
    model: 'miniSpot',
    summary: 'Un spot pequeño con el aro que elijas.',
    description:
      'El módulo es siempre el mismo; lo que cambia es el aro reflector que queda a la vista. En blanco se funde con el techo, en negro esconde la fuente, y en oro o cromo se vuelve un detalle.',
    finishes: [BLANCO, NEGRO, ORO, CROMO],
    finishLabel: 'Aro',
    tones: [tones.calida, tones.neutra],
    controls: [],
    specs: [
      ['Tipo', 'Spot empotrado'],
      ['Aro reflector', 'Intercambiable: blanco, negro, oro o cromo'],
      ['Sujeción', 'Resortes de alambre'],
      ['Cuerpo', 'Aluminio'],
    ],
    photos: [],
    hint: 'Prueba los aros y arrastra para girarlo',
  },
  {
    slug: 'lineal-4-focos',
    name: 'Lineal de 4 focos',
    ghost: 'LINEAL 4',
    category: 'empotrado',
    model: 'linearFour',
    summary: 'Cuatro focos en un solo marco.',
    description:
      'Un marco rectangular al ras del techo con cuatro focos independientes. Resuelve con una sola perforación lo que pedirían cuatro downlights: una isla de cocina, un mesón o un pasillo.',
    finishes: [BLANCO, NEGRO],
    finishLabel: 'Marco',
    tones: [tones.calida, tones.neutra],
    controls: [],
    specs: [
      ['Tipo', 'Empotrado lineal'],
      ['Focos', '4, basculantes'],
      ['Marco', 'Rectangular, al ras'],
      ['Acabados', 'Blanco · Negro'],
    ],
    photos: [],
    hint: 'Arrastra para girarlo',
  },

  /* ── De superficie ── */
  {
    slug: 'cilindro',
    name: 'Cilindro',
    ghost: 'CILINDRO',
    category: 'superficie',
    model: 'surfaceCan',
    summary: 'Un downlight que no necesita cielo raso.',
    description:
      'Se fija directo a la losa y deja el cuerpo a la vista. La óptica queda hundida en un cono negro, así que la luz baja limpia y el cilindro no deslumbra desde ningún lado.',
    finishes: [NEGRO, BLANCO],
    tones: [tones.calida, tones.neutra, tones.fria],
    controls: [],
    specs: [
      ['Tipo', 'Downlight de superficie'],
      ['Óptica', 'Reflector con cono antideslumbrante'],
      ['Acabados', 'Negro · Blanco'],
      ['Material', 'Aluminio'],
    ],
    photos: [],
    hint: 'Arrastra para verlo desde otro ángulo',
  },
  {
    slug: 'cilindro-orientable',
    name: 'Cilindro orientable',
    ghost: 'ORIENTABLE',
    category: 'superficie',
    model: 'surfaceTilt',
    summary: 'De superficie, y apunta.',
    description:
      'El cabezal bascula sobre su base y gira completo, así que una misma luminaria sirve para bañar una pared hoy y marcar una mesa mañana.',
    finishes: [NEGRO, BLANCO],
    tones: [tones.calida, tones.neutra, tones.fria],
    controls: ['tilt'],
    tiltMax: 60,
    specs: [
      ['Tipo', 'Spot de superficie orientable'],
      ['Orientación', 'Basculante y giratorio 360°'],
      ['Acabados', 'Negro · Blanco'],
      ['Material', 'Aluminio'],
    ],
    photos: [],
    hint: 'Arrastra para girarlo e inclínalo con el control',
  },

  /* ── Apliques de pared ── */
  {
    slug: 'aplique-curved',
    name: 'Curved',
    ghost: 'CURVED',
    category: 'aplique',
    model: 'wallCurved',
    summary: 'Un frente curvo que dibuja arcos de luz.',
    description:
      'Cada lente proyecta un haz hacia arriba y otro hacia abajo; juntos forman una fila de arcos sobre la pared. Se elige por número de haces: dos para un acceso, tres o cuatro para un muro largo.',
    finishes: [NEGRO],
    tones: [tones.calida],
    variants: {
      label: 'Haces',
      initial: '3',
      options: [
        { id: '2', label: '2' },
        { id: '3', label: '3' },
        { id: '4', label: '4' },
      ],
    },
    controls: [],
    specs: [
      ['Tipo', 'Aplique bidireccional'],
      ['Potencia', '4 W (2 haces) · 6 W (3 haces) · 8 W (4 haces)'],
      ['Temperatura', '3500 K'],
      ['Protección', 'IP44'],
      ['Referencias', 'HYVZ4W · HYVZ6W · HYVZ8W'],
    ],
    photos: [],
    hint: 'Cambia el número de haces y arrastra para rodearlo',
  },
  {
    slug: 'aplique-trap',
    name: 'Trap',
    ghost: 'TRAP',
    category: 'aplique',
    model: 'wallTrap',
    summary: 'Una cuña: abre arriba, concentra abajo.',
    description:
      'La forma en trapecio decide la luz: por la boca ancha sale un baño abierto hacia el techo y por la estrecha, una línea fina hacia el suelo. Protegido para exterior.',
    finishes: [NEGRO],
    tones: [tones.calida],
    controls: [],
    specs: [
      ['Tipo', 'Aplique bidireccional'],
      ['Potencia', '6 W'],
      ['Temperatura', '3500 K'],
      ['Protección', 'IP65'],
      ['Acabado', 'Negro'],
      ['Referencia', 'HY808'],
    ],
    photos: [],
    hint: 'Arrastra para rodearlo',
  },
  {
    slug: 'aplique-bifocus',
    name: 'Bifocus',
    ghost: 'BIFOCUS',
    category: 'aplique',
    model: 'wallBifocus',
    summary: 'Un cilindro, dos haces.',
    description:
      'Dos bombillos GU10, uno hacia arriba y otro hacia abajo, dibujan un reloj de arena sobre la pared. Al ser de bombillo, el tono y la apertura los eliges tú.',
    finishes: [NEGRO],
    tones: [tones.calida, tones.neutra, tones.fria],
    controls: [],
    specs: [
      ['Tipo', 'Aplique bidireccional'],
      ['Fuente de luz', '2 × GU10'],
      ['Acabado', 'Negro'],
      ['Referencia', 'MKGU10'],
    ],
    photos: [],
    hint: 'Prueba el tono y arrastra para rodearlo',
  },
  {
    slug: 'aplique-emerald',
    name: 'Emerald',
    ghost: 'EMERALD',
    category: 'aplique',
    model: 'wallEmerald',
    summary: 'Un cubo abierto que baña la pared.',
    description:
      'Abierto arriba y abajo, deja salir dos abanicos amplios de luz que llenan el muro. Con IP65, resiste lluvia directa en fachadas y terrazas.',
    finishes: [NEGRO],
    tones: [tones.neutra],
    controls: [],
    specs: [
      ['Tipo', 'Aplique bidireccional'],
      ['Potencia', '10 W'],
      ['Temperatura', '4500 K'],
      ['Protección', 'IP65'],
      ['Referencia', 'HY8020'],
    ],
    photos: [],
    hint: 'Arrastra para rodearlo',
  },
  {
    slug: 'aplique-cube',
    name: 'Cube',
    ghost: 'CUBE',
    category: 'aplique',
    model: 'wallCube',
    summary: 'Un farol cuadrado de luz pareja.',
    description:
      'Un difusor opal enmarcado en negro. No proyecta haces: alumbra hacia todos lados con una luz suave, para accesos, pasillos exteriores y balcones.',
    finishes: [NEGRO],
    tones: [tones.neutra],
    controls: [],
    specs: [
      ['Tipo', 'Aplique difuso'],
      ['Potencia', '9 W'],
      ['Temperatura', '4200 K'],
      ['Difusor', 'Opal'],
      ['Referencia', 'LB0441'],
    ],
    photos: [],
    hint: 'Arrastra para rodearlo',
  },

  /* ── Exterior ── */
  {
    slug: 'bolardo',
    name: 'Bolardo',
    ghost: 'BOLARDO',
    category: 'exterior',
    model: 'bollard',
    summary: 'Luz baja para marcar el camino.',
    description:
      'Un poste con cabezal opal que alumbra a la altura de la rodilla: se ve por dónde se pisa sin iluminar de más el jardín. Para senderos, bordes de terraza y entradas de vehículos.',
    finishes: [NEGRO],
    tones: [tones.neutra, tones.calida, tones.fria],
    controls: [],
    specs: [
      ['Tipo', 'Bolardo de jardín'],
      ['Difusor', 'Cilindro opal, 360°'],
      ['Acabado', 'Negro'],
    ],
    photos: [],
    hint: 'Arrastra para girarlo',
  },

  /* ── Colgantes ── */
  {
    slug: 'colgante-piedra',
    name: 'Piedra',
    ghost: 'PIEDRA',
    category: 'colgante',
    model: 'pendantStone',
    summary: 'Una cúpula irregular, como piedra de río.',
    description:
      'Ningún lado es igual a otro. El acabado mineral por fuera contrasta con el interior claro, que devuelve la luz del bombillo de filamento y la vuelve más cálida.',
    finishes: [PIEDRA, ARENA],
    tones: [tones.calida],
    controls: [],
    specs: [
      ['Tipo', 'Lámpara colgante'],
      ['Acabado', 'Textura mineral: piedra o arena'],
      ['Fuente de luz', 'Bombillo de filamento a la vista'],
      ['Emisión', 'Directa, hacia abajo'],
    ],
    photos: [],
    hint: 'Arrastra hacia arriba para ver el interior',
  },
  {
    slug: 'colgante-espiral',
    name: 'Espiral',
    ghost: 'ESPIRAL',
    category: 'colgante',
    model: 'pendantSpiral',
    summary: 'Una pantalla plisada que gira sobre sí misma.',
    description:
      'Los pliegues suben en espiral y la pantalla entera se enciende: la luz atraviesa el material y dibuja cada nervio. Apagada es una pieza escultórica; encendida, un farol.',
    finishes: [BLANCO],
    tones: [tones.calida],
    controls: [],
    specs: [
      ['Tipo', 'Lámpara colgante'],
      ['Pantalla', 'Plisada en espiral, translúcida'],
      ['Fuente de luz', 'Bombillo de filamento'],
      ['Emisión', 'Difusa, toda la pantalla'],
    ],
    photos: [],
    hint: 'Arrastra para girarla',
  },
  {
    slug: 'colgante-domo',
    name: 'Domo',
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
  {
    slug: 'colgante-plato',
    name: 'Plato',
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

  /* ── Lámparas de mesa ── */
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
];

/** Selección para la portada: una pieza de cada tipo. */
export const featured = [
  'spot-magnetico',
  'aplique-curved',
  'lamba',
  'colgante-piedra',
  'cilindro',
  'colgante-espiral',
  'globo-magnetico',
  'earthtone',
  'bolardo',
]
  .map((slug) => products.find((p) => p.slug === slug)!)
  .filter(Boolean);

export const bySlug = (slug: string) => products.find((p) => p.slug === slug);
export const categoryOf = (p: Product) => categories.find((c) => c.id === p.category)!;
