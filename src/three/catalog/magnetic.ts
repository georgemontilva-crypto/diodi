// Sistema magnético: riel de superficie y los módulos que se enganchan a él.

import * as THREE from 'three';
import { applyFinish, bodyMaterial, makeGlow, mesh } from '../kit';
import { CEILING as H, V, at, spot, type Lamp } from '../lamp';
import {
  TRACK,
  baffleMaterial,
  beamCone,
  canGeometry,
  emitterMaterial,
  opalMaterial,
  opticModule,
  reflectorMaterial,
  roundedBox,
  trackAdapter,
  trackRail,
} from '../parts';

/** Altura de la boca del riel: de ahí cuelgan los módulos. */
const MOUTH = H - TRACK.h;
const ORBIT = { min: -1.15, max: 1.15 };

function withRail(length = 3.8) {
  const root = new THREE.Group();
  root.add(at(trackRail(length), 0, H, 0));
  return root;
}

/* ── Spot orientable ── */

export function magSpot(): Lamp {
  const root = withRail();
  const body = bodyMaterial('negro');
  const R = 0.125;
  const L = 0.5;

  root.add(at(trackAdapter(0.6, body), 0, MOUTH, 0));
  root.add(at(mesh(roundedBox(0.6, 0.022, TRACK.w + 0.006, 0.006), body), 0, MOUTH - 0.011, 0));

  const pan = at(new THREE.Group(), 0, MOUTH - 0.022, 0);
  root.add(pan);
  pan.add(at(mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.085, 24), body), 0, -0.0425, 0));
  const hinge = at(new THREE.Group(), 0, -0.1, 0);
  pan.add(hinge);
  const knuckle = mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.075, 24), body);
  knuckle.rotation.z = Math.PI / 2;
  hinge.add(knuckle);
  // El cuerpo se sujeta por un costado, cerca de la tapa trasera.
  const off = R + 0.03;
  hinge.add(at(mesh(roundedBox(0.05, 0.06, off, 0.008), body), 0, 0, off / 2));
  const head = at(new THREE.Group(), 0, 0.11, off);
  hinge.add(head);
  head.add(mesh(canGeometry(R, L, 0.012), body));
  head.add(
    at(mesh(new THREE.CylinderGeometry(R - 0.012, R - 0.012, 0.09, 48, 1, true), baffleMaterial(), false), 0, -L + 0.045, 0),
  );
  const optic = opticModule(R - 0.014, 0.11, 'cromo');
  head.add(at(optic.group, 0, -L + 0.085, 0));
  const { group: lightGroup, light } = spot(0.3, 0.55, true);
  head.add(at(lightGroup, 0, -L + 0.12, 0));
  const beam = beamCone(0.3, 2.3, R * 0.6);
  const beamHolder = at(new THREE.Group(), 0, -L + 0.14, 0);
  beamHolder.add(beam.cone);
  head.add(beamHolder);
  const glow = at(makeGlow(0.5), 0, -L + 0.03, 0);
  head.add(glow);

  return {
    root,
    env: 'room',
    orbit: ORBIT,
    subject: true,
    azimuth: 0,
    focus: V(0, H - 0.45, 0.1),
    ghost: { y: 1.25, width: 3.2 },
    halo: { y: 1.0, intensity: 0.3 },
    view: () => ({ target: V(0, 1.22, 0), radius: 3.95, polar: 1.66, minPolar: 1.35, maxPolar: 1.74 }),
    apply(s) {
      pan.rotation.y = Math.PI + s.pan * Math.PI * 2;
      hinge.rotation.x = -s.tilt * (Math.PI / 2);
      light.color.copy(s.color);
      light.intensity = 24 * s.power;
      optic.set(s.color, s.power);
      beam.mat.color.copy(s.color);
      beam.mat.opacity = 0.011 * s.power;
      glow.material.color.copy(s.color);
      glow.material.opacity = 0;
    },
    setFinish(id) {
      applyFinish(body, id);
    },
  };
}

/* ── Lineal de puntos (grille) ── */

export function magGrille(variant = '6'): Lamp {
  const n = variant === '12' ? 12 : 6;
  const root = withRail();
  const body = bodyMaterial('negro');
  const pitch = 0.094;
  const len = n * pitch + 0.07;
  const w = TRACK.w + 0.008;
  const face = MOUTH - 0.1;

  root.add(at(mesh(roundedBox(len, 0.085, TRACK.w - 0.03, 0.006), body), 0, MOUTH + 0.005, 0));
  root.add(at(mesh(roundedBox(len, 0.05, w, 0.008), body), 0, MOUTH - 0.025, 0));
  // Bandeja que aloja las celdas.
  for (const s of [-1, 1])
    root.add(at(mesh(roundedBox(len, 0.055, 0.008, 0.003), body), 0, face + 0.0275, (s * (w - 0.008)) / 2));
  for (const s of [-1, 1])
    root.add(at(mesh(roundedBox(0.012, 0.055, w, 0.003), body), (s * (len - 0.012)) / 2, face + 0.0275, 0));

  const cup = reflectorMaterial('negro');
  const led = emitterMaterial();
  const cupGeo = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.012, 0.05),
      new THREE.Vector2(0.02, 0.028),
      new THREE.Vector2(0.036, 0.002),
      new THREE.Vector2(0.041, 0),
    ],
    32,
  );
  const ledGeo = new THREE.CircleGeometry(0.0125, 20);
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * pitch;
    root.add(at(mesh(cupGeo, cup, false), x, face, 0));
    const dot = mesh(ledGeo, led, false);
    dot.rotation.x = Math.PI / 2;
    root.add(at(dot, x, face + 0.048, 0));
  }

  const count = n === 12 ? 3 : 2;
  const lights: THREE.SpotLight[] = [];
  for (let i = 0; i < count; i++) {
    const x = ((i - (count - 1) / 2) * len) / count;
    const { group, light } = spot(0.4, 0.7, i === 0);
    root.add(at(group, x, face + 0.02, 0));
    lights.push(light);
  }
  const glow = at(makeGlow(len * 1.5, 0.34), 0, face - 0.02, 0);
  root.add(glow);

  return {
    root,
    env: 'room',
    orbit: ORBIT,
    subject: true,
    azimuth: 0,
    focus: V(0, H - 0.3, 0),
    ghost: { y: 1.25, width: 2.6 },
    halo: { y: 1.0, intensity: 0.3 },
    view: () => ({ target: V(0, 1.22, 0), radius: 3.95, polar: 1.66, minPolar: 1.35, maxPolar: 1.74 }),
    apply(s) {
      for (const l of lights) {
        l.color.copy(s.color);
        l.intensity = (n === 12 ? 11 : 13) * s.power;
      }
      led.color.copy(s.color).multiplyScalar(0.05 + 6 * s.power);
      cup.emissive.copy(s.color);
      cup.emissiveIntensity = 0.3 * s.power;
      glow.material.color.copy(s.color);
      glow.material.opacity = 0;
    },
    setFinish(id) {
      applyFinish(body, id);
    },
  };
}

/* ── Lineal difuso ── */

export function magLinear(): Lamp {
  const root = withRail();
  const body = bodyMaterial('negro');
  const opal = opalMaterial();
  const len = 1.6;
  const w = TRACK.w + 0.008;

  root.add(at(mesh(roundedBox(len, 0.085, TRACK.w - 0.03, 0.006), body), 0, MOUTH + 0.005, 0));
  root.add(at(mesh(roundedBox(len, 0.06, w, 0.008), body), 0, MOUTH - 0.03, 0));
  root.add(at(mesh(roundedBox(len - 0.03, 0.022, w - 0.022, 0.009), opal, false), 0, MOUTH - 0.064, 0));

  const lights: THREE.SpotLight[] = [];
  for (const x of [-0.45, 0.45]) {
    const { group, light } = spot(1.1, 1, x < 0);
    root.add(at(group, x, MOUTH - 0.08, 0));
    lights.push(light);
  }
  const glow = at(makeGlow(len * 1.5, 0.5), 0, MOUTH - 0.1, 0);
  root.add(glow);

  return {
    root,
    env: 'room',
    orbit: ORBIT,
    subject: true,
    azimuth: 0,
    focus: V(0, H - 0.25, 0),
    ghost: { y: 1.25, width: 2.4 },
    halo: { y: 1.0, intensity: 0.6 },
    view: () => ({ target: V(0, 1.22, 0), radius: 3.95, polar: 1.66, minPolar: 1.35, maxPolar: 1.74 }),
    apply(s) {
      for (const l of lights) {
        l.color.copy(s.color);
        l.intensity = 4.5 * s.power;
      }
      opal.emissive.copy(s.color);
      opal.emissiveIntensity = 0.02 + 2.6 * s.power;
      glow.material.color.copy(s.color);
      glow.material.opacity = 0.34 * s.power;
    },
    setFinish(id) {
      applyFinish(body, id);
    },
  };
}

/* ── Globo ── */

export function magGlobe(): Lamp {
  const root = withRail();
  const body = bodyMaterial('negro');
  const opal = opalMaterial();
  opal.roughness = 0.3;
  const r = 0.3;
  const cy = MOUTH - 0.13 - r;

  root.add(at(trackAdapter(0.36, body), 0, MOUTH, 0));
  root.add(at(mesh(roundedBox(0.36, 0.022, TRACK.w + 0.006, 0.006), body), 0, MOUTH - 0.011, 0));
  root.add(at(mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.1, 16), body), 0, MOUTH - 0.07, 0));
  root.add(at(mesh(new THREE.CylinderGeometry(0.06, 0.075, 0.035, 32), body), 0, MOUTH - 0.125, 0));
  root.add(at(mesh(new THREE.SphereGeometry(r, 72, 48), opal, false), 0, cy, 0));

  const light = new THREE.PointLight('#ffffff', 0, 0, 2);
  light.position.set(0, cy, 0);
  root.add(light);
  const glow = at(makeGlow(1.9), 0, cy, 0);
  root.add(glow);

  return {
    root,
    env: 'room',
    orbit: ORBIT,
    azimuth: 0,
    focus: V(0, cy, 0),
    ghost: { y: 0.95, width: 2.4 },
    halo: { y: 1.0, intensity: 1.4 },
    view: () => ({ target: V(0, 1.12, 0), radius: 4.5, polar: 1.66, minPolar: 1.35, maxPolar: 1.74 }),
    apply(s) {
      light.color.copy(s.color);
      light.intensity = 2.5 * s.power;
      opal.emissive.copy(s.color);
      opal.emissiveIntensity = 0.02 + 1.25 * s.power;
      glow.material.color.copy(s.color);
      glow.material.opacity = 0.2 * s.power;
    },
    setFinish(id) {
      applyFinish(body, id);
    },
  };
}
