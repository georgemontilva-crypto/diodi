// Genera public/renders/sala-iluminak.webp (la imagen de la portada) desde la sala 3D.
//
//   1) npm run dev          (en otra terminal)
//   2) node tools/render-sala.mjs
//
// Necesita Playwright y Chrome instalados en la máquina: npm i -g playwright

import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
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
const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('[error]', e.message));
await page.goto(`${base}/sala-iluminak?still`);
await page.waitForFunction(() => !!window.__salaShot, null, { timeout: 120000 });
const url = await page.evaluate(() => window.__salaShot('general', false));
writeFileSync(path.join(root, 'public/renders/sala-iluminak.webp'), Buffer.from(url.split(',')[1], 'base64'));
console.log('✓ sala-iluminak');
await browser.close();
