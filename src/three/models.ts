// Luminarias modeladas por código (sin archivos .glb): cada función devuelve la pieza,
// sus luces y cómo debe encuadrarla la cámara.

import * as THREE from 'three';
import type { ModelId } from '../data/catalog';
import { applyFinish, bodyMaterial, flutedCylinder, hammeredTexture, lightMaterial, makeGlow, mesh } from './kit';

import { V, at, type Lamp } from './lamp';
import { magGlobe, magGrille, magLinear, magSpot } from './catalog/magnetic';
import { spot360, surfaceCan, surfaceTilt } from './catalog/ceiling';
import { lamba, linearFour, miniSpot } from './catalog/recessed';
import { bollard, wallBifocus, wallCube, wallCurved, wallEmerald, wallTrap } from './catalog/wall';
import { pendantSpiral, pendantStone } from './catalog/organic';

export type { EnvId, Lamp, LampState, LampView } from './lamp';

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
  const cord = at(mesh(new THREE.CylinderGeometry(0.006, 0.006, 6, 8), body, false), 0, hang + top + 3, 0);
  cord.name = 'cord';
  cord.userData.from = hang + top;
  root.add(cord);
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

export function buildLamp(id: ModelId, variant?: string): Lamp {
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
    case 'pendantStone':
      return pendantStone();
    case 'pendantSpiral':
      return pendantSpiral();
    case 'spot360':
      return spot360();
    case 'surfaceCan':
      return surfaceCan();
    case 'surfaceTilt':
      return surfaceTilt();
    case 'lamba':
      return lamba();
    case 'miniSpot':
      return miniSpot();
    case 'linearFour':
      return linearFour();
    case 'magSpot':
      return magSpot();
    case 'magGrille':
      return magGrille(variant);
    case 'magLinear':
      return magLinear();
    case 'magGlobe':
      return magGlobe();
    case 'wallCurved':
      return wallCurved(variant);
    case 'wallTrap':
      return wallTrap();
    case 'wallBifocus':
      return wallBifocus();
    case 'wallEmerald':
      return wallEmerald();
    case 'wallCube':
      return wallCube();
    case 'bollard':
      return bollard();
  }
}
