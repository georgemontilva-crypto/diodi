// Luminarias de techo a la vista: cilindros de superficie y el empotrado retráctil Spotlight 360.

import * as THREE from 'three';
import { applyFinish, bodyMaterial, lerp, makeGlow, mesh } from '../kit';
import { CEILING as H, V, at, spot, type Lamp } from '../lamp';
import { baffleMaterial, beamCone, canGeometry, opticModule, puckGeometry, reflectorMaterial, roundedBox } from '../parts';

/** Cono antideslumbrante negro brillante entre la boca y la óptica. Boca en y=0, sube hasta `depth`. */
function antiGlare(rMouth: number, rOptic: number, depth: number) {
  return mesh(
    new THREE.LatheGeometry([new THREE.Vector2(rOptic, depth), new THREE.Vector2(rMouth, 0)], 64),
    reflectorMaterial('negro'),
    false,
  );
}

/* ── Cilindro de superficie ── */

export function surfaceCan(): Lamp {
  const root = new THREE.Group();
  const body = bodyMaterial('negro');
  const R = 0.29;
  const L = 0.62;

  root.add(at(mesh(canGeometry(R, L, 0.016, 0.01), body), 0, H, 0));
  root.add(at(antiGlare(R - 0.018, 0.15, 0.2), 0, H - L + 0.004, 0));
  const optic = opticModule(0.15, 0.1, 'cromo');
  root.add(at(optic.group, 0, H - L + 0.2, 0));

  const { group, light } = spot(0.4, 0.6, true);
  root.add(at(group, 0, H - L + 0.22, 0));
  const beam = beamCone(0.4, 1.5, R * 0.5);
  root.add(at(new THREE.Group().add(beam.cone), 0, H - L + 0.1, 0));
  const glow = at(makeGlow(0.8), 0, H - L, 0);
  root.add(glow);

  return {
    root,
    env: 'room',
    orbit: { min: -1.15, max: 1.15 },
    subject: true,
    azimuth: 0,
    focus: V(0, H - 0.4, 0),
    ghost: { y: 1.25, width: 2.6 },
    halo: { y: 1.0, intensity: 0.3 },
    view: () => ({ target: V(0, 1.22, 0), radius: 3.95, polar: 1.66, minPolar: 1.35, maxPolar: 1.74 }),
    apply(s) {
      light.color.copy(s.color);
      light.intensity = 26 * s.power;
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

/* ── Cilindro orientable sobre base ── */

export function surfaceTilt(): Lamp {
  const root = new THREE.Group();
  const body = bodyMaterial('negro');
  const R = 0.21;
  const L = 0.38;
  const MAX = (60 * Math.PI) / 180;

  root.add(at(mesh(puckGeometry(0.19, 0.16, 0.01), body), 0, H - 0.08, 0));
  root.add(at(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.06, 24), body), 0, H - 0.19, 0));
  const hinge = at(new THREE.Group(), 0, H - 0.22, 0);
  root.add(hinge);
  const pin = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 20), body);
  pin.rotation.z = Math.PI / 2;
  hinge.add(pin);
  const head = at(new THREE.Group(), 0, 0.02, 0);
  hinge.add(head);
  head.add(mesh(canGeometry(R, L, 0.014, 0.01), body));
  head.add(at(antiGlare(R - 0.016, 0.12, 0.14), 0, -L + 0.004, 0));
  const optic = opticModule(0.12, 0.08, 'cromo');
  head.add(at(optic.group, 0, -L + 0.14, 0));
  const { group, light } = spot(0.36, 0.55, true);
  head.add(at(group, 0, -L + 0.16, 0));
  const beam = beamCone(0.36, 2.2, R * 0.5);
  head.add(at(new THREE.Group().add(beam.cone), 0, -L + 0.08, 0));
  const glow = at(makeGlow(0.6), 0, -L, 0);
  head.add(glow);

  return {
    root,
    env: 'room',
    subject: true,
    azimuth: -0.28,
    focus: V(0, H - 0.35, 0),
    ghost: { y: 1.3, width: 3.1 },
    halo: { y: 1.0, intensity: 0.3 },
    view: () => ({ target: V(0, 1.22, 0), radius: 3.95, polar: 1.66, minPolar: 1.35, maxPolar: 1.74 }),
    apply(s) {
      hinge.rotation.x = s.tilt * MAX;
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

/* ── Spotlight 360: empotrado que sale del techo, se inclina 90° y gira 360° ── */

export function spot360(): Lamp {
  const L = 0.5;
  const R = 0.19;
  const HALF = 0.32;
  const root = new THREE.Group();
  const body = bodyMaterial('negro');
  const dark = baffleMaterial();

  // Aro al ras del techo y hueco.
  root.add(at(mesh(puckGeometry(0.285, 0.02, 0.006, 96), body, false), 0, H - 0.01, 0));
  const hole = mesh(new THREE.CircleGeometry(0.215, 64), dark, false);
  hole.rotation.x = Math.PI / 2;
  root.add(at(hole, 0, H - 0.0205, 0));

  const arm = mesh(roundedBox(0.1, 1, 0.05, 0.006), dark, false);
  root.add(arm);
  const pivot = new THREE.Group();
  root.add(pivot);
  const slide = new THREE.Group();
  pivot.add(slide);

  slide.add(mesh(canGeometry(R, L, 0.014, 0.01), body));
  slide.add(at(antiGlare(R - 0.016, 0.115, 0.15), 0, -L + 0.004, 0));
  const optic = opticModule(0.115, 0.08, 'cromo');
  slide.add(at(optic.group, 0, -L + 0.15, 0));

  const { group, light } = spot(HALF, 0.5, true);
  slide.add(at(group, 0, -L + 0.14, 0));
  const beam = beamCone(HALF, 2.4, R * 0.6);
  slide.add(at(new THREE.Group().add(beam.cone), 0, -L + 0.2, 0));
  const glow = at(makeGlow(0.7), 0, -L + 0.05, 0);
  slide.add(glow);

  return {
    root,
    env: 'room',
    subject: true,
    azimuth: -0.28,
    focus: V(0, H - 0.3, 0),
    ghost: { y: 1.3, width: 3.1 },
    halo: { y: 1.0, intensity: 0.35 },
    view: () => ({ target: V(0, 1.22, 0), radius: 3.95, polar: 1.66, minPolar: 1.35, maxPolar: 1.74 }),
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
      light.intensity = 26 * s.power;
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
