// Luminarias modeladas por código (sin archivos .glb): cada función devuelve la pieza,
// sus luces y cómo debe encuadrarla la cámara.

import * as THREE from 'three';
import type { ModelId } from '../data/catalog';
import {
  applyFinish,
  beamTexture,
  bodyMaterial,
  flutedCylinder,
  hammeredTexture,
  lerp,
  lightMaterial,
  makeGlow,
  mesh,
} from './kit';

export interface LampState {
  /** 0 apagada · 1 encendida. */
  power: number;
  color: THREE.Color;
  /** 0–1: inclinación del spot. */
  tilt: number;
  /** 0–1: despiece. */
  explode: number;
}

export interface LampView {
  target: THREE.Vector3;
  radius: number;
  polar: number;
  minPolar: number;
  maxPolar: number;
}

export type EnvId = 'table' | 'room' | 'studio';

export interface Lamp {
  /** Gira sobre la tornamesa. */
  root: THREE.Group;
  /** Objetos de la escena que no giran (techo, pedestal). */
  props?: THREE.Group;
  env: EnvId;
  /** Giro inicial de la tornamesa. */
  azimuth: number;
  /** Punto al que se acerca la cámara al hacer zoom. */
  focus: THREE.Vector3;
  /** Nombre fantasma en la pared: altura y ancho. */
  ghost: { y: number; width: number };
  /** Resplandor en la pared detrás de la pieza. */
  halo: { y: number; intensity: number };
  view(state: LampState): LampView;
  apply(state: LampState): void;
  setFinish(id: string): void;
  /** Piezas rotuladas (despiece). */
  anchors?: { id: string; label: string; object: THREE.Object3D; side: 1 | -1 }[];
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function at<T extends THREE.Object3D>(o: T, x: number, y: number, z: number): T {
  o.position.set(x, y, z);
  return o;
}

function downSpot(y: number, angle: number, penumbra = 0.9) {
  const light = new THREE.SpotLight('#ffffff', 0, 0, angle, penumbra, 2);
  light.position.set(0, y, 0);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  light.shadow.bias = -0.0008;
  light.shadow.radius = 6;
  light.shadow.camera.near = 0.05;
  light.shadow.camera.far = 6;
  const target = new THREE.Object3D();
  target.position.set(0, y - 1, 0);
  light.target = target;
  return { light, target };
}

/* ───────────────────────── Midnight ───────────────────────── */

function midnight(): Lamp {
  const root = new THREE.Group();
  const body = bodyMaterial('negro');
  const ribs = bodyMaterial('negro', { flatShading: true });
  const lit = lightMaterial('#40382f');
  let translucent = false;

  root.add(at(mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.045, 72), body), 0, 0.0225, 0));
  root.add(at(mesh(new THREE.CylinderGeometry(0.013, 0.013, 1.0, 16), body), 0, 0.545, 0));

  const head = at(new THREE.Group(), 0, 1.08, 0);
  head.add(at(mesh(new THREE.CylinderGeometry(0.47, 0.47, 0.055, 96), body), 0, 0.068, 0));
  head.add(at(mesh(new THREE.CylinderGeometry(0.462, 0.462, 0.012, 96), body), 0, 0.036, 0));
  head.add(at(mesh(flutedCylinder(0.47, 0.47, 0.1, 60, 0.014), ribs), 0, -0.02, 0));
  const diffuser = mesh(new THREE.CircleGeometry(0.458, 72), lit, false);
  diffuser.rotation.x = Math.PI / 2;
  head.add(at(diffuser, 0, -0.062, 0));
  head.add(at(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 32), body, false), 0, -0.066, 0));
  root.add(head);

  const { light, target } = downSpot(1.0, 1.12);
  root.add(light, target);
  const glow = at(makeGlow(1.5, 0.7), 0, 0.97, 0);
  root.add(glow);

  return {
    root,
    env: 'table',
    azimuth: 0,
    focus: V(0, 1.0, 0),
    ghost: { y: 1.62, width: 4.3 },
    halo: { y: 1.25, intensity: 6.5 },
    view: () => ({ target: V(0, 0.66, 0), radius: 5.1, polar: 1.535, minPolar: 0.95, maxPolar: 1.63 }),
    apply(s) {
      light.color.copy(s.color);
      light.intensity = 13 * s.power;
      lit.emissive.copy(s.color);
      lit.emissiveIntensity = 0.02 + 2.6 * s.power;
      ribs.emissive.copy(s.color);
      ribs.emissiveIntensity = translucent ? 0.28 * s.power : 0;
      body.emissive.copy(s.color);
      body.emissiveIntensity = translucent ? 0.1 * s.power : 0;
      glow.material.color.copy(s.color);
      glow.material.opacity = (translucent ? 0.75 : 0.5) * s.power;
    },
    setFinish(id) {
      applyFinish(body, id);
      applyFinish(ribs, id);
      translucent = id === 'blanco';
    },
  };
}

/* ───────────────────────── Trend ───────────────────────── */

function trend(): Lamp {
  const root = new THREE.Group();
  const body = bodyMaterial('negro');
  const pleats = bodyMaterial('negro', { flatShading: true, side: THREE.DoubleSide });
  const lit = lightMaterial('#40382f');

  root.add(at(mesh(new THREE.BoxGeometry(0.5, 0.045, 0.5), body), 0, 0.0225, 0));
  root.add(at(mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.92, 16), body), 0, 0.5, 0));
  root.add(at(mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.03, 16), body), 0, 0.058, 0));

  const shadeY = 1.09;
  const shadeH = 0.5;
  root.add(at(mesh(flutedCylinder(0.265, 0.355, shadeH, 44, 0.016), pleats), 0, shadeY, 0));
  const cap = mesh(new THREE.CircleGeometry(0.262, 64), body);
  cap.rotation.x = -Math.PI / 2;
  root.add(at(cap, 0, shadeY + shadeH / 2 - 0.004, 0));
  const diffuser = mesh(new THREE.CircleGeometry(0.335, 64), lit, false);
  diffuser.rotation.x = Math.PI / 2;
  root.add(at(diffuser, 0, shadeY - shadeH / 2 + 0.03, 0));

  const { light, target } = downSpot(shadeY - shadeH / 2 + 0.02, 1.08);
  root.add(light, target);
  const glow = at(makeGlow(1.15, 0.5), 0, shadeY - shadeH / 2 - 0.02, 0);
  root.add(glow);

  return {
    root,
    env: 'table',
    azimuth: 0.5,
    focus: V(0, 1.0, 0),
    ghost: { y: 1.78, width: 3.3 },
    halo: { y: 1.2, intensity: 5 },
    view: () => ({ target: V(0, 0.7, 0), radius: 5.3, polar: 1.535, minPolar: 0.95, maxPolar: 1.63 }),
    apply(s) {
      light.color.copy(s.color);
      light.intensity = 9 * s.power;
      lit.emissive.copy(s.color);
      lit.emissiveIntensity = 0.02 + 2.2 * s.power;
      glow.material.color.copy(s.color);
      glow.material.opacity = 0.42 * s.power;
    },
    setFinish(id) {
      applyFinish(body, id);
      applyFinish(pleats, id);
    },
  };
}

/* ───────────────────────── Earthtone ───────────────────────── */

function earthtone(): Lamp {
  const root = new THREE.Group();
  const body = bodyMaterial('tierra');
  const hat = bodyMaterial('tierra', { side: THREE.DoubleSide });
  const glass = new THREE.MeshPhysicalMaterial({
    color: '#b97f3c',
    roughness: 0.06,
    metalness: 0,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
    depthWrite: false,
    envMapIntensity: 1.0,
    clearcoat: 1,
  });
  const filament = new THREE.MeshBasicMaterial({ color: '#000000' });
  const socket = lightMaterial('#6b5038');
  const brass = new THREE.MeshStandardMaterial({ color: '#c9a35a', metalness: 1, roughness: 0.3, envMapIntensity: 0.8 });

  // Base con escalón.
  root.add(at(mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.15, 72), body), 0, 0.075, 0));
  root.add(at(mesh(new THREE.CylinderGeometry(0.318, 0.318, 0.04, 72), body), 0, 0.17, 0));

  // Cuerpo de vidrio ámbar.
  const profile = [
    [0.305, 0.19],
    [0.31, 0.3],
    [0.3, 0.45],
    [0.275, 0.6],
    [0.235, 0.75],
    [0.185, 0.89],
    [0.145, 0.98],
    [0.135, 1.02],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const vessel = mesh(new THREE.LatheGeometry(new THREE.SplineCurve(profile).getPoints(40), 72), glass, false);
  vessel.renderOrder = 5;
  root.add(vessel);

  // Fondo interior con el punto de latón donde nace el filamento.
  const floorIn = mesh(new THREE.ConeGeometry(0.29, 0.07, 64), bodyMaterial('negro'), false);
  root.add(at(floorIn, 0, 0.215, 0));
  root.add(at(mesh(new THREE.SphereGeometry(0.02, 20, 16), brass, false), 0, 0.27, 0));

  // Filamento LED vertical.
  const line = mesh(new THREE.CylinderGeometry(0.0075, 0.0075, 0.64, 12), filament, false);
  root.add(at(line, 0, 0.61, 0));
  const lineGlow = at(makeGlow(0.22, 1.0), 0, 0.61, 0);
  root.add(lineGlow);

  // Casquillo superior, bajo la pantalla.
  const dome = mesh(new THREE.SphereGeometry(0.125, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), socket, false);
  root.add(at(dome, 0, 0.93, 0));

  // Pantalla cónica y remate.
  const shade = mesh(new THREE.ConeGeometry(0.54, 0.25, 96, 1, true), hat);
  root.add(at(shade, 0, 1.13, 0));
  root.add(at(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.08, 16), body), 0, 1.285, 0));
  root.add(at(mesh(new THREE.BoxGeometry(0.085, 0.085, 0.085), body), 0, 1.36, 0));

  const { light, target } = downSpot(0.98, 1.2, 1);
  root.add(light, target);
  const inner = new THREE.PointLight('#ffffff', 0, 3.5, 2);
  inner.position.set(0, 0.62, 0);
  root.add(inner);
  const glow = at(makeGlow(1.5, 1.5), 0, 0.66, 0);
  root.add(glow);

  const warm = new THREE.Color();
  return {
    root,
    env: 'table',
    azimuth: 0.6,
    focus: V(0, 0.8, 0),
    ghost: { y: 1.86, width: 3.4 },
    halo: { y: 1.1, intensity: 6 },
    view: () => ({ target: V(0, 0.72, 0), radius: 5.2, polar: 1.52, minPolar: 0.95, maxPolar: 1.63 }),
    apply(s) {
      warm.copy(s.color);
      light.color.copy(warm);
      light.intensity = 9 * s.power;
      inner.color.copy(warm);
      inner.intensity = 1.5 * s.power;
      filament.color.copy(warm).multiplyScalar(0.04 + 2.4 * s.power);
      socket.emissive.copy(warm);
      socket.emissiveIntensity = 0.9 * s.power;
      glass.emissive.copy(warm);
      glass.emissiveIntensity = 0.16 * s.power;
      glass.opacity = 0.3 + 0.12 * s.power;
      lineGlow.material.color.copy(warm);
      lineGlow.material.opacity = 0.85 * s.power;
      glow.material.color.copy(warm);
      glow.material.opacity = 0.3 * s.power;
    },
    setFinish(id) {
      applyFinish(body, id);
      applyFinish(hat, id);
    },
  };
}

/* ───────────────────────── Colgantes ───────────────────────── */

function pendant(kind: 'disc' | 'dome'): Lamp {
  const root = new THREE.Group();
  const body = bodyMaterial('negro', { side: THREE.DoubleSide });
  const bump = hammeredTexture().clone();
  bump.needsUpdate = true;
  bump.repeat.set(kind === 'disc' ? 9 : 7, kind === 'disc' ? 4 : 3);
  const gold = new THREE.MeshStandardMaterial({
    color: '#d8a23c',
    metalness: 1,
    roughness: 0.34,
    side: THREE.DoubleSide,
    bumpMap: bump,
    bumpScale: 1.4,
    envMapIntensity: 0.4,
  });
  const bulb = new THREE.MeshBasicMaterial({ color: '#000000' });

  const hang = 1.18; // altura del borde inferior de la pantalla
  const outline =
    kind === 'disc'
      ? [
          [0.03, 0.3],
          [0.04, 0.2],
          [0.1, 0.15],
          [0.3, 0.1],
          [0.52, 0.05],
          [0.66, 0],
        ]
      : [
          [0.03, 0.66],
          [0.045, 0.56],
          [0.14, 0.48],
          [0.29, 0.38],
          [0.36, 0.24],
          [0.37, 0.1],
          [0.36, 0],
        ];
  const curve = new THREE.SplineCurve(outline.map(([r, y]) => new THREE.Vector2(r, y)));
  const pts = curve.getPoints(48);
  const shell = mesh(new THREE.LatheGeometry(pts, 96), body);
  const inside = mesh(
    new THREE.LatheGeometry(
      pts.filter((p) => p.x > 0.06).map((p) => new THREE.Vector2(p.x - 0.008, p.y - 0.008)),
      96,
    ),
    gold,
    false,
  );
  const top = outline[0][1];
  const shade = at(new THREE.Group(), 0, hang, 0);
  shade.add(shell, inside);
  shade.add(at(mesh(new THREE.TorusGeometry(outline[outline.length - 1][0] - 0.002, 0.006, 10, 96), body), 0, 0, 0));
  shade.children[2].rotation.x = Math.PI / 2;
  root.add(shade);

  // Cable y portalámparas.
  root.add(at(mesh(new THREE.CylinderGeometry(0.006, 0.006, 6, 8), body, false), 0, hang + top + 3, 0));
  root.add(at(mesh(new THREE.CylinderGeometry(0.03, 0.022, 0.07, 20), body, false), 0, hang + top + 0.03, 0));
  const bulbY = hang + (kind === 'disc' ? 0.06 : 0.3);
  root.add(at(mesh(new THREE.CylinderGeometry(0.026, 0.03, 0.09, 20), bodyMaterial('blanco'), false), 0, bulbY + 0.085, 0));
  root.add(at(mesh(new THREE.CapsuleGeometry(0.027, 0.07, 6, 16), bulb, false), 0, bulbY, 0));

  const { light, target } = downSpot(bulbY, kind === 'disc' ? 1.25 : 0.78, 0.85);
  light.castShadow = false;
  root.add(light, target);
  const fill = new THREE.PointLight('#ffffff', 0, 2.2, 2);
  fill.position.set(0, bulbY - 0.02, 0);
  root.add(fill);
  const glow = at(makeGlow(0.7, 0.7), 0, bulbY, 0);
  root.add(glow);
  const wash = at(makeGlow(kind === 'disc' ? 1.5 : 0.95, 0.5), 0, hang - 0.04, 0);
  root.add(wash);

  const y0 = kind === 'disc' ? 0.95 : 1.02;
  return {
    root,
    env: 'table',
    azimuth: 0,
    focus: V(0, hang + 0.1, 0),
    ghost: { y: kind === 'disc' ? 2.05 : 2.3, width: kind === 'disc' ? 3.6 : 3.4 },
    halo: { y: 1.4, intensity: 4.5 },
    view: () => ({ target: V(0, y0, 0), radius: 5.0, polar: 1.67, minPolar: 1.2, maxPolar: 1.73 }),
    apply(s) {
      light.color.copy(s.color);
      light.intensity = (kind === 'disc' ? 7 : 11) * s.power;
      fill.color.copy(s.color);
      fill.intensity = (kind === 'disc' ? 0.5 : 0.3) * s.power;
      bulb.color.copy(s.color).multiplyScalar(0.03 + 2.2 * s.power);
      gold.emissive.set('#ff9a2e');
      gold.emissiveIntensity = 0.1 * s.power;
      glow.material.color.copy(s.color);
      glow.material.opacity = 0.75 * s.power;
      wash.material.color.copy(s.color);
      wash.material.opacity = 0.22 * s.power;
    },
    setFinish(id) {
      applyFinish(body, id);
    },
  };
}

/* ───────────────────────── Spotlight 360 ───────────────────────── */

function spot360(): Lamp {
  const H = 1.9; // altura del techo de la maqueta
  const L = 0.5; // largo del cuerpo
  const R = 0.19;
  const HALF = 0.32; // semiángulo del haz

  const root = new THREE.Group();
  const props = new THREE.Group();
  const body = bodyMaterial('negro', { side: THREE.DoubleSide });
  const dark = new THREE.MeshStandardMaterial({ color: '#070707', roughness: 0.9, side: THREE.DoubleSide, envMapIntensity: 0.1 });
  const lens = lightMaterial('#3a332c');
  const plaster = new THREE.MeshStandardMaterial({ color: '#8d8377', roughness: 0.95, envMapIntensity: 0 });
  const stone = new THREE.MeshStandardMaterial({ color: '#b3a590', roughness: 0.8, envMapIntensity: 0.1 });

  // Techo y una pieza en pedestal para tener a qué apuntar.
  const ceiling = mesh(new THREE.BoxGeometry(16, 0.3, 9), plaster, false);
  ceiling.receiveShadow = true;
  props.add(at(ceiling, 0, H + 0.15, -0.6));
  const plinth = mesh(new THREE.BoxGeometry(0.4, 0.46, 0.4), stone);
  plinth.receiveShadow = true;
  props.add(at(plinth, 0, 0.23, 0));
  const orb = mesh(new THREE.SphereGeometry(0.17, 48, 32), stone);
  orb.receiveShadow = true;
  props.add(at(orb, 0, 0.63, 0));

  // Aro al ras del techo.
  root.add(at(mesh(new THREE.CylinderGeometry(0.285, 0.285, 0.018, 96), body, false), 0, H - 0.009, 0));
  const hole = mesh(new THREE.CircleGeometry(0.215, 64), dark, false);
  hole.rotation.x = Math.PI / 2;
  root.add(at(hole, 0, H - 0.0185, 0));

  // Brazo, pivote y cuerpo.
  const arm = mesh(new THREE.BoxGeometry(0.1, 1, 0.05), dark, false);
  root.add(arm);
  const pivot = new THREE.Group();
  root.add(pivot);
  const slide = new THREE.Group();
  pivot.add(slide);

  slide.add(at(mesh(new THREE.CylinderGeometry(R, R, L, 72, 1, true), body), 0, -L / 2, 0));
  const back = mesh(new THREE.CircleGeometry(R, 64), body, false);
  back.rotation.x = -Math.PI / 2;
  slide.add(at(back, 0, -0.002, 0));
  slide.add(at(mesh(new THREE.CylinderGeometry(R - 0.012, R - 0.012, 0.2, 64, 1, true), dark, false), 0, -L + 0.1, 0));
  const face = mesh(new THREE.CircleGeometry(R - 0.014, 64), lens, false);
  face.rotation.x = Math.PI / 2;
  slide.add(at(face, 0, -L + 0.16, 0));
  const rim = mesh(new THREE.TorusGeometry(R - 0.004, 0.006, 10, 96), body, false);
  rim.rotation.x = Math.PI / 2;
  slide.add(at(rim, 0, -L, 0));

  const light = new THREE.SpotLight('#ffffff', 0, 0, HALF, 0.5, 2);
  light.position.set(0, -L + 0.14, 0);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  light.shadow.bias = -0.0006;
  light.shadow.radius = 4;
  light.shadow.camera.near = 0.2;
  light.shadow.camera.far = 8;
  const target = at(new THREE.Object3D(), 0, -L - 1, 0);
  light.target = target;
  slide.add(light, target);

  const beamLen = 2.4;
  const beamMat = new THREE.MeshBasicMaterial({
    map: beamTexture(),
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
  });
  const beam = mesh(new THREE.ConeGeometry(Math.tan(HALF) * beamLen + R * 0.6, beamLen, 48, 1, true), beamMat, false);
  beam.renderOrder = 8;
  slide.add(at(beam, 0, -L + 0.2 - beamLen / 2, 0));
  const glow = at(makeGlow(0.7), 0, -L + 0.05, 0);
  slide.add(glow);

  // Rebote suave para que el techo y el aro no queden negros.
  const bounce = new THREE.PointLight('#ffffff', 0, 0, 2);
  bounce.position.set(0, 0.95, 1.7);
  props.add(bounce);

  return {
    root,
    props,
    env: 'room',
    azimuth: -0.28,
    focus: V(0, H - 0.3, 0),
    ghost: { y: 1.3, width: 3.1 },
    halo: { y: 1.0, intensity: 0.35 },
    view: () => ({ target: V(0, 1.02, 0), radius: 4.9, polar: 1.66, minPolar: 1.35, maxPolar: 1.74 }),
    apply(s) {
      const t = s.tilt;
      const drop = lerp(0, 0.24, t);
      pivot.position.set(0, H - 0.02 - drop, 0);
      pivot.rotation.x = (t * Math.PI) / 2;
      slide.position.y = lerp(L - 0.14, 0.07, Math.min(1, t * 1.6));
      arm.scale.y = Math.max(0.001, drop + 0.04);
      arm.position.set(0, H - 0.02 - drop / 2, 0);
      arm.visible = drop > 0.01;

      light.color.copy(s.color);
      light.intensity = 46 * s.power;
      lens.emissive.copy(s.color);
      lens.emissiveIntensity = 0.02 + 3 * s.power;
      beamMat.color.copy(s.color);
      beamMat.opacity = 0.085 * s.power;
      glow.material.color.copy(s.color);
      glow.material.opacity = 0.5 * s.power;
      bounce.color.copy(s.color);
      bounce.intensity = 0.9 * s.power;
    },
    setFinish(id) {
      applyFinish(body, id);
    },
  };
}

/* ───────────────────────── Lamba ───────────────────────── */

function lamba(): Lamp {
  const root = new THREE.Group();
  const trimMat = bodyMaterial('blanco', { side: THREE.DoubleSide });
  const dark = bodyMaterial('negro', { side: THREE.DoubleSide });
  const alu = new THREE.MeshStandardMaterial({ color: '#9a9b9d', metalness: 0.9, roughness: 0.38, envMapIntensity: 0.8 });
  const steel = new THREE.MeshStandardMaterial({
    color: '#c9c9c7',
    metalness: 1,
    roughness: 0.25,
    side: THREE.DoubleSide,
    envMapIntensity: 0.8,
  });
  const optic = new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    roughness: 0.12,
    transparent: true,
    opacity: 0.42,
    side: THREE.DoubleSide,
    depthWrite: false,
    flatShading: true,
    envMapIntensity: 1.1,
  });
  const chip = lightMaterial('#e8c94a');
  const board = new THREE.MeshStandardMaterial({ color: '#e9e6df', roughness: 0.6, envMapIntensity: 0.3 });

  const base = 0.85;
  const asm = at(new THREE.Group(), 0, base, 0);
  root.add(asm);
  const part = (y: number, spread: number) => {
    const g = at(new THREE.Group(), 0, y, 0);
    g.userData = { y, spread };
    asm.add(g);
    return g;
  };

  // 1 · Aro embellecedor con reflector antideslumbrante.
  const trim = part(0, -0.62);
  const trimProfile = [
    [0.56, 0.012],
    [0.56, 0],
    [0.42, 0],
    [0.4, 0.02],
    [0.3, 0.24],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  trim.add(mesh(new THREE.LatheGeometry(trimProfile, 96), trimMat));

  // 2 · Portalente.
  const holder = part(0.25, -0.2);
  holder.add(at(mesh(new THREE.CylinderGeometry(0.33, 0.31, 0.11, 72, 1, true), dark), 0, 0.055, 0));
  const ringTop = mesh(new THREE.RingGeometry(0.2, 0.33, 72), dark, false);
  ringTop.rotation.x = -Math.PI / 2;
  holder.add(at(ringTop, 0, 0.11, 0));

  // 3 · Óptica de 36°.
  const lensPart = part(0.27, 0.22);
  lensPart.add(at(mesh(flutedCylinder(0.28, 0.25, 0.1, 40, 0.012, false), optic, false), 0, 0.05, 0));
  lensPart.children[0].renderOrder = 6;

  // 4 · Módulo LED.
  const led = part(0.39, 0.62);
  led.add(at(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.025, 48), board), 0, 0.0125, 0));
  const die = mesh(new THREE.CircleGeometry(0.085, 40), chip, false);
  die.rotation.x = Math.PI / 2;
  led.add(at(die, 0, -0.002, 0));

  // 5 · Disipador de aluminio.
  const sink = part(0.42, 1.02);
  sink.add(at(mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.44, 48), alu), 0, 0.22, 0));
  const finGeo = new THREE.BoxGeometry(0.17, 0.4, 0.014);
  const fins = new THREE.InstancedMesh(finGeo, alu, 30);
  fins.castShadow = true;
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < 30; i++) {
    const a = (i / 30) * Math.PI * 2;
    m4.makeRotationY(-a);
    m4.setPosition(Math.cos(a) * 0.255, 0.23, Math.sin(a) * 0.255);
    fins.setMatrixAt(i, m4);
  }
  sink.add(fins);
  sink.add(at(mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.02, 64), alu), 0, 0.01, 0));

  // 6 · Conector del driver.
  const conn = part(0.87, 1.5);
  conn.add(at(mesh(new THREE.CylinderGeometry(0.07, 0.085, 0.09, 32), board), 0, 0.045, 0));
  conn.add(at(mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.05, 24), dark), 0, 0.11, 0));

  // 7 · Aro de montaje con clips de resorte.
  const mount = part(0.2, 2.1);
  mount.add(at(mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.2, 96, 1, true), steel), 0, 0.1, 0));
  for (const side of [-1, 1]) {
    const clip = new THREE.Group();
    clip.add(at(mesh(new THREE.BoxGeometry(0.36, 0.012, 0.07), steel), 0.18, 0, 0));
    clip.add(at(mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.09, 16), steel), 0, 0, 0));
    clip.children[1].rotation.x = Math.PI / 2;
    clip.rotation.z = 0.5;
    clip.scale.x = side;
    clip.position.set(side * 0.43, 0.13, 0);
    mount.add(clip);
  }

  const parts = [trim, holder, lensPart, led, sink, conn, mount];

  const { light, target } = downSpot(base + 0.12, 0.34, 0.6);
  light.castShadow = false;
  root.add(light, target);
  const glow = at(makeGlow(1.0, 0.5), 0, base + 0.06, 0);
  root.add(glow);

  return {
    root,
    env: 'studio',
    azimuth: 0.4,
    focus: V(0, base + 0.4, 0),
    ghost: { y: 2.25, width: 3.4 },
    halo: { y: 1.3, intensity: 2.6 },
    view: (s) => ({
      target: V(0, base + 0.3 + s.explode * 0.66, 0),
      radius: 5.4 + s.explode * 4.1,
      polar: lerp(1.7, 1.32, s.explode),
      minPolar: 1.0,
      maxPolar: 1.74,
    }),
    anchors: [
      { id: 'mount', label: 'Aro de montaje con clips', object: mount, side: 1 },
      { id: 'sink', label: 'Disipador de aluminio', object: sink, side: -1 },
      { id: 'led', label: 'LED OSRAM · CRI 90', object: led, side: 1 },
      { id: 'lens', label: 'Óptica de 36°', object: lensPart, side: -1 },
      { id: 'trim', label: 'Aro con protección IP54', object: trim, side: 1 },
    ],
    apply(s) {
      for (const p of parts) p.position.y = p.userData.y + p.userData.spread * s.explode;
      const lit = s.power * (1 - s.explode * 0.75);
      light.color.copy(s.color);
      light.intensity = 30 * lit;
      chip.emissive.copy(s.color);
      chip.emissiveIntensity = 0.05 + 3.2 * s.power;
      optic.emissive.copy(s.color);
      optic.emissiveIntensity = 0.55 * s.power;
      glow.position.y = base + 0.06 + trim.userData.spread * s.explode * 0.4;
      glow.material.color.copy(s.color);
      glow.material.opacity = 0.6 * lit;
    },
    setFinish(id) {
      applyFinish(trimMat, id);
    },
  };
}

export function buildLamp(id: ModelId): Lamp {
  switch (id) {
    case 'midnight':
      return midnight();
    case 'trend':
      return trend();
    case 'earthtone':
      return earthtone();
    case 'pendantDisc':
      return pendant('disc');
    case 'pendantDome':
      return pendant('dome');
    case 'spot360':
      return spot360();
    case 'lamba':
      return lamba();
  }
}
