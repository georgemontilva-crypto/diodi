// Genera las imágenes de public/renders a partir de las escenas 3D (ruta /studio).
//
//   1) npm run dev          (en otra terminal)
//   2) node tools/render.mjs
//
// Necesita Playwright y Chrome instalados en la máquina (no son dependencias del sitio):
//   npm i -g playwright
// Opcional: BASE=http://localhost:5173  OUT=public/renders  ONLY=midnight,trend

import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let chromium;
for (const id of ['playwright', '/opt/npm-tools/node_modules/playwright']) {
  try {
    ({ chromium } = require(id));
    break;
  } catch {}
}
if (!chromium) throw new Error('Instala Playwright: npm i -g playwright');

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = process.env.BASE || 'http://localhost:5173';
const out = path.resolve(root, process.env.OUT || 'public/renders');
const only = process.env.ONLY?.split(',');
mkdirSync(out, { recursive: true });

// Los slugs salen del catálogo para no mantener dos listas.
const slugs = [...readFileSync(path.join(root, 'src/data/catalog.ts'), 'utf8').matchAll(/^\s+slug: '([^']+)'/gm)].map(
  (m) => m[1],
);

const jobs = [];
for (const slug of slugs) {
  jobs.push({ name: `${slug}-on`, w: 960, h: 1200, query: `slug=${slug}&power=1` });
  jobs.push({ name: `${slug}-off`, w: 960, h: 1200, query: `slug=${slug}&power=0` });
}
// Demo de tonos de la portada: el Spotlight 360 apuntando a la pared.
for (const [id, hex] of [
  ['calida', 'ffb163'],
  ['neutra', 'ffd9b0'],
  ['fria', 'e6ecff'],
]) {
  jobs.push({
    name: `tono-${id}`,
    w: 1600,
    h: 1000,
    query: `slug=spotlight-360&power=1&tilt=0.74&tone=${hex}&az=-0.62&distance=0.98&sx=0.1&sy=0.07&ghostWidth=4.4&ghostY=1.1&bare=1`,
  });
}

// Escenarios arquitectónicos: cada uno en luz y en plano (comparador de Asesoría y respaldo del hero).
for (const scene of ['interior', 'fachada']) {
  jobs.push({ name: `escena-${scene}-luz`, w: 1600, h: 1000, query: `arch=${scene}&split=0&view=wide` });
  jobs.push({ name: `escena-${scene}-plano`, w: 1600, h: 1000, query: `arch=${scene}&split=1&view=wide` });
}

const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
for (const job of jobs) {
  if (only && !only.some((o) => job.name.startsWith(o) || job.name.endsWith(o))) continue;
  // Se dibuja al doble de resolución y se reduce al exportar: bordes suaves sin depender del antialiasing del equipo.
  const page = await browser.newPage({ viewport: { width: job.w, height: job.h }, deviceScaleFactor: 2 });
  page.on('pageerror', (e) => console.log('[error]', e.message));
  await page.goto(`${base}/studio?${job.query}`);
  await page.waitForFunction(() => window.__stageReady === true, null, { timeout: 90000 });
  const data = await page.evaluate(() => window.__capture(0.9, 2));
  writeFileSync(path.join(out, `${job.name}.webp`), Buffer.from(data.split(',')[1], 'base64'));
  console.log('✓', job.name);
  await page.close();
}
await browser.close();
