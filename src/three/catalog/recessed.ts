// Empotrados que se muestran flotando para ver el cuerpo entero: Lamba, mini de reflector y lineal de 4 focos.

import * as THREE from 'three';
import { applyFinish, bodyMaterial, flutedCylinder, lerp, makeGlow, mesh } from '../kit';
import { V, at, spot, type Lamp } from '../lamp';
import {
  aluminium,
  applyReflector,
  canGeometry,
  emitterMaterial,
  heatSink,
  lathe,
  lensMaterial,
  opticModule,
  reflectorMaterial,
  springClip,
  steel,
  type Reflector,
} from '../parts';
import { cobTexture } from '../kit';

/* ── Lamba: downlight antideslumbrante con disipador ── */

export function lamba(): Lamp {
  const root = new THREE.Group();
  const trimMat = bodyMaterial('blanco', { side: THREE.DoubleSide });
  const cone = reflectorMaterial('negro');
  cone.roughness = 0.5;
  const cast = aluminium('#6f7073', 0.55);
  const chip = emitterMaterial(cobTexture());
  const board = new THREE.MeshStandardMaterial({ color: '#e6e3dc', roughness: 0.6, envMapIntensity: 0.3 });
  const optic = lensMaterial();
  optic.opacity = 0.34;
  optic.flatShading = true;

  const base = 0.85;
  const asm = at(new THREE.Group(), 0, base, 0);
  root.add(asm);
  const part = (y: number, spread: number) => {
    const g = at(new THREE.Group(), 0, y, 0);
    g.userData = { y, spread };
    asm.add(g);
    return g;
  };

  // 1 · Aro visto y cono antideslumbrante profundo.
  const trim = part(0, -0.62);
  trim.add(
    mesh(
      lathe([
        [0.465, 0.03],
        [0.55, 0.03],
        [0.565, 0.018],
        [0.565, 0],
        [0.47, 0],
        [0.465, 0.012],
      ]),
      trimMat,
    ),
  );
  trim.add(
    mesh(
      new THREE.LatheGeometry([new THREE.Vector2(0.21, 0.4), new THREE.Vector2(0.3, 0.2), new THREE.Vector2(0.462, 0.012)], 72),
      cone,
      false,
    ),
  );

  // 2 · Óptica de 36°.
  const lensPart = part(0.39, -0.08);
  const glass = mesh(flutedCylinder(0.2, 0.17, 0.07, 36, 0.008, false), optic, false);
  glass.renderOrder = 6;
  lensPart.add(at(glass, 0, 0.035, 0));

  // 3 · Módulo LED.
  const led = part(0.47, 0.3);
  led.add(at(mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.022, 48), board), 0, 0.011, 0));
  const die = mesh(new THREE.CircleGeometry(0.095, 40), chip, false);
  die.rotation.x = Math.PI / 2;
  led.add(at(die, 0, -0.002, 0));

  // 4 · Carcasa de fundición con disipador de aletas.
  const sink = part(0.16, 0.86);
  sink.add(
    mesh(
      lathe([
        [0.23, 0.33],
        [0.5, 0.33],
        [0.51, 0.31],
        [0.51, 0.02],
        [0.5, 0],
        [0.47, 0],
      ]),
      cast,
    ),
  );
  sink.add(at(heatSink(0.37, 0.4, 34, cast), 0, 0.33, 0));
  sink.add(at(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 40), cast), 0, 0.74, 0));

  // 5 · Aro de montaje con clips de resorte.
  const mount = part(0.24, 1.72);
  mount.add(at(mesh(new THREE.CylinderGeometry(0.522, 0.522, 0.1, 96, 1, true), steel()), 0, 0.05, 0));
  for (const side of [-1, 1]) {
    const clip = springClip(0.4);
    clip.rotation.z = 0.55;
    clip.scale.x = side;
    clip.position.set(side * 0.53, 0.07, 0);
    mount.add(clip);
  }

  const parts = [trim, lensPart, led, sink, mount];
  const { group, light } = spot(0.34, 0.6);
  root.add(at(group, 0, base + 0.2, 0));
  const glow = at(makeGlow(1.0, 0.5), 0, base + 0.06, 0);
  root.add(glow);
  const tmp = new THREE.Color();

  return {
    root,
    env: 'studio',
    azimuth: 0.4,
    focus: V(0, base + 0.4, 0),
    ghost: { y: 2.25, width: 3.4 },
    halo: { y: 1.3, intensity: 2.6 },
    view: (s) => ({
      target: V(0, base + 0.34 + s.explode * 0.42, 0),
      radius: 5.4 + s.explode * 4.3,
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
      light.intensity = 14 * lit;
      chip.color
        .copy(tmp.set('#5a5346'))
        .lerp(s.color, Math.min(1, s.power * 1.4))
        .multiplyScalar(1 + 5 * s.power);
      optic.emissive.copy(s.color);
      optic.emissiveIntensity = 0.7 * s.power;
      cone.emissive.copy(s.color);
      cone.emissiveIntensity = 0.05 * lit;
      glow.position.y = base + 0.06 + trim.userData.spread * s.explode * 0.4;
      glow.material.color.copy(s.color);
      glow.material.opacity = 0.5 * lit;
    },
    setFinish(id) {
      applyFinish(trimMat, id);
    },
  };
}

/* ── Mini: spot empotrado con aro reflector intercambiable ── */

export function miniSpot(): Lamp {
  const root = new THREE.Group();
  const trim = reflectorMaterial('blanco');
  const cast = aluminium('#77797c', 0.5);
  const wire = new THREE.MeshStandardMaterial({ color: '#c9b27a', metalness: 1, roughness: 0.3, envMapIntensity: 1 });
  const base = 0.95;
  const g = at(new THREE.Group(), 0, base, 0);
  root.add(g);

  // Aro reflector: lo único que queda a la vista una vez instalado.
  g.add(
    mesh(
      lathe([
        [0.2, 0.27],
        [0.215, 0.27],
        [0.5, 0.03],
        [0.56, 0.03],
        [0.56, 0],
        [0.47, 0],
        [0.2, 0.25],
      ]),
      trim,
    ),
  );
  const optic = opticModule(0.2, 0.05, 'blanco');
  g.add(at(optic.group, 0, 0.25, 0));
  // Cuerpo del módulo.
  g.add(
    at(
      mesh(
        lathe([
          [0, 0.2],
          [0.27, 0.2],
          [0.285, 0.185],
          [0.285, 0.015],
          [0.27, 0],
          [0, 0],
        ]),
        cast,
      ),
      0,
      0.3,
      0,
    ),
  );
  g.add(
    at(
      mesh(
        new THREE.CylinderGeometry(0.287, 0.287, 0.05, 64, 1, true),
        new THREE.MeshStandardMaterial({ color: '#3a3b3d', roughness: 0.6, metalness: 0.6, envMapIntensity: 0.6 }),
      ),
      0,
      0.4,
      0,
    ),
  );
  // Resortes de alambre.
  for (const side of [-1, 1]) {
    const path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.29, 0.34, 0),
      new THREE.Vector3(side * 0.4, 0.42, 0),
      new THREE.Vector3(side * 0.6, 0.62, 0),
      new THREE.Vector3(side * 0.66, 0.7, 0),
    ]);
    for (const z of [-0.07, 0.07]) g.add(at(mesh(new THREE.TubeGeometry(path, 16, 0.009, 8), wire), 0, 0, z));
    const bar = mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.14, 8), wire);
    bar.rotation.x = Math.PI / 2;
    g.add(at(bar, side * 0.66, 0.7, 0));
  }

  const { group, light } = spot(0.5, 0.7);
  root.add(at(group, 0, base - 0.06, 0));
  const glow = at(makeGlow(0.9, 0.45), 0, base + 0.05, 0);
  root.add(glow);

  return {
    root,
    env: 'studio',
    azimuth: 0.5,
    focus: V(0, base + 0.25, 0),
    ghost: { y: 2.1, width: 2.4 },
    halo: { y: 1.2, intensity: 2.2 },
    view: () => ({ target: V(0, base + 0.22, 0), radius: 4.6, polar: 1.72, minPolar: 1.0, maxPolar: 1.76 }),
    apply(s) {
      light.color.copy(s.color);
      light.intensity = 9 * s.power;
      optic.set(s.color, s.power);
      trim.emissive.copy(s.color);
      trim.emissiveIntensity = 0.03 * s.power;
      glow.material.color.copy(s.color);
      glow.material.opacity = 0;
    },
    setFinish(id) {
      applyReflector(trim, id as Reflector);
    },
  };
}

/* ── Lineal de 4 focos ── */

export function linearFour(): Lamp {
  const root = new THREE.Group();
  const plateMat = bodyMaterial('blanco');
  const ringMat = bodyMaterial('blanco');
  const black = bodyMaterial('negro');
  const red = new THREE.MeshStandardMaterial({ color: '#c8372d', roughness: 0.5, envMapIntensity: 0.4 });
  const base = 1.0;
  const g = at(new THREE.Group(), 0, base, 0);
  root.add(g);

  const pitch = 0.56;
  const W = pitch * 4 + 0.14;
  const D = 0.62;
  const hole = 0.215;
  // Placa con cuatro perforaciones reales.
  const shape = new THREE.Shape();
  const r = 0.03;
  shape.moveTo(-W / 2 + r, -D / 2);
  shape.lineTo(W / 2 - r, -D / 2);
  shape.quadraticCurveTo(W / 2, -D / 2, W / 2, -D / 2 + r);
  shape.lineTo(W / 2, D / 2 - r);
  shape.quadraticCurveTo(W / 2, D / 2, W / 2 - r, D / 2);
  shape.lineTo(-W / 2 + r, D / 2);
  shape.quadraticCurveTo(-W / 2, D / 2, -W / 2, D / 2 - r);
  shape.lineTo(-W / 2, -D / 2 + r);
  shape.quadraticCurveTo(-W / 2, -D / 2, -W / 2 + r, -D / 2);
  const xs = [-1.5, -0.5, 0.5, 1.5].map((k) => k * pitch);
  for (const x of xs) {
    const h = new THREE.Path();
    h.absarc(x, 0, hole, 0, Math.PI * 2, true);
    shape.holes.push(h);
  }
  const plateGeo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.02,
    bevelEnabled: true,
    bevelSize: 0.006,
    bevelThickness: 0.006,
    bevelSegments: 2,
    curveSegments: 48,
  });
  plateGeo.rotateX(-Math.PI / 2);
  g.add(mesh(plateGeo, plateMat));
  // Bandeja de chapa por detrás.
  g.add(at(mesh(new THREE.BoxGeometry(W - 0.12, 0.1, 0.012), plateMat), 0, 0.075, D / 2 - 0.07));
  g.add(at(mesh(new THREE.BoxGeometry(W - 0.12, 0.1, 0.012), plateMat), 0, 0.075, -D / 2 + 0.07));
  for (const s of [-1, 1]) g.add(at(mesh(new THREE.BoxGeometry(0.05, 0.05, 0.16), red), s * (W / 2 - 0.035), 0.06, 0));

  const optics = xs.map((x) => {
    const head = at(new THREE.Group(), x, 0, 0);
    g.add(head);
    // Aro basculante y cuerpo con aletas.
    head.add(
      mesh(
        lathe([
          [0.15, 0.1],
          [0.205, 0.02],
          [0.205, 0.004],
          [0.19, 0.004],
          [0.14, 0.09],
        ]),
        ringMat,
        false,
      ),
    );
    const optic = opticModule(0.14, 0.09, 'cromo');
    head.add(at(optic.group, 0, 0.09, 0));
    const can = mesh(canGeometry(0.2, 0.46, 0.012), black);
    can.rotation.x = Math.PI;
    head.add(at(can, 0, 0.1, 0));
    for (let i = 0; i < 5; i++)
      head.add(at(mesh(new THREE.CylinderGeometry(0.204, 0.204, 0.018, 48, 1, true), black, false), 0, 0.3 + i * 0.045, 0));
    head.add(at(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 20), black), 0, 0.585, 0));
    return optic;
  });

  const lights = xs.map((x, i) => {
    const { group, light } = spot(0.36, 0.6, i === 1);
    root.add(at(group, x, base + 0.12, 0));
    return light;
  });
  const glow = at(makeGlow(W * 1.2, 0.55), 0, base - 0.02, 0);
  root.add(glow);

  return {
    root,
    env: 'studio',
    azimuth: 0.35,
    focus: V(0, base + 0.2, 0),
    ghost: { y: 2.3, width: 3.4 },
    halo: { y: 1.3, intensity: 2.4 },
    view: () => ({ target: V(0, base + 0.16, 0), radius: 6.3, polar: 1.7, minPolar: 1.0, maxPolar: 1.75 }),
    apply(s) {
      for (const l of lights) {
        l.color.copy(s.color);
        l.intensity = 8 * s.power;
      }
      for (const o of optics) o.set(s.color, s.power);
      glow.material.color.copy(s.color);
      glow.material.opacity = 0.4 * s.power;
    },
    setFinish(id) {
      applyFinish(plateMat, id);
      applyFinish(ringMat, id);
    },
  };
}
