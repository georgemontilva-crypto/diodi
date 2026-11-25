// Catálogo de la tienda: las 35 categorías y sus productos con foto.
// Los datos salen de tools/importar-catalogo.mjs; aquí solo se leen y se interpretan.

import categoriasJson from './tienda/categorias.json';

export interface Categoria {
  slug: string;
  label: string;
  /** Categoría madre (Decorativas, Cintas, Componentes) si es una subcategoría. */
  parent: string | null;
  /** Productos que tiene la tienda en esta categoría. */
  total: number;
  /** Productos que hay en la web (puede ser menos que el total). */
  shown: number;
  img: string | null;
}

export interface Pieza {
  id: string;
  slug: string;
  /** Nombre tal como lo registra la tienda: es la referencia que se envía por WhatsApp. */
  raw: string;
  /** Nombre para mostrar, con mayúsculas normales. */
  name: string;
  img: string | null;
  /** Categorías en las que aparece, de la más específica a la más general. */
  cats: string[];
  /** Texto normalizado para la búsqueda. */
  key: string;
  kelvin: number[];
  tone: Tono | null;
  mount: Montaje | null;
}

export type Tono = '2700k' | '3000k' | '3500k' | '4000k' | '4500k' | '5000k' | '6000k' | '6500k' | '3t' | 'rgb';
export type Montaje = 'empotrar' | 'superficial';

export const categorias: Categoria[] = categoriasJson;
export const totalTienda = categorias.filter((c) => !c.parent).reduce((t, c) => t + c.total, 0);
export const categoria = (slug: string) => categorias.find((c) => c.slug === slug) ?? null;
export const madre = (c: Categoria) => (c.parent ? categoria(c.parent) : null);
/** "Decorativas · Colgantes" o "Interruptores". */
export const ruta = (c: Categoria) => {
  const m = madre(c);
  return m ? `${m.label} · ${c.label}` : c.label;
};

/** 3028 → "3.028" (el formato español no separa los miles con cuatro cifras). */
export const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

// Los accesorios (ángulos, conectores, fuentes…) van después de las luminarias en "Destacados".
const ACCESORIO =
  /^(accesorios?|ángulos?|angulos?|conectore?s?|adaptador(es)?|carcasa|conductor|entrada|tapa|soporte|clip|control(ador)?|fuente|driver|kit|repuesto|correa|base|riel|terminal|cables?|tornillos?|cornetas?)\b/i;
const esAccesorio = (p: Pieza) => ACCESORIO.test(p.raw.trim());

export const img = (hash: string, size: 256 | 512, kind: 'p' | 'c' = 'p') => `/img/${kind}/${hash}-${size}.webp`;
export const srcSet = (hash: string, kind: 'p' | 'c' = 'p') => `${img(hash, 256, kind)} 256w, ${img(hash, 512, kind)} 512w`;

/* ───────── Nombres ───────── */

const SMALL = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'y', 'o', 'para', 'con', 'en', 'a', 'al', 'por', 'sin', 'x']);
const UPPER = new Set([
  'led',
  'rgb',
  'rgbw',
  'rgbcw',
  'cct',
  'usb',
  'pvc',
  'emt',
  'thhn',
  'awg',
  'spt',
  'dmx',
  'cob',
  'smd',
  'uv',
  'cu',
  'ac',
  'dc',
  'tv',
  'hd',
  'pir',
  'cod',
  'xl',
  'ii',
  'iii',
  'iv',
  'ups',
  'bt',
  'ir',
  'abs',
  'pc',
]);
const SPECIAL: Record<string, string> = {
  wifi: 'WiFi',
  tuya: 'Tuya',
  zigbee: 'Zigbee',
  bluetooth: 'Bluetooth',
  slimless: 'Slimless',
};
const UNITS: Record<string, string> = {
  w: 'W',
  v: 'V',
  k: 'K',
  a: 'A',
  mm: 'mm',
  cm: 'cm',
  m: 'm',
  lm: 'lm',
  hz: 'Hz',
  kw: 'kW',
  mah: 'mAh',
  ah: 'Ah',
};

function fixWord(token: string, first: boolean) {
  const low = token.toLocaleLowerCase('es');
  const unit = low.match(/^(\d+(?:[.,]\d+)?)(w|v|k|a|mm|cm|m|lm|hz|kw|mah|ah)$/);
  if (unit) return unit[1] + UNITS[unit[2]];
  if (/\d/.test(token)) return token.toUpperCase().replace(/(\d)X(\d)/g, '$1x$2');
  if (low === 'cm' || low === 'mm') return low;
  // Siglas cortas sin vocales (TF, THW, SPT): se quedan en mayúsculas.
  if (/^[^aeiouáéíóúü]{2,3}$/.test(low)) return low.toUpperCase();
  if (UPPER.has(low) || /^ip\d+$/.test(low) || /^(gu|mr|par|ar|e|g|t)\d+(\.\d+)?$/.test(low)) return low.toUpperCase();
  if (SPECIAL[low]) return SPECIAL[low];
  if (!first && SMALL.has(low)) return low;
  return low.charAt(0).toLocaleUpperCase('es') + low.slice(1);
}

/** Pasa a mayúsculas normales los nombres que vienen escritos todo en mayúsculas. */
export function prettyName(raw: string) {
  const letters = raw.replace(/[^\p{L}]/gu, '');
  const upper = letters.replace(/[^\p{Lu}]/gu, '').length;
  if (letters.length < 4 || upper / letters.length < 0.7) return raw.trim();
  let first = true;
  return raw.trim().replace(/[\p{L}\p{N}.,]+/gu, (t) => {
    const out = fixWord(t, first);
    first = false;
    return out;
  });
}

export const normalize = (s: string) => s.toLocaleLowerCase('es').normalize('NFD').replace(/[̀-ͯ]/g, '');

/* ───────── Datos que se leen del nombre ───────── */

export function readKelvin(raw: string) {
  const out: number[] = [];
  for (const m of raw.matchAll(/(\d{4})\s?K\b/gi)) {
    const k = Number(m[1]);
    if (k >= 2000 && k <= 7000 && !out.includes(k)) out.push(k);
  }
  return out.sort((a, b) => a - b);
}

function readTone(raw: string, kelvin: number[]): Tono | null {
  if (/\bRGB/i.test(raw)) return 'rgb';
  if (/\b3\s?CCT\b|\b3\s?T\b|TRICOLOR|3 TONOS|TRES TONOS|3 COLORES/i.test(raw) || kelvin.length > 1) return '3t';
  const k = kelvin[0];
  if (!k) return null;
  const known = [2700, 3000, 3500, 4000, 4500, 5000, 6000, 6500];
  const near = known.reduce((a, b) => (Math.abs(b - k) < Math.abs(a - k) ? b : a));
  return `${near}k` as Tono;
}

function readMount(raw: string): Montaje | null {
  if (/empotr/i.test(raw)) return 'empotrar';
  if (/superficial|sobrepon|adosad/i.test(raw)) return 'superficial';
  return null;
}

export const toneLabel = (t: Tono) => (t === '3t' ? '3 tonos' : t === 'rgb' ? 'RGB' : `${t.slice(0, -1)} K`);
export const mountLabel = (m: Montaje) => (m === 'empotrar' ? 'Empotrar' : 'Superficial');

export interface Dato {
  label: string;
  value: string;
}

/** Ficha corta: lo que se puede leer con seguridad en el nombre del producto. */
export function datos(p: Pieza): Dato[] {
  const r = p.raw;
  const out: Dato[] = [];
  const w = [...r.matchAll(/(?:^|[\s(x])(\d+(?:[.,]\d+)?)\s?W\b/gi)].map((m) => m[1].replace(',', '.'));
  if (w.length) out.push({ label: 'Potencia', value: [...new Set(w)].map((x) => `${x} W`).join(' · ') });
  const v = r.match(/(?:^|[\s(])(\d+(?:-\d+)?)\s?V\b/i);
  if (v) out.push({ label: 'Tensión', value: `${v[1].replace('-', '–')} V` });
  if (p.tone)
    out.push({
      label: 'Color de luz',
      value: p.tone === '3t' && p.kelvin.length > 1 ? `3 tonos (${p.kelvin.join(' K, ')} K)` : toneLabel(p.tone),
    });
  const lm = r.match(/(\d+)\s?LM\b/i);
  if (lm) out.push({ label: 'Flujo', value: `${lm[1]} lm` });
  const size = r.match(/(\d+(?:[.,]\d+)?(?:\s?[xX]\s?\d+(?:[.,]\d+)?)*)\s?(MM|CM)\b/i);
  if (size) out.push({ label: 'Medida', value: `${size[1].replace(/\s?[xX]\s?/g, ' × ')} ${size[2].toLowerCase()}` });
  const ip = r.match(/\bIP\s?(\d{2})\b/i);
  if (ip) out.push({ label: 'Protección', value: `IP${ip[1]}` });
  const base = r.match(/\b(E27|E14|E40|GU10|GU5\.3|MR16|G9|G4|AR111|PAR\d{2})\b/i);
  if (base) out.push({ label: 'Base', value: base[1].toUpperCase() });
  if (p.mount) out.push({ label: 'Instalación', value: mountLabel(p.mount) });
  return out;
}

/** Resumen de una línea para las tarjetas: "12 W · 48 V · 3 tonos". */
export function resumen(p: Pieza) {
  return datos(p)
    .filter((d) => ['Potencia', 'Tensión', 'Color de luz'].includes(d.label))
    .map((d) => (d.label === 'Color de luz' && p.tone ? toneLabel(p.tone) : d.value))
    .join(' · ');
}

/* ───────── Carga ───────── */

export interface Tienda {
  piezas: Pieza[];
  byId: Map<string, Pieza>;
  bySlug: Map<string, Pieza>;
  /** Productos de cada categoría, en el orden de la tienda ("Destacados"). */
  porCategoria: Record<string, Pieza[]>;
}

let loading: Promise<Tienda> | null = null;
let loaded: Tienda | null = null;

export const tiendaCargada = () => loaded;

/** Carga los productos (van aparte para no pesar en la portada). */
export function cargarTienda(): Promise<Tienda> {
  if (!loading) {
    loading = import('./tienda/productos.json').then(({ default: data }) => {
      const cats: Record<string, string[]> = data.categories;
      const member = new Map<string, string[]>();
      // Las subcategorías van primero: dan la categoría más precisa de cada producto.
      const ordered = [...categorias].sort((a, b) => Number(!!b.parent) - Number(!!a.parent));
      for (const c of ordered) for (const id of cats[c.slug] ?? []) member.set(id, [...(member.get(id) ?? []), c.slug]);
      const piezas: Pieza[] = (data.products as [string, string, string, string][]).map(([id, slug, raw, hash]) => {
        const name = prettyName(raw);
        const kelvin = readKelvin(raw);
        const cs = member.get(id) ?? [];
        return {
          id,
          slug,
          raw,
          name,
          img: hash || null,
          cats: cs,
          key: normalize(
            `${raw} ${cs.map((s) => ruta(categoria(s)!)).join(' ')} ${kelvin.map((k) => `${k}k`).join(' ')} ${readTone(raw, kelvin) === '3t' ? '3 tonos 3cct tricolor' : ''}`,
          ),
          kelvin,
          tone: readTone(raw, kelvin),
          mount: readMount(raw),
        };
      });
      const byId = new Map(piezas.map((p) => [p.id, p]));
      const porCategoria: Record<string, Pieza[]> = {};
      for (const c of categorias) porCategoria[c.slug] = (cats[c.slug] ?? []).map((id) => byId.get(id)!).filter(Boolean);
      loaded = { piezas, byId, bySlug: new Map(piezas.map((p) => [p.slug, p])), porCategoria };
      return loaded;
    });
  }
  return loading;
}

/** Busca por palabras: todas tienen que aparecer en el nombre o la categoría. */
export function buscar(piezas: Pieza[], q: string) {
  const words = normalize(q).split(/\s+/).filter(Boolean);
  if (!words.length) return piezas;
  return piezas.filter((p) => words.every((w) => p.key.includes(w)));
}

export type Orden = 'destacados' | 'nombre' | 'calida' | 'fria';
export const ordenes: { id: Orden; label: string }[] = [
  { id: 'destacados', label: 'Destacados' },
  { id: 'nombre', label: 'Nombre (A–Z)' },
  { id: 'calida', label: 'Luz cálida → fría' },
  { id: 'fria', label: 'Luz fría → cálida' },
];

export function ordenar(list: Pieza[], orden: Orden) {
  if (orden === 'destacados') {
    const lum = list.filter((p) => !esAccesorio(p));
    return lum.length && lum.length < list.length ? [...lum, ...list.filter(esAccesorio)] : list;
  }
  const out = [...list];
  if (orden === 'nombre') return out.sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const k = (p: Pieza) => (p.kelvin.length ? (orden === 'calida' ? p.kelvin[0] : p.kelvin[p.kelvin.length - 1]) : null);
  return out.sort((a, b) => {
    const ka = k(a);
    const kb = k(b);
    if (ka === null) return kb === null ? 0 : 1;
    if (kb === null) return -1;
    return orden === 'calida' ? ka - kb : kb - ka;
  });
}
