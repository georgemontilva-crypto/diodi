// Piezas reutilizables con detalle de fabricación: carcasas con canto matado, ópticas con chip y
// reflector, riel magnético, clips de resorte, disipadores. Los modelos se arman combinándolas.

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { beamTexture, bodyMaterial, cobTexture, grainTexture, makeGlow, mesh } from './kit';
import { at } from './lamp';

export { RoundedBoxGeometry };

/* ───────────────────────── Geometría ───────────────────────── */

/**
 * Torno con aristas limpias: cada tramo del perfil conserva su sombreado plano y solo se
 * redondea justo en la esquina, como un canto matado de fábrica.
 */
export function lathe(points: [number, number][], segments = 72) {
  const out: THREE.Vector2[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [ar, ay] = points[i];
    const [br, by] = points[i + 1];
    const len = Math.hypot(br - ar, by - ay);
    const e = Math.min(0.5, 0.006 / Math.max(len, 1e-6));
    out.push(new THREE.Vector2(ar, ay));
    if (len > 0.02) {
      out.push(new THREE.Vector2(ar + (br - ar) * e, ay + (by - ay) * e));
      out.push(new THREE.Vector2(ar + (br - ar) * (1 - e), ay + (by - ay) * (1 - e)));
    }
  }
  const last = points[points.length - 1];
  out.push(new THREE.Vector2(last[0], last[1]));
  // Los perfiles se escriben "de arriba hacia fuera y hacia abajo"; el torno de three espera el
  // sentido contrario para que las caras miren hacia fuera.
  return new THREE.LatheGeometry(out.reverse(), segments);
}

/**
 * Carcasa cilíndrica hueca con cantos matados. Va de y=0 (fondo cerrado) a y=-len (boca abierta).
 * `wall` es el grosor de pared visible en la boca.
 */
export function canGeometry(r: number, len: number, wall = 0.014, chamfer = 0.008, segments = 72) {
  const c = chamfer;
  return lathe(
    [
      [0, 0],
      [r - c, 0],
      [r, -c],
      [r, -len + c],
      [r - c, -len],
      [r - wall, -len],
      [r - wall, -len + 0.01],
    ],
    segments,
  );
}

/** Disco macizo con canto matado (bases, tapas, floreros de techo). Centro en y=0. */
export function puckGeometry(r: number, h: number, chamfer = 0.008, segments = 72) {
  const c = Math.min(chamfer, h / 2.2);
  return lathe(
    [
      [0, h / 2],
      [r - c, h / 2],
      [r, h / 2 - c],
      [r, -h / 2 + c],
      [r - c, -h / 2],
      [0, -h / 2],
    ],
    segments,
  );
}

export function roundedBox(w: number, h: number, d: number, radius = 0.012) {
  return new RoundedBoxGeometry(w, h, d, 3, Math.min(radius, w / 2.01, h / 2.01, d / 2.01));
}

/* ───────────────────────── Materiales ───────────────────────── */

export type Reflector = 'cromo' | 'oro' | 'negro' | 'blanco';

const REFLECTORS: Record<Reflector, THREE.MeshStandardMaterialParameters> = {
  cromo: { color: '#e4e4e6', metalness: 1, roughness: 0.09, envMapIntensity: 1.5 },
  oro: { color: '#d9a745', metalness: 1, roughness: 0.14, envMapIntensity: 1.5 },
  negro: { color: '#0b0b0b', metalness: 0.2, roughness: 0.34, envMapIntensity: 1.8 },
  blanco: { color: '#efece6', metalness: 0, roughness: 0.55, envMapIntensity: 0.6 },
};

export function reflectorMaterial(kind: Reflector = 'cromo') {
  return new THREE.MeshStandardMaterial({ ...REFLECTORS[kind], side: THREE.DoubleSide, dithering: true });
}

export function applyReflector(mat: THREE.MeshStandardMaterial, kind: Reflector) {
  const p = REFLECTORS[kind];
  mat.color.set(p.color as string);
  mat.metalness = p.metalness!;
  mat.roughness = p.roughness!;
  mat.envMapIntensity = p.envMapIntensity!;
}

/** Negro mate antideslumbrante del interior de los spots. */
export function baffleMaterial() {
  return new THREE.MeshStandardMaterial({
    color: '#070707',
    roughness: 0.92,
    metalness: 0,
    envMapIntensity: 0.12,
    side: THREE.DoubleSide,
  });
}

/** Aluminio de fundición o anodizado. */
export function aluminium(color = '#8d8f92', roughness = 0.42) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: 0.92,
    roughness,
    envMapIntensity: 1.7,
    bumpMap: grainTexture(),
    bumpScale: 0.35,
    dithering: true,
  });
}

export function steel() {
  return new THREE.MeshStandardMaterial({
    color: '#c4c5c7',
    metalness: 1,
    roughness: 0.34,
    envMapIntensity: 0.9,
    side: THREE.DoubleSide,
  });
}

/** Vidrio o lente transparente: casi invisible salvo por sus reflejos. */
export function lensMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    roughness: 0.04,
    metalness: 0,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
    envMapIntensity: 2.4,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
  });
}

/** Difusor opal: acrílico o vidrio blanco que brilla entero. */
export function opalMaterial() {
  return new THREE.MeshStandardMaterial({
    color: '#f1ede6',
    roughness: 0.42,
    metalness: 0,
    emissive: '#ffffff',
    emissiveIntensity: 0,
    envMapIntensity: 0.5,
    dithering: true,
  });
}

/** Pieza que emite: su color se multiplica con el encendido (supera 1 para que el resplandor la recoja). */
export function emitterMaterial(map?: THREE.Texture) {
  return new THREE.MeshBasicMaterial({ color: '#000000', map, fog: false });
}

/* ───────────────────────── Óptica ───────────────────────── */

export interface Optic {
  group: THREE.Group;
  /** Chip LED: poner su color según encendido y tono. */
  chip: THREE.MeshBasicMaterial;
  reflector: THREE.MeshStandardMaterial;
  set(color: THREE.Color, power: number): void;
}

/**
 * Módulo óptico mirando hacia -y: copa reflectora facetada, chip COB al fondo y lente frontal.
 * `r` es el radio de la boca; `depth`, el fondo de la copa.
 */
export function opticModule(r: number, depth: number, kind: Reflector = 'cromo', lens = true): Optic {
  const group = new THREE.Group();
  const reflector = reflectorMaterial(kind);
  if (kind === 'cromo' || kind === 'oro') reflector.flatShading = true;
  const back = r * 0.34;
  const cup = mesh(
    new THREE.LatheGeometry(
      [
        new THREE.Vector2(back, depth),
        new THREE.Vector2(back + (r - back) * 0.42, depth * 0.62),
        new THREE.Vector2(back + (r - back) * 0.78, depth * 0.26),
        new THREE.Vector2(r, 0),
      ],
      kind === 'cromo' || kind === 'oro' ? 36 : 64,
    ),
    reflector,
    false,
  );
  group.add(cup);

  const chip = emitterMaterial(cobTexture());
  const cob = mesh(new THREE.CircleGeometry(back * 0.98, 40), chip, false);
  cob.rotation.x = Math.PI / 2;
  group.add(at(cob, 0, depth - 0.002, 0));

  if (lens) {
    const glass = mesh(new THREE.CircleGeometry(r * 0.985, 48), lensMaterial(), false);
    glass.rotation.x = Math.PI / 2;
    glass.renderOrder = 6;
    group.add(at(glass, 0, depth * 0.04, 0));
  }

  const tmp = new THREE.Color();
  return {
    group,
    chip,
    reflector,
    set(color, power) {
      // Apagado se ve el fósforo amarillo; encendido, el blanco de la luz.
      chip.color
        .copy(tmp.set('#5a5346'))
        .lerp(color, Math.min(1, power * 1.4))
        .multiplyScalar(1 + 4.2 * power);
      reflector.emissive.copy(color);
      reflector.emissiveIntensity = (kind === 'blanco' ? 0.04 : 0.1) * power;
    },
  };
}

/** Haz visible (polvo en el aire): cono aditivo muy tenue que sale hacia -y desde el origen. */
export function beamCone(halfAngle: number, length: number, mouth = 0) {
  const mat = new THREE.MeshBasicMaterial({
    map: beamTexture(),
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
  });
  const cone = mesh(new THREE.ConeGeometry(Math.tan(halfAngle) * length + mouth, length, 48, 1, true), mat, false);
  cone.position.y = -length / 2;
  cone.renderOrder = 8;
  return { cone, mat };
}

/* ───────────────────────── Herrajes ───────────────────────── */

/** Clip de resorte de los empotrados: brazo de acero con su muelle. Sale hacia +x desde el origen. */
export function springClip(length = 0.36) {
  const g = new THREE.Group();
  const mat = steel();
  g.add(at(mesh(new THREE.BoxGeometry(length, 0.012, 0.075), mat), length / 2, 0, 0));
  const coil = mesh(new THREE.TorusGeometry(0.03, 0.009, 8, 20), mat);
  coil.rotation.y = Math.PI / 2;
  g.add(at(coil, 0.012, 0, 0.048));
  g.add(at(coil.clone(), 0.012, 0, -0.048));
  const pin = mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.13, 10), mat);
  pin.rotation.x = Math.PI / 2;
  g.add(pin);
  return g;
}

/** Disipador de aletas radiales. Base en y=0, crece hacia +y. */
export function heatSink(r: number, h: number, fins: number, mat: THREE.Material) {
  const g = new THREE.Group();
  const core = r * 0.52;
  g.add(at(mesh(new THREE.CylinderGeometry(core, core * 1.04, h, 40), mat), 0, h / 2, 0));
  const depth = r - core * 0.9;
  const geo = new THREE.BoxGeometry(depth, h * 0.94, Math.max(0.012, (r * 6.283) / fins / 3.2));
  const inst = new THREE.InstancedMesh(geo, mat, fins);
  inst.castShadow = true;
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < fins; i++) {
    const a = (i / fins) * Math.PI * 2;
    m4.makeRotationY(-a);
    m4.setPosition(Math.cos(a) * (core * 0.9 + depth / 2), h * 0.5, Math.sin(a) * (core * 0.9 + depth / 2));
    inst.setMatrixAt(i, m4);
  }
  g.add(inst);
  return g;
}

/* ───────────────────────── Sistema magnético ───────────────────────── */

export const TRACK = { w: 0.092, h: 0.15 };

/**
 * Riel magnético de superficie a lo largo de x, colgando de y=0 hacia abajo.
 * Canal inferior abierto con las dos pistas de cobre al fondo.
 */
export function trackRail(length: number) {
  const g = new THREE.Group();
  const body = bodyMaterial('negro');
  const { w, h } = TRACK;
  const wall = 0.012;
  // Perfil en U invertida: techo y dos costados.
  g.add(at(mesh(roundedBox(length, wall, w, 0.004), body), 0, -wall / 2, 0));
  for (const s of [-1, 1]) g.add(at(mesh(roundedBox(length, h, wall, 0.004), body), 0, -h / 2, (s * (w - wall)) / 2));
  for (const s of [-1, 1]) g.add(at(mesh(roundedBox(wall, h, w, 0.004), body), (s * (length - wall)) / 2, -h / 2, 0));
  // Fondo del canal y pistas conductoras.
  const dark = new THREE.MeshStandardMaterial({ color: '#050505', roughness: 0.8, envMapIntensity: 0.15 });
  const inner = mesh(new THREE.PlaneGeometry(length - 0.03, w - 2 * wall), dark, false);
  inner.rotation.x = Math.PI / 2;
  g.add(at(inner, 0, -h * 0.42, 0));
  const copper = new THREE.MeshStandardMaterial({ color: '#b87333', metalness: 1, roughness: 0.3, envMapIntensity: 0.9 });
  for (const s of [-1, 1]) {
    const strip = mesh(new THREE.BoxGeometry(length - 0.06, 0.004, 0.008), copper, false);
    g.add(at(strip, 0, -h * 0.42 - 0.003, s * 0.02));
  }
  return g;
}

/** Adaptador que entra en el riel: lo visible es la pletina inferior. Origen en la boca del riel. */
export function trackAdapter(length: number, mat: THREE.Material) {
  const g = new THREE.Group();
  const w = TRACK.w - 0.03;
  g.add(at(mesh(roundedBox(length, 0.07, w, 0.006), mat), 0, 0.02, 0));
  // Pestillos de enganche a cada extremo.
  for (const s of [-1, 1])
    g.add(at(mesh(roundedBox(0.03, 0.012, w * 0.6, 0.003), mat, false), s * (length / 2 - 0.05), -0.02, 0));
  return g;
}

export { at, makeGlow, mesh };
