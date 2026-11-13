// Apliques de pared y exterior. La pared está en z=0 y recibe los haces reales de cada pieza.

import * as THREE from 'three';
import { applyFinish, bodyMaterial, makeGlow, mesh } from '../kit';
import { V, at, spot, type Lamp } from '../lamp';
import {
  baffleMaterial,
  canGeometry,
  emitterMaterial,
  opalMaterial,
  opticModule,
  puckGeometry,
  roundedBox,
  type Optic,
} from '../parts';
import { cobTexture } from '../kit';

const Y0 = 1.5; // altura de montaje
const ORBIT = { min: -0.95, max: 0.95 };
const view =
  (radius = 5.2) =>
  () => ({ target: V(0, Y0, 0.1), radius, polar: 1.56, minPolar: 1.3, maxPolar: 1.72 });

/** Par de focos rasantes a la pared, uno hacia arriba y otro hacia abajo. */
function washPair(root: THREE.Object3D, x: number, y: number, z: number, up: number, down: number, pen = 0.3) {
  const lights: THREE.SpotLight[] = [];
  for (const [dir, angle] of [
    [1, up],
    [-1, down],
  ] as const) {
    if (!angle) continue;
    const { group, light } = spot(angle, pen, false, [0, dir, -z * 0.45]);
    root.add(at(group, x, y + dir * 0.02, z));
    lights.push(light);
  }
  return lights;
}

/* ── Aplique Curved: 2, 3 o 4 haces por lado ── */

export function wallCurved(variant = '3'): Lamp {
  const n = Math.min(4, Math.max(2, Number(variant) || 3));
  const root = new THREE.Group();
  const body = bodyMaterial('negro', { side: THREE.DoubleSide });
  const W = 0.36 + n * 0.3;
  const Hh = 0.5;
  const D = 0.4;
  const t = 0.022;

  // Frente curvo: media elipse extruida.
  const shape = new THREE.Shape();
  shape.moveTo(-W / 2, 0);
  shape.absellipse(0, 0, W / 2, D, Math.PI, 0, true);
  shape.lineTo(W / 2 - t, 0);
  shape.absellipse(0, 0, W / 2 - t, D - t, 0, Math.PI, false);
  shape.lineTo(-W / 2, 0);
  const shell = new THREE.ExtrudeGeometry(shape, {
    depth: Hh,
    bevelEnabled: true,
    bevelSize: 0.004,
    bevelThickness: 0.004,
    bevelSegments: 2,
    curveSegments: 64,
  });
  shell.rotateX(Math.PI / 2);
  shell.translate(0, Hh / 2, 0);
  const g = at(new THREE.Group(), 0, Y0, 0);
  root.add(g);
  g.add(mesh(shell, body));
  g.add(at(mesh(roundedBox(W - 0.1, Hh - 0.08, 0.03, 0.008), body), 0, 0, 0.015));
  g.add(at(mesh(roundedBox(W - 0.36, 0.05, D - 0.14, 0.01), baffleMaterial()), 0, 0, D / 2 - 0.05));

  const optics: Optic[] = [];
  const lights: THREE.SpotLight[] = [];
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * 0.3;
    for (const dir of [1, -1]) {
      const o = opticModule(0.092, 0.07, 'cromo');
      o.group.rotation.x = dir > 0 ? Math.PI : 0;
      g.add(at(o.group, x, dir * 0.105, 0.2));
      optics.push(o);
    }
    lights.push(...washPair(g, x, 0, 0.13, 0.52, 0.52, 0.2));
  }

  return {
    root,
    env: 'wall',
    orbit: ORBIT,
    azimuth: 0,
    focus: V(0, Y0, 0.2),
    ghost: { y: 0.5, width: 2.6 },
    halo: { y: Y0, intensity: 0 },
    view: view(5.6),
    apply(s) {
      for (const l of lights) {
        l.color.copy(s.color);
        l.intensity = 1.25 * s.power;
      }
      for (const o of optics) o.set(s.color, s.power);
    },
    setFinish(id) {
      applyFinish(body, id);
    },
  };
}

/* ── Aplique Trap: cuña que abre arriba y concentra abajo ── */

export function wallTrap(): Lamp {
  const root = new THREE.Group();
  const body = bodyMaterial('negro', { side: THREE.DoubleSide, flatShading: true });
  const up = emitterMaterial();
  const down = emitterMaterial();
  const h = 0.8;
  const top = { x: 0.17, z: 0.32 };
  const bot = { x: 0.075, z: 0.17 };
  const z0 = 0.012;

  const P = (x: number, y: number, z: number) => [x, y, z];
  const A = [P(-top.x, h / 2, z0), P(top.x, h / 2, z0), P(top.x, h / 2, top.z), P(-top.x, h / 2, top.z)];
  const B = [P(-bot.x, -h / 2, z0), P(bot.x, -h / 2, z0), P(bot.x, -h / 2, bot.z), P(-bot.x, -h / 2, bot.z)];
  const verts: number[] = [];
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    verts.push(...A[i], ...B[i], ...B[j], ...A[i], ...B[j], ...A[j]);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.computeVertexNormals();
  const g = at(new THREE.Group(), 0, Y0, 0);
  root.add(g);
  g.add(mesh(geo, body));

  const topLed = mesh(new THREE.PlaneGeometry(top.x * 1.7, top.z * 0.8), up, false);
  topLed.rotation.x = -Math.PI / 2;
  g.add(at(topLed, 0, h / 2 - 0.05, (top.z + z0) / 2));
  const botLed = mesh(new THREE.PlaneGeometry(bot.x * 1.6, bot.z * 0.7), down, false);
  botLed.rotation.x = Math.PI / 2;
  g.add(at(botLed, 0, -h / 2 + 0.03, (bot.z + z0) / 2));

  const lights = [...washPair(g, 0, h / 2 - 0.06, 0.17, 0.95, 0, 0.5), ...washPair(g, 0, -h / 2 + 0.05, 0.1, 0, 0.26, 0.4)];

  return {
    root,
    env: 'wall',
    orbit: ORBIT,
    azimuth: 0,
    focus: V(0, Y0, 0.15),
    ghost: { y: 0.45, width: 1.8 },
    halo: { y: Y0, intensity: 0 },
    view: view(5.4),
    apply(s) {
      lights[0].color.copy(s.color);
      lights[0].intensity = 2.0 * s.power;
      lights[1].color.copy(s.color);
      lights[1].intensity = 2.2 * s.power;
      up.color.copy(s.color).multiplyScalar(0.04 + 2.2 * s.power);
      down.color.copy(s.color).multiplyScalar(0.04 + 2.6 * s.power);
    },
    setFinish(id) {
      applyFinish(body, id);
    },
  };
}

/* ── Bifocus: cilindro con haz arriba y abajo (GU10) ── */

export function wallBifocus(): Lamp {
  const root = new THREE.Group();
  const body = bodyMaterial('negro');
  const R = 0.15;
  const h = 0.84;
  const z = R + 0.07;
  const g = at(new THREE.Group(), 0, Y0, 0);
  root.add(g);

  const plate = mesh(puckGeometry(0.11, 0.03, 0.006), body);
  plate.rotation.x = Math.PI / 2;
  g.add(at(plate, 0, 0, 0.015));
  g.add(at(mesh(roundedBox(0.07, 0.11, 0.09, 0.01), body), 0, 0, 0.06));
  const top = mesh(canGeometry(R, h / 2, 0.014, 0.008), body);
  top.rotation.x = Math.PI;
  g.add(at(top, 0, 0, z));
  g.add(at(mesh(canGeometry(R, h / 2, 0.014, 0.008), body), 0, 0, z));

  const optics: Optic[] = [];
  for (const dir of [1, -1]) {
    const o = opticModule(R - 0.03, 0.09, 'cromo');
    o.group.rotation.x = dir > 0 ? Math.PI : 0;
    g.add(at(o.group, 0, dir * (h / 2 - 0.13), z));
    optics.push(o);
    const baffle = mesh(new THREE.CylinderGeometry(R - 0.014, R - 0.014, 0.13, 48, 1, true), baffleMaterial(), false);
    g.add(at(baffle, 0, dir * (h / 2 - 0.065), z));
  }
  const lights = [...washPair(g, 0, h / 2 - 0.1, z, 0.42, 0, 0.3), ...washPair(g, 0, -h / 2 + 0.1, z, 0, 0.42, 0.3)];

  return {
    root,
    env: 'wall',
    orbit: ORBIT,
    azimuth: 0,
    focus: V(0, Y0, z),
    ghost: { y: 0.42, width: 2.2 },
    halo: { y: Y0, intensity: 0 },
    view: view(5.6),
    apply(s) {
      for (const l of lights) {
        l.color.copy(s.color);
        l.intensity = 3.2 * s.power;
      }
      for (const o of optics) o.set(s.color, s.power);
    },
    setFinish(id) {
      applyFinish(body, id);
    },
  };
}

/* ── Emerald: cubo abierto arriba y abajo ── */

export function wallEmerald(): Lamp {
  const root = new THREE.Group();
  const body = bodyMaterial('negro');
  const chip = emitterMaterial(cobTexture());
  const S = 0.5;
  const t = 0.022;
  const g = at(new THREE.Group(), 0, Y0, 0);
  root.add(g);

  for (const s of [-1, 1]) g.add(at(mesh(roundedBox(t, S, S, 0.006), body), (s * (S - t)) / 2, 0, S / 2));
  g.add(at(mesh(roundedBox(S, S, t, 0.006), body), 0, 0, S - t / 2));
  g.add(at(mesh(roundedBox(S, S, t, 0.006), body), 0, 0, t / 2));
  g.add(at(mesh(roundedBox(S - 2 * t, 0.16, S - 2 * t, 0.004), baffleMaterial()), 0, 0, S / 2));
  for (const dir of [1, -1]) {
    const led = mesh(new THREE.PlaneGeometry(0.17, 0.17), chip, false);
    led.rotation.x = (-dir * Math.PI) / 2;
    g.add(at(led, 0, dir * 0.082, S / 2));
  }
  const lights = [...washPair(g, 0, 0.08, S / 2, 0.98, 0, 0.25), ...washPair(g, 0, -0.08, S / 2, 0, 0.98, 0.25)];
  const tmp = new THREE.Color();

  return {
    root,
    env: 'wall',
    orbit: ORBIT,
    azimuth: 0,
    focus: V(0, Y0, 0.25),
    ghost: { y: 0.42, width: 2.4 },
    halo: { y: Y0, intensity: 0 },
    view: view(5.6),
    apply(s) {
      for (const l of lights) {
        l.color.copy(s.color);
        l.intensity = 2.0 * s.power;
      }
      chip.color
        .copy(tmp.set('#5a5346'))
        .lerp(s.color, Math.min(1, s.power * 1.4))
        .multiplyScalar(1 + 4.5 * s.power);
    },
    setFinish(id) {
      applyFinish(body, id);
    },
  };
}

/* ── Cube: farol de difusor opal con marco ── */

export function wallCube(): Lamp {
  const root = new THREE.Group();
  const body = bodyMaterial('negro');
  const opal = opalMaterial();
  const W = 0.52;
  const D = 0.28;
  const g = at(new THREE.Group(), 0, Y0, 0);
  root.add(g);

  g.add(at(mesh(roundedBox(W - 0.03, W - 0.02, D, 0.03), opal, false), 0, -0.01, D / 2 + 0.02));
  g.add(at(mesh(roundedBox(W + 0.02, 0.028, D + 0.04, 0.008), body), 0, W / 2, D / 2 + 0.01));
  for (const s of [-1, 1])
    g.add(at(mesh(roundedBox(0.028, W, D + 0.04, 0.008), body), (s * (W + 0.02 - 0.028)) / 2, 0.014, D / 2 + 0.01));
  g.add(at(mesh(roundedBox(W, W, 0.024, 0.006), body), 0, 0.01, 0.012));

  const light = new THREE.PointLight('#ffffff', 0, 0, 2);
  light.position.set(0, 0, D + 0.35);
  g.add(light);
  const glow = at(makeGlow(1.9), 0, 0, D);
  g.add(glow);

  return {
    root,
    env: 'wall',
    orbit: ORBIT,
    azimuth: 0,
    focus: V(0, Y0, 0.2),
    ghost: { y: 0.5, width: 1.9 },
    halo: { y: Y0, intensity: 0 },
    view: view(5.2),
    apply(s) {
      light.color.copy(s.color);
      light.intensity = 0.8 * s.power;
      opal.emissive.copy(s.color);
      opal.emissiveIntensity = 0.02 + 0.92 * s.power;
      glow.material.color.copy(s.color);
      glow.material.opacity = 0.07 * s.power;
    },
    setFinish(id) {
      applyFinish(body, id);
    },
  };
}

/* ── Bolardo de jardín ── */

export function bollard(): Lamp {
  const root = new THREE.Group();
  const body = bodyMaterial('negro');
  const opal = opalMaterial();
  const R = 0.17;
  const post = 1.2;
  const lens = 0.5;

  root.add(at(mesh(puckGeometry(0.25, 0.035, 0.008), body), 0, 0.0175, 0));
  const tube = mesh(canGeometry(R, post, 0.02, 0.008), body);
  tube.rotation.x = Math.PI;
  root.add(at(tube, 0, 0.03, 0));
  root.add(at(mesh(new THREE.CylinderGeometry(R - 0.012, R - 0.012, lens, 64), opal, false), 0, 0.03 + post + lens / 2, 0));
  root.add(at(mesh(puckGeometry(R + 0.004, 0.06, 0.01), body), 0, 0.03 + post + lens + 0.03, 0));

  const cy = 0.03 + post + lens / 2;
  const light = new THREE.PointLight('#ffffff', 0, 0, 2);
  light.position.set(0, cy, 0.3);
  root.add(light);
  const { group, light: pool } = spot(1.25, 1, false);
  root.add(at(group, 0, cy, 0));
  const glow = at(makeGlow(1.5, 2), 0, cy, 0);
  root.add(glow);

  return {
    root,
    env: 'table',
    footprint: 0.6,
    azimuth: 0,
    focus: V(0, cy, 0),
    ghost: { y: 2.3, width: 3.0 },
    halo: { y: 1.5, intensity: 2.4 },
    view: () => ({ target: V(0, 0.92, 0), radius: 6.4, polar: 1.5, minPolar: 0.95, maxPolar: 1.6 }),
    apply(s) {
      light.color.copy(s.color);
      light.intensity = 1.3 * s.power;
      pool.color.copy(s.color);
      pool.intensity = 9 * s.power;
      opal.emissive.copy(s.color);
      opal.emissiveIntensity = 0.02 + 0.92 * s.power;
      glow.material.color.copy(s.color);
      glow.material.opacity = 0.22 * s.power;
    },
    setFinish(id) {
      applyFinish(body, id);
    },
  };
}
