// Importa el catálogo de la tienda DIODI desde las páginas guardadas del sitio de catálogo.
//
//   node tools/importar-catalogo.mjs <carpeta>
//
// <carpeta> es la descarga del sitio: index.html, pages/*.html e images/*.webp.
// Se pueden añadir más páginas (por ejemplo, la página 2 o 3 de una categoría) en
// pages/ con cualquier nombre: el script reconoce la categoría y la página por su contenido
// y suma los productos sin duplicarlos.
//
// Escribe:
//   src/data/tienda/categorias.json   categorías, totales y foto de portada
//   src/data/tienda/productos.json    productos y su orden dentro de cada categoría
//   public/img/p/*.webp, public/img/c/*.webp   fotos en 256 y 512 px

import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const src = process.argv[2];
if (!src || !existsSync(path.join(src, 'pages'))) {
  console.error('Uso: node tools/importar-catalogo.mjs <carpeta con pages/ e images/>');
  process.exit(1);
}
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Une los fragmentos de datos que Next.js deja en la página. */
function payload(html) {
  let out = '';
  for (const m of html.matchAll(/self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g)) out += JSON.parse(`"${m[1]}"`);
  return out;
}

/** Texto visible de la página, una línea por nodo. */
function visibleText(html) {
  const body = html.replace(/<(script|style)[\s\S]*?<\/\1>/g, '').replace(/<[^>]+>/g, '\n');
  const decode = (s) =>
    s
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;|&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ');
  return body
    .split('\n')
    .map((l) => decode(l).trim())
    .filter(Boolean);
}

const read = (f) => readFileSync(f, 'utf8');
const pagesDir = path.join(src, 'pages');

// Algunas categorías llevan un número en su dirección original ("solar-41").
const cleanSlug = (s) => s.replace(/-\d+$/, '');

/* ───────── Categorías ───────── */

const catHtml = read(path.join(pagesDir, 'categorias.html'));
const catData = payload(catHtml);
const order = [];
for (const m of catData.matchAll(/\["\$","li","\d+",\{"children":\["\$","\$L\w+",null,\{"href":"\/categoria\/([^"?]+)"/g)) {
  const seg = catData.slice(m.index, m.index + 1500);
  const img = seg.match(/"src":"\/img\/c\/\d+\/([0-9a-f]+)-512\.webp"/);
  if (!order.some((c) => c.source === m[1])) order.push({ source: m[1], img: img ? img[1] : null });
}
// El texto visible trae, en el mismo orden: [padre,] nombre, total, "productos".
const lines = visibleText(catHtml);
const start = lines.indexOf('Buscar en el catálogo');
const entries = [];
let buf = [];
for (let i = start + 1; i < lines.length - 1; i++) {
  if (/^\d+$/.test(lines[i]) && lines[i + 1] === 'productos') {
    entries.push({ names: buf.slice(-2), total: Number(lines[i]) });
    buf = [];
    i++;
  } else buf.push(lines[i]);
}
if (entries.length !== order.length) throw new Error(`Categorías: ${order.length} enlaces y ${entries.length} nombres`);
const sources = order.map((c) => c.source);
const categories = order.map((c, i) => {
  const parent = sources.find((p) => p !== c.source && c.source.startsWith(p + '-'));
  const names = entries[i].names;
  return {
    slug: cleanSlug(c.source),
    source: c.source,
    label: names[names.length - 1],
    parent: parent ? cleanSlug(parent) : null,
    total: entries[i].total,
    img: c.img,
  };
});
const byLabel = new Map(
  categories.map((c) => [c.parent ? `${categories.find((p) => p.slug === c.parent).label} · ${c.label}` : c.label, c]),
);

/* ───────── Productos ───────── */

const products = new Map();
const lists = new Map(); // slug → [{page, ids}]
for (const file of readdirSync(pagesDir).filter((f) => f.endsWith('.html'))) {
  const html = read(path.join(pagesDir, file));
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1]?.replace(/ · DIODI$/, '').replace(/&amp;/g, '&');
  const cat = title && byLabel.get(title);
  if (!cat) continue;
  const data = payload(html);
  const page = Number((data.match(/" · página (\d+) de \d+"/) || [])[1] || 1);
  const ids = [];
  for (const m of data.matchAll(/\["\$","li","(\d+)",\{"children":\["\$","\$L\w+",null,\{"href":"\/producto\/([^"]+)"/g)) {
    const [, id, slug] = m;
    if (ids.includes(id)) continue;
    const seg = data.slice(m.index, m.index + 3000);
    const img = seg.match(/"src":"\/img\/p\/\d+\/([0-9a-f]+)-512\.webp"/);
    const name = seg.match(/\["\$","h3",null,\{[^{}]*"children":"((?:[^"\\]|\\.)*)"/);
    ids.push(id);
    if (!products.has(id))
      products.set(id, { id, slug, name: name ? JSON.parse(`"${name[1]}"`) : null, img: img ? img[1] : null });
  }
  if (!lists.has(cat.slug)) lists.set(cat.slug, []);
  lists.get(cat.slug).push({ page, ids });
}
const byCategory = {};
for (const c of categories) {
  const pages = (lists.get(c.slug) || []).sort((a, b) => a.page - b.page);
  const seen = new Set();
  byCategory[c.slug] = pages.flatMap((p) => p.ids).filter((id) => !seen.has(id) && seen.add(id));
}

// Nombres que no vinieron en la tarjeta: se toman del texto alternativo de la foto o del slug.
for (const p of products.values()) {
  if (!p.name)
    p.name = p.slug
      .replace(/-\d+$/, '')
      .replace(/-/g, ' ')
      .replace(/^\w/, (c) => c.toUpperCase());
}

/* ───────── Fotos ───────── */

const imagesDir = path.join(src, 'images');
const copy = (hash, dir) => {
  if (!hash) return false;
  let ok = true;
  for (const size of [256, 512]) {
    const from = path.join(imagesDir, `${hash}-${size}.webp`);
    if (!existsSync(from)) {
      ok = false;
      continue;
    }
    copyFileSync(from, path.join(dir, `${hash}-${size}.webp`));
  }
  return ok;
};
const pDir = path.join(root, 'public/img/p');
const cDir = path.join(root, 'public/img/c');
mkdirSync(pDir, { recursive: true });
mkdirSync(cDir, { recursive: true });
let missing = 0;
for (const p of products.values()) if (p.img && !copy(p.img, pDir)) ((p.img = null), missing++);
for (const c of categories) if (c.img && !copy(c.img, cDir)) c.img = null;

/* ───────── Salida ───────── */

const outDir = path.join(root, 'src/data/tienda');
mkdirSync(outDir, { recursive: true });
writeFileSync(
  path.join(outDir, 'categorias.json'),
  JSON.stringify(
    categories.map(({ source, ...c }) => ({ ...c, shown: byCategory[c.slug].length })),
    null,
    1,
  ) + '\n',
);
writeFileSync(
  path.join(outDir, 'productos.json'),
  JSON.stringify({
    // [id, slug, nombre, foto]
    products: [...products.values()].map((p) => [p.id, p.slug, p.name, p.img ?? '']),
    categories: byCategory,
  }) + '\n',
);

const shown = Object.values(byCategory).reduce((t, l) => t + l.length, 0);
console.log(`✓ ${categories.length} categorías, ${products.size} productos (${shown} en listados), ${missing} fotos ausentes`);
for (const c of categories) {
  const n = byCategory[c.slug].length;
  if (n < c.total) console.log(`  · ${c.slug}: ${n} de ${c.total}`);
}
