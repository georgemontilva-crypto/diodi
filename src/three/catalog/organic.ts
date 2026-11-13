// Colgantes de formas orgánicas: piedra (wabi-sabi) y espiral plisado.

import * as THREE from 'three';
import { bodyMaterial, makeGlow, mesh, stoneTexture } from '../kit';
import { V, at, spot, type Lamp } from '../lamp';
import { emitterMaterial, lensMaterial } from '../parts';

/** Superficie paramétrica u∈[0,1) (alrededor, cerrada) × v∈[0,1] (de arriba abajo). */
function surface(fn: (u: number, v: number, out: THREE.Vector3) => void, nu: number, nv: number) {
  const pos = new Float32Array((nu + 1) * (nv + 1) * 3);
  const uv = new Float32Array((nu + 1) * (nv + 1) * 2);
  const p = new THREE.Vector3();
  let k = 0;
  for (let j = 0; j <= nv; j++) {
    for (let i = 0; i <= nu; i++) {
      fn((i % nu) / nu, j / nv, p);
      pos[k * 3] = p.x;
      pos[k * 3 + 1] = p.y;
      pos[k * 3 + 2] = p.z;
      uv[k * 2] = i / nu;
      uv[k * 2 + 1] = j / nv;
      k++;
    }
  }
  const idx: number[] = [];
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      const a = j * (nu + 1) + i;
      const b = a + nu + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  // Cose la costura u=0/u=1 para que no se vea una línea de sombreado.
  const n = geo.attributes.normal as THREE.BufferAttribute;
  for (let j = 0; j <= nv; j++) {
    const a = j * (nu + 1);
    const b = a + nu;
    const x = n.getX(a) + n.getX(b);
    const y = n.getY(a) + n.getY(b);
    const z = n.getZ(a) + n.getZ(b);
    const l = Math.hypot(x, y, z) || 1;
    n.setXYZ(a, x / l, y / l, z / l);
    n.setXYZ(b, x / l, y / l, z / l);
  }
  return geo;
}

/** Bombillo de filamento a la vista. Devuelve el grupo y el material del filamento. */
function filamentBulb() {
  const g = new THREE.Group();
  const filament = emitterMaterial();
  const glass = lensMaterial();
  glass.color.set('#ffd9a0');
  glass.opacity = 0.2;
  const bulb = mesh(new THREE.SphereGeometry(0.075, 32, 24), glass, false);
  bulb.scale.y = 1.25;
  bulb.renderOrder = 6;
  g.add(bulb);
  const path = new THREE.CatmullRomCurve3(
    Array.from({ length: 40 }, (_, i) => {
      const t = i / 39;
      return new THREE.Vector3(Math.cos(t * 18) * 0.018, 0.05 - t * 0.1, Math.sin(t * 18) * 0.018);
    }),
  );
  g.add(mesh(new THREE.TubeGeometry(path, 80, 0.004, 6), filament, false));
  g.add(at(mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.07, 20), bodyMaterial('negro'), false), 0, 0.12, 0));
  return { group: g, filament };
}

function hangCord(root: THREE.Group, from: number) {
  const cord = at(mesh(new THREE.CylinderGeometry(0.006, 0.006, 6, 8), bodyMaterial('negro'), false), 0, from + 3, 0);
  cord.name = 'cord';
  cord.userData.from = from;
  root.add(cord);
}

/* ── Piedra: cúpula irregular de acabado mineral ── */

const STONES: Record<string, string> = { piedra: '#b5afa4', arena: '#b99c79' };

export function pendantStone(): Lamp {
  const root = new THREE.Group();
  const hang = 1.12;
  const R = 0.7;
  const Hh = 0.58;
  const bump = stoneTexture();
  const stone = new THREE.MeshStandardMaterial({
    color: STONES.piedra,
    roughness: 1,
    metalness: 0,
    bumpMap: bump,
    bumpScale: 3.2,
    envMapIntensity: 0.22,
    dithering: true,
  });
  const inner = new THREE.MeshStandardMaterial({
    color: '#e9dfcf',
    roughness: 1,
    bumpMap: bump,
    bumpScale: 2,
    envMapIntensity: 0,
    side: THREE.BackSide,
    dithering: true,
  });

  // Cúpula deformada: ningún lado es igual a otro, como una piedra de río.
  const shape = (scale: number) => (u: number, v: number, out: THREE.Vector3) => {
    const a = u * Math.PI * 2;
    const t = v * Math.PI * 0.55;
    const wob = 1 + v * (0.13 * Math.sin(a + 1.2) + 0.07 * Math.sin(2 * a + 0.5) + 0.03 * Math.sin(5 * a));
    const r = R * Math.sin(t) * wob * scale;
    const y = Hh * Math.cos(t) * scale - v * v * (0.09 * Math.sin(a - 0.7) + 0.04 * Math.sin(3 * a + 1)) + (1 - scale) * 0.02;
    out.set(Math.cos(a) * r, y, Math.sin(a) * r);
  };
  const g = at(new THREE.Group(), 0, hang + 0.08, 0);
  root.add(g);
  g.add(mesh(surface(shape(1), 96, 40), stone));
  g.add(mesh(surface(shape(0.93), 96, 40), inner, false));
  // Canto: une cara exterior e interior.
  const rim = surface(
    (u, v, out) => {
      const a = new THREE.Vector3();
      const b = new THREE.Vector3();
      shape(1)(u, 1, a);
      shape(0.93)(u, 1, b);
      out.copy(a).lerp(b, v);
    },
    96,
    2,
  );
  g.add(mesh(rim, stone, false));

  const bulbY = hang + 0.2;
  const { group: bulb, filament } = filamentBulb();
  root.add(at(bulb, 0, bulbY, 0));
  root.add(at(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 10), bodyMaterial('blanco'), false), 0, bulbY + 0.26, 0));
  hangCord(root, hang + 0.08 + Hh);

  const fill = new THREE.PointLight('#ffffff', 0, 2.6, 2);
  fill.position.set(0, bulbY, 0);
  root.add(fill);
  const { group, light } = spot(1.15, 0.9);
  root.add(at(group, 0, bulbY, 0));
  const glow = at(makeGlow(0.55), 0, bulbY, 0);
  root.add(glow);

  return {
    root,
    env: 'table',
    azimuth: 0.6,
    focus: V(0, hang + 0.2, 0),
    ghost: { y: 2.15, width: 3.4 },
    halo: { y: 1.4, intensity: 3.6 },
    view: () => ({ target: V(0, 1.0, 0), radius: 5.2, polar: 1.68, minPolar: 1.2, maxPolar: 1.73 }),
    apply(s) {
      fill.color.copy(s.color);
      fill.intensity = 2.4 * s.power;
      light.color.copy(s.color);
      light.intensity = 8 * s.power;
      filament.color.copy(s.color).multiplyScalar(0.03 + 7 * s.power);
      inner.emissive.copy(s.color);
      inner.emissiveIntensity = 0.1 * s.power;
      glow.material.color.copy(s.color);
      glow.material.opacity = 0.6 * s.power;
    },
    setFinish(id) {
      stone.color.set(STONES[id] ?? STONES.piedra);
    },
  };
}

/* ── Espiral: pantalla plisada que gira sobre sí misma ── */

export function pendantSpiral(): Lamp {
  const root = new THREE.Group();
  const hang = 1.05;
  const Hh = 0.8;
  const shade = new THREE.MeshStandardMaterial({
    color: '#f2e9da',
    roughness: 0.62,
    metalness: 0,
    side: THREE.DoubleSide,
    envMapIntensity: 0.4,
    dithering: true,
  });

  const twist = 1.75;
  const ribs = 88;
  const squircle = (a: number) => 1 / Math.pow(Math.pow(Math.abs(Math.cos(a)), 4) + Math.pow(Math.abs(Math.sin(a)), 4), 0.25);
  const geo = surface(
    (u, v, out) => {
      const a = u * Math.PI * 2;
      const turn = a + twist * v;
      // Arriba se cierra en el cuello; abajo abre en cuadrado suave.
      const open = Math.pow(Math.sin(Math.min(1, v * 1.25 + 0.04) * Math.PI * 0.5), 0.8);
      const r = (0.06 + 0.31 * open) * (1 + (squircle(turn) - 1) * open) * (1 + 0.018 * Math.sin(ribs * a) * open);
      out.set(Math.cos(a) * r, Hh * (1 - v), Math.sin(a) * r);
    },
    ribs * 4,
    64,
  );
  root.add(at(mesh(geo, shade), 0, hang, 0));

  const bulbY = hang + 0.34;
  const { group: bulb, filament } = filamentBulb();
  root.add(at(bulb, 0, bulbY, 0));
  root.add(
    at(
      mesh(new THREE.CylinderGeometry(0.012, 0.012, Hh - 0.34 - 0.14, 10), bodyMaterial('blanco'), false),
      0,
      (bulbY + 0.15 + hang + Hh) / 2,
      0,
    ),
  );
  hangCord(root, hang + Hh);

  const fill = new THREE.PointLight('#ffffff', 0, 2.2, 2);
  fill.position.set(0, bulbY, 0);
  root.add(fill);
  const { group, light } = spot(0.85, 0.9);
  root.add(at(group, 0, bulbY - 0.1, 0));
  const glow = at(makeGlow(1.7), 0, hang + Hh * 0.45, 0);
  root.add(glow);

  return {
    root,
    env: 'table',
    azimuth: 0.4,
    focus: V(0, hang + 0.4, 0),
    ghost: { y: 2.3, width: 3.4 },
    halo: { y: 1.4, intensity: 4.5 },
    view: () => ({ target: V(0, 1.05, 0), radius: 5.3, polar: 1.64, minPolar: 1.15, maxPolar: 1.72 }),
    apply(s) {
      fill.color.copy(s.color);
      fill.intensity = 2.4 * s.power;
      light.color.copy(s.color);
      light.intensity = 10 * s.power;
      filament.color.copy(s.color).multiplyScalar(0.03 + 6 * s.power);
      // El material deja pasar la luz: toda la pantalla brilla desde dentro.
      shade.emissive.copy(s.color);
      shade.emissiveIntensity = 0.34 * s.power;
      glow.material.color.copy(s.color);
      glow.material.opacity = 0.2 * s.power;
    },
    setFinish() {},
  };
}
