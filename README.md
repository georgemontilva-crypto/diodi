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

| Qué                                  | Archivo                                                     |
| ------------------------------------ | ----------------------------------------------------------- |
| Tiendas, WhatsApp, horarios          | `src/config.ts`                                             |
| Colección 3D (textos y fichas)       | `src/data/catalog.ts`                                       |
| Catálogo completo de la tienda       | `src/data/tienda/*.json` (se generan, ver abajo)            |
| Modelos 3D (hechos por código)       | `src/three/catalog/*.ts` (por tipo) y `src/three/models.ts` |
| Piezas comunes (ópticas, riel, aros) | `src/three/parts.ts`                                        |
| Escenario, cámara y controles 3D     | `src/three/stage.ts`                                        |
| Luz que sigue al cursor (catálogo)   | `src/light.ts`                                              |
| Transiciones entre páginas           | `src/transition.ts` y `src/components/TLink.tsx`            |
| Colores, tipografía y estilos        | `src/styles.css`                                            |
| Fotos de producto                    | `public/img/`                                               |
| Imágenes de las tarjetas (renders)   | `public/renders/`                                           |

## Actualizar el catálogo completo

El catálogo de `/catalogo` (35 categorías, fotos reales) sale de las páginas guardadas del sitio de catálogo de DIODI.

1. Guardar el sitio en una carpeta con `pages/*.html` e `images/*.webp` (si faltan páginas, por ejemplo la 2 o la 3 de una categoría, se agregan a `pages/` con cualquier nombre).
2. Ejecutar `node tools/importar-catalogo.mjs <carpeta>`.
3. El script reescribe `src/data/tienda/` y copia las fotos a `public/img/p` y `public/img/c`, y dice qué categorías siguen incompletas.

## Agregar un producto a la colección 3D

1. Añadir su entrada en `src/data/catalog.ts`.
2. Si la forma es nueva, crear su modelo en el archivo de su tipo dentro de `src/three/catalog/` (magnético, empotrado, superficie, aplique, colgante) y registrarlo en `buildLamp` (`src/three/models.ts`).
3. Regenerar las imágenes de tarjeta (ver abajo).

## Regenerar los renders de las tarjetas

Las imágenes de `public/renders/` salen de las mismas escenas 3D del sitio.

```bash
npm i -g playwright        # una sola vez
npm run dev                # en una terminal
node tools/render.mjs      # en otra
```
