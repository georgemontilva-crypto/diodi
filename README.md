# DIODI LED — sitio web

Sitio de catálogo de DIODI LED con visor 3D interactivo de cada luminaria.

- **Stack:** React 19 + Vite + TypeScript, three.js para el 3D, Express para servir el build.
- **Sin base de datos ni variables de entorno.** El catálogo vive en `src/data/catalog.ts`.

## Comandos

```bash
npm install      # instalar dependencias
npm run dev      # desarrollo en http://localhost:5173
npm run build    # verificación de tipos + build de producción en dist/
npm start        # sirve dist/ (lo que usa Railway)
```

## Despliegue en Railway

Railway detecta el proyecto solo: ejecuta `npm run build` y luego `npm start`.
El servidor (`server.js`) usa la variable `PORT` que Railway asigna.

## Dónde se cambia cada cosa

| Qué                                 | Archivo               |
| ----------------------------------- | --------------------- |
| WhatsApp, Instagram, direcciones    | `src/config.ts`       |
| Productos, textos y fichas técnicas | `src/data/catalog.ts` |
| Modelos 3D (hechos por código)      | `src/three/models.ts` |
| Escenario, cámara y controles 3D    | `src/three/stage.ts`  |
| Colores, tipografía y estilos       | `src/styles.css`      |
| Fotos de producto                   | `public/img/`         |
| Imágenes de las tarjetas (renders)  | `public/renders/`     |

## Agregar un producto

1. Añadir su entrada en `src/data/catalog.ts`.
2. Si la forma es nueva, crear su modelo en `src/three/models.ts` y registrarlo en `buildLamp`.
3. Regenerar las imágenes de tarjeta (ver abajo).

## Regenerar los renders de las tarjetas

Las imágenes de `public/renders/` salen de las mismas escenas 3D del sitio.

```bash
npm i -g playwright        # una sola vez
npm run dev                # en una terminal
node tools/render.mjs      # en otra
```
