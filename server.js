// Servidor de producción (Railway): sirve el build de Vite con fallback de SPA.
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist');
const app = express();

app.disable('x-powered-by');
app.use(
  express.static(dir, {
    index: false,
    setHeaders(res, file) {
      // Los archivos con hash de Vite se pueden cachear para siempre.
      if (file.includes(`${path.sep}assets${path.sep}`)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=3600');
      }
    },
  }),
);
app.get('/{*splat}', (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(dir, 'index.html'));
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, '0.0.0.0', () => console.log(`DIODI en http://localhost:${port}`));
