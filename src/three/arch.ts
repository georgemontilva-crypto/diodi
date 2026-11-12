// Escenarios arquitectónicos "del plano a la luz": cada escena se dibuja dos veces,
// como plano de líneas y como espacio iluminado, y la pantalla se reparte entre ambas.

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { ModelId } from '../data/catalog';
import { NIGHT, clamp01, disposeTree, glowTexture, smooth } from './kit';
import { buildLamp, type Lamp } from './models';

export type ArchId = 'interior' | 'fachada';

const LIT = 0;
const PLAN = 1;
const WARM = '#ffb163';
/** Luz de obra: algo menos saturada que la de las luminarias, para que el espacio no se vuelva monocromo. */
const SOFT = '#ffc994';
const PLAN_BG = '#0f0c09';

interface View {
  pos: [number, number, number];
  target: [number, number, number];
  fov: number;
}

interface Built {
  group: THREE.Group;
  /** Encendido 0–1: las luces entran escalonadas. */
  apply(power: number): void;
  wide: View;
  narrow: View;
  /** Color de fondo del pase iluminado. */
  sky?: string;
}

/* ───────────────────────── Utilidades de construcción ───────────────────────── */

const std = (color: string, roughness = 0.9, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, dithering: true, ...extra });

function beamDecalTexture(kind: 'updown' | 'down'): THREE.Texture {
  const W = 128;
  const H = 256;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  const cone = (y0: number, y1: number) => {
    // Capas de triángulos cada vez más anchos: un haz con borde suave.
    for (let i = 0; i < 14; i++) {
      const spread = 0.12 + i * 0.03;
      const grad = g.createLinearGradient(0, y0, 0, y1);
      grad.addColorStop(0, `rgba(255,255,255,${0.2 - i * 0.011})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grad;
      g.beginPath();
      g.moveTo(W / 2 - 3, y0);
      g.lineTo(W / 2 + 3, y0);
      g.lineTo(W / 2 + W * spread, y1);
      g.lineTo(W / 2 - W * spread, y1);
      g.closePath();
      g.fill();
    }
  };
  if (kind === 'updown') {
    cone(H / 2, 0);
    cone(H / 2, H);
  } else {
    cone(4, H);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function washTexture(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = 8;
  c.height = 128;
  const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, 'rgba(255,255,255,0.9)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.28)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 8, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Interior cálido visto desde fuera, a través del acristalamiento del acceso. */
function entranceTexture(): THREE.Texture {
  const W = 256;
  const H = 320;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#5a2c10');
  bg.addColorStop(0.55, '#c2702c');
  bg.addColorStop(1, '#f2a652');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  // Panel de madera al fondo, vano de paso y consola.
  g.fillStyle = 'rgba(60,26,8,0.55)';
  g.fillRect(150, 150, 82, 150);
  g.fillStyle = 'rgba(255,214,150,0.5)';
  for (let i = 0; i < 9; i++) g.fillRect(24 + i * 13, 150, 2, 150);
  g.fillStyle = 'rgba(40,18,6,0.7)';
  g.fillRect(30, 262, 96, 6);
  g.fillRect(40, 268, 4, 34);
  g.fillRect(112, 268, 4, 34);
  const floor = g.createLinearGradient(0, 296, 0, H);
  floor.addColorStop(0, 'rgba(255,196,120,0.9)');
  floor.addColorStop(1, 'rgba(120,60,20,0.9)');
  g.fillStyle = floor;
  g.fillRect(0, 300, W, 20);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Ayudante de escena: registra piezas, luces y el orden en que se encienden. */
class Kit {
  group = new THREE.Group();
  private dimmers: { at: number; fn: (k: number) => void }[] = [];
  private lamps: { lamp: Lamp; at: number; tilt: number; color: THREE.Color }[] = [];
  private decalUpDown = beamDecalTexture('updown');
  private decalDown = beamDecalTexture('down');
  private wash = washTexture();
  private tmp = new THREE.Color();

  box(w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number, shadow = true) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = shadow;
    m.receiveShadow = true;
    this.group.add(m);
    return m;
  }

  cyl(r: number, h: number, mat: THREE.Material, x: number, y: number, z: number, seg = 32) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    this.group.add(m);
    return m;
  }

  add<T extends THREE.Object3D>(o: T) {
    this.group.add(o);
    return o;
  }

  /** Rejilla de despiece sobre el suelo: solo existe en el plano. */
  grid(x0: number, x1: number, z0: number, z1: number, step: number, y = 0.012) {
    const pts: number[] = [];
    for (let x = x0; x <= x1 + 1e-6; x += step) pts.push(x, y, z0, x, y, z1);
    for (let z = z0; z <= z1 + 1e-6; z += step) pts.push(x0, y, z, x1, y, z);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const lines = new THREE.LineSegments(
      geo,
      new THREE.LineBasicMaterial({ color: '#efe6d5', transparent: true, opacity: 0.16 }),
    );
    lines.layers.set(PLAN);
    this.group.add(lines);
  }

  dim(at: number, fn: (k: number) => void) {
    this.dimmers.push({ at, fn });
  }

  /** Luz real que se enciende en el instante `at` del encendido general. */
  light<T extends THREE.Light>(light: T, base: number, at: number) {
    light.intensity = 0;
    this.group.add(light);
    this.dim(at, (k) => (light.intensity = base * k));
    return light;
  }

  spot(from: [number, number, number], to: [number, number, number], base: number, at: number, angle: number, shadow = false) {
    const s = new THREE.SpotLight(SOFT, 0, 0, angle, 0.75, 2);
    s.position.set(...from);
    s.target.position.set(...to);
    this.group.add(s.target);
    if (shadow) {
      s.castShadow = true;
      s.shadow.mapSize.set(1024, 1024);
      s.shadow.bias = -0.0012;
      s.shadow.radius = 5;
      s.shadow.camera.near = 0.3;
      s.shadow.camera.far = 14;
    }
    return this.light(s, base, at);
  }

  /** Pieza que emite luz por sí misma (tira LED, difusor, bombillo). */
  emitter(
    geo: THREE.BufferGeometry,
    x: number,
    y: number,
    z: number,
    base: number,
    at: number,
    color = WARM,
    map?: THREE.Texture,
  ) {
    const mat = new THREE.MeshBasicMaterial({ color: '#000', map });
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    this.group.add(m);
    const c = new THREE.Color(color);
    this.dim(at, (k) => mat.color.copy(c).multiplyScalar(0.03 + base * k));
    return m;
  }

  /** Mancha de luz pintada sobre una pared (haces de apliques, bañadores). */
  decal(
    kind: 'updown' | 'down' | 'wash',
    w: number,
    h: number,
    x: number,
    y: number,
    z: number,
    base: number,
    at: number,
    rotY = 0,
  ) {
    const map = kind === 'updown' ? this.decalUpDown : kind === 'down' ? this.decalDown : this.wash;
    const mat = new THREE.MeshBasicMaterial({
      map,
      color: WARM,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z);
    m.rotation.y = rotY;
    m.userData.noPlan = true;
    m.renderOrder = 4;
    this.group.add(m);
    this.dim(at, (k) => (mat.opacity = base * k));
    return m;
  }

  /** Halo cálido que también se insinúa sobre el plano, como intención de luz. */
  halo(x: number, y: number, z: number, size: number, at: number) {
    for (const layer of [LIT, PLAN]) {
      const mat = new THREE.SpriteMaterial({
        map: glowTexture(),
        color: WARM,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 0,
        fog: false,
      });
      const s = new THREE.Sprite(mat);
      s.position.set(x, y, z);
      s.scale.set(size, size, 1);
      s.layers.set(layer);
      s.userData.noPlan = true;
      s.renderOrder = 6;
      this.group.add(s);
      if (layer === LIT) this.dim(at, (k) => (mat.opacity = 0.34 * k));
      else mat.opacity = 0.2;
    }
  }

  /** Luminaria del catálogo colocada en la escena. Sus luces internas se reemplazan por las de la escena. */
  lamp(
    id: ModelId,
    o: {
      pos: [number, number, number];
      scale?: number;
      rotY?: number;
      tilt?: number;
      finish?: string;
      at: number;
      color?: string;
      /** Altura (en la escena) hasta la que sube el cable de un colgante. */
      hangFrom?: number;
    },
  ) {
    const lamp = buildLamp(id);
    if (o.finish) lamp.setFinish(o.finish);
    lamp.root.position.set(...o.pos);
    lamp.root.scale.setScalar(o.scale ?? 1);
    lamp.root.rotation.y = o.rotY ?? 0;
    lamp.root.traverse((n) => {
      if ((n as THREE.Light).isLight) n.visible = false;
      if ((n as THREE.Mesh).isMesh) n.castShadow = false;
    });
    const cord = lamp.root.getObjectByName('cord');
    if (cord && o.hangFrom !== undefined) {
      const len = Math.max(0.1, (o.hangFrom - o.pos[1]) / (o.scale ?? 1) - cord.userData.from);
      cord.scale.y = len / 6;
      cord.position.y = cord.userData.from + len / 2;
    }
    this.group.add(lamp.root);
    this.lamps.push({ lamp, at: o.at, tilt: o.tilt ?? 0, color: new THREE.Color(o.color ?? WARM) });
    return lamp;
  }

  apply = (power: number) => {
    const level = (at: number) => smooth(at, at + 0.3, power * 1.3);
    for (const d of this.dimmers) d.fn(level(d.at));
    for (const l of this.lamps) {
      l.lamp.apply({ power: level(l.at), color: this.tmp.copy(l.color), tilt: l.tilt, explode: 0 });
    }
  };
}

/* ───────────────────────── Interior: sala y comedor ───────────────────────── */

function interior(): Built {
  const k = new Kit();
  const plaster = std('#cdbda5', 0.95);
  const ceilingMat = std('#b3a592', 0.95);
  const floorMat = std('#4b443d', 0.5);
  const wood = std('#8b6746', 0.6);
  const dark = std('#191715', 0.55);
  const fabric = std('#8d8172', 1);
  const seat = std('#bcab92', 0.8);
  const rug = std('#84796a', 1);
  const stone = std('#a39887', 0.5);
  const glass = std('#0a0e15', 0.08, { metalness: 0.7 });
  const canvas = std('#7f6f5c', 0.9);

  // Caja del espacio.
  k.box(90, 0.2, 90, floorMat, 0, -0.1, 14, false);
  k.box(24.6, 9, 0.3, plaster, 0, 4.5, -8.15, false);
  k.box(0.3, 9, 16.3, plaster, 12.15, 4.5, 0, false);
  k.box(24.9, 0.4, 16.6, ceilingMat, 0, 9.2, 0, false);

  // Ventanal de piso a techo a la izquierda.
  k.box(0.08, 9, 16, glass, -12.1, 4.5, 0, false);
  for (let i = 0; i <= 5; i++) k.box(0.2, 9, 0.2, dark, -12, 4.5, -8 + i * 3.2);
  for (const y of [3, 6]) k.box(0.2, 0.2, 16, dark, -12, y, 0);

  // Foseado de luz en el encuentro de techo y pared del fondo.
  k.emitter(new THREE.BoxGeometry(23.6, 0.07, 0.14), 0, 8.86, -7.9, 1.6, 0);
  k.decal('wash', 23.6, 3.4, 0, 7.25, -7.98, 0.5, 0);

  // Cuadro iluminado por dos Spotlight 360 y consola con una Earthtone.
  k.box(4.6, 3.3, 0.12, dark, -5.6, 4.9, -7.95);
  k.box(4.3, 3.0, 0.14, canvas, -5.6, 4.9, -7.93);
  k.box(6.2, 1.7, 1.2, wood, -5.6, 0.85, -7.3);
  for (const x of [-7.1, -4.1]) {
    k.lamp('spot360', { pos: [x, 9 - 1.9 * 1.25, -4.4], scale: 1.25, tilt: 0.42, at: 0.14 });
    k.spot([x, 8.2, -4.9], [x * 0.4 - 3.4, 4.9, -8], 150, 0.14, 0.34);
  }
  k.lamp('earthtone', { pos: [-7.5, 1.7, -7.3], scale: 0.95, at: 0.62 });
  k.light(new THREE.PointLight(WARM, 0, 7, 2), 9, 0.62).position.set(-7.5, 2.5, -6.9);

  // Cocina: isla, repisa y tres apliques de pared.
  k.box(7.2, 2.3, 2.6, dark, 6.4, 1.15, -3.4);
  k.box(7.6, 0.14, 3, stone, 6.4, 2.37, -3.4);
  k.box(8.4, 0.14, 0.9, wood, 6.4, 4.3, -7.55);
  for (const x of [3.9, 6.4, 8.9]) {
    k.emitter(new THREE.BoxGeometry(0.34, 0.34, 0.2), x, 6.1, -7.9, 2.2, 0.08);
    k.decal('updown', 1.5, 3.4, x, 6.1, -7.97, 0.75, 0.08);
  }
  k.emitter(new THREE.CircleGeometry(0.28, 24), 6.4, 8.99, -3.4, 2.4, 0.28).rotation.x = Math.PI / 2;
  k.spot([6.4, 8.9, -3.4], [6.4, 0, -3.4], 190, 0.28, 0.5);

  // Comedor: mesa, ocho sillas y tres colgantes.
  const tx = -1.6;
  const tz = 1.3;
  k.box(13.5, 0.05, 7.4, rug, tx, 0.025, tz, false);
  k.box(9.8, 0.24, 3.3, wood, tx, 2.46, tz);
  for (const s of [-1, 1]) k.box(0.28, 2.34, 2.7, wood, tx + s * 4.1, 1.17, tz);
  for (const side of [-1, 1]) {
    for (const off of [-3.45, -1.15, 1.15, 3.45]) {
      const cx = tx + off;
      const cz = tz + side * 2.3;
      k.box(1.0, 0.1, 1.0, seat, cx, 1.48, cz);
      k.box(1.0, 1.0, 0.08, seat, cx, 2.25, cz + side * 0.46);
      for (const lx of [-0.42, 0.42]) for (const lz of [-0.4, 0.4]) k.cyl(0.03, 1.43, dark, cx + lx, 0.715, cz + lz, 8);
    }
  }
  const pendants: [ModelId, number, number, number][] = [
    ['pendantDome', tx - 3, 5.25, 0.4],
    ['pendantDisc', tx, 4.9, 0.48],
    ['pendantDome', tx + 3, 5.5, 0.56],
  ];
  pendants.forEach(([id, x, y, at], i) => {
    const s = 1.7;
    k.lamp(id, { pos: [x, y - 1.18 * s, tz], scale: s, at, hangFrom: 9 });
    k.spot([x, y + 0.25, tz], [x, 0, tz], id === 'pendantDisc' ? 150 : 120, at, id === 'pendantDisc' ? 1.0 : 0.72, i === 1);
    k.halo(x, y - 0.5, tz, 5.5, at);
  });

  // Sala en primer plano: sofá de espaldas y mesa auxiliar con una Trend.
  k.box(7, 0.95, 2.7, fabric, 7.4, 0.6, 5.2);
  k.box(7, 1.5, 0.7, fabric, 7.4, 1.4, 6.3);
  for (const s of [-1, 1]) k.box(0.7, 1.35, 2.7, fabric, 7.4 + s * 3.5, 0.95, 5.2);
  k.cyl(0.75, 1.5, dark, 2.6, 0.75, 5.4);
  k.lamp('trend', { pos: [2.6, 1.5, 5.4], scale: 1.05, at: 0.7 });
  k.light(new THREE.PointLight(WARM, 0, 8, 2), 12, 0.7).position.set(2.6, 2.3, 5.4);
  k.halo(2.6, 2.6, 5.4, 4.4, 0.7);

  // Aplique en el muro derecho y downlights sobre la sala.
  k.emitter(new THREE.BoxGeometry(0.2, 0.34, 0.34), 11.95, 4.8, 1.2, 2.2, 0.1);
  k.decal('updown', 2.2, 5.6, 11.97, 4.8, 1.2, 0.8, 0.1, -Math.PI / 2);
  for (const x of [5.6, 9.2]) k.emitter(new THREE.CircleGeometry(0.24, 24), x, 8.99, 4.4, 2.4, 0.34).rotation.x = Math.PI / 2;
  k.spot([7.4, 8.9, 4.4], [7.4, 0, 4.9], 170, 0.34, 0.7);

  // Luz rebotada: lo que hace que techo y muros se lean cuando todo está encendido.
  k.light(new THREE.HemisphereLight('#ffdcb4', '#6e4c2e', 0), 0.36, 0.3);
  k.light(new THREE.PointLight(SOFT, 0, 0, 2), 55, 0.4).position.set(tx, 5.6, tz + 2.5);
  // La noche entra fría por el ventanal.
  k.add(new THREE.HemisphereLight('#7f93c4', '#2a1d12', 0.1));
  k.grid(-12, 12, -8, 8, 2);

  return {
    group: k.group,
    apply: k.apply,
    wide: { pos: [1.4, 3.6, 19.5], target: [-0.4, 4.1, 0], fov: 37 },
    narrow: { pos: [-1.6, 4.2, 31], target: [-1.6, 0.6, 0], fov: 40 },
  };
}

/* ───────────────────────── Fachada de noche ───────────────────────── */

function fachada(): Built {
  const k = new Kit();
  const plaster = std('#d4c8b6', 0.95);
  const slab = std('#3a3632', 0.8);
  const stone = std('#5a534c', 0.75);
  const dark = std('#171513', 0.6);
  const wood = std('#7c5a3d', 0.7);
  const fabric = std('#6a5f53', 1);
  const leaf = std('#566845', 1);
  const glassDark = std('#0a0d13', 0.1, { metalness: 0.7 });
  const glassClear = new THREE.MeshStandardMaterial({
    color: '#1a1410',
    roughness: 0.05,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
  });

  // Terreno, plataforma y tres escalones con tira LED bajo cada huella.
  k.box(80, 0.2, 60, stone, 0, -1.15, 6, false);
  k.box(30, 1.05, 15, stone, 0, -0.525, -1.5, false);
  for (let i = 0; i < 2; i++) {
    k.box(30, 0.35, 1.6, stone, 0, -0.525 - 0.35 * i, 6.8 + 1.6 * i, false);
  }
  for (let i = 0; i < 3; i++) {
    const y = -0.06 - 0.35 * i;
    const z = 6.02 + 1.6 * i;
    k.emitter(new THREE.BoxGeometry(29.4, 0.05, 0.05), 0, y, z, 2.4, 0.5);
    k.decal('wash', 29.4, 0.9, 0, y - 0.45, z + 0.012, 0.42, 0.5);
  }

  // Volumen derecho: acceso de doble altura acristalado.
  k.box(11, 8.6, 0.4, plaster, 6.5, 4.3, -0.5);
  k.box(11, 8.6, 8, plaster, 6.5, 4.3, -5.1, false);
  k.box(12.6, 0.36, 10.5, slab, 6.6, 8.78, -3.6);
  // Hueco del acceso: interior cálido visto tras el vidrio.
  k.box(6.6, 7.7, 0.5, dark, 7.4, 3.85, -0.42);
  k.emitter(new THREE.PlaneGeometry(6.3, 7.5), 7.4, 3.85, -0.14, 1.5, 0.2, '#ffffff', entranceTexture());
  k.box(6.3, 7.5, 0.06, glassClear, 7.4, 3.85, -0.05, false);
  for (const x of [4.2, 7.4, 10.6]) k.box(0.16, 7.7, 0.22, dark, x, 3.85, 0);
  for (const y of [3.3, 5.5, 7.62]) k.box(6.6, 0.16, 0.22, dark, 7.4, y, 0);
  k.box(0.12, 3.3, 0.24, dark, 9, 1.65, 0.02);
  // Lámpara de araña: racimo de puntos de luz.
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2;
    k.emitter(
      new THREE.SphereGeometry(0.09, 10, 8),
      7.4 + Math.cos(a) * 1.1,
      6.3 + Math.sin(a * 2) * 0.28,
      0.06 + Math.sin(a) * 0.04,
      3,
      0.24,
      '#ffe2b8',
    );
  }
  k.halo(7.4, 6.3, 0.2, 4.6, 0.24);
  k.light(new THREE.PointLight('#ff9d4a', 0, 16, 2), 60, 0.2).position.set(7.4, 2.4, 1.6);

  // Aplique bidireccional en el machón y bañador desde el alero.
  k.emitter(new THREE.BoxGeometry(0.3, 0.3, 0.22), 2.4, 3.4, -0.2, 2.4, 0.08);
  k.decal('updown', 2.4, 7, 2.4, 3.4, -0.28, 0.85, 0.08);

  // Volumen izquierdo: terraza cubierta abajo, planta alta en voladizo.
  k.box(14, 4.2, 0.3, plaster, -6, 2.1, -4.6, false);
  k.box(0.4, 4.2, 4.6, plaster, -12.8, 2.1, -2.4);
  k.box(14.4, 0.3, 6, slab, -6, 4.35, -2);
  k.box(14.6, 3.7, 7.5, plaster, -5.9, 6.35, -3.2);
  k.box(15.8, 0.34, 9, slab, -5.9, 8.36, -3);
  k.box(8.5, 1.9, 0.12, glassDark, -6.2, 6.5, 0.58, false);
  for (const x of [-10.45, -7.6, -4.8, -1.95]) k.box(0.14, 1.9, 0.2, dark, x, 6.5, 0.6);
  // Downlights en el sofito de la terraza y dos colgantes.
  for (const x of [-10.2, -7.4, -4.6, -1.8]) {
    k.emitter(new THREE.CircleGeometry(0.2, 20), x, 4.19, -1.2, 2.6, 0.34).rotation.x = Math.PI / 2;
    k.decal('down', 2.6, 4, x, 2.2, -4.42, 0.5, 0.34);
  }
  k.spot([-6, 4.1, -1.4], [-6, 0, -2.2], 140, 0.34, 1.05, true);
  k.lamp('pendantDome', { pos: [-9.6, 2.7 - 1.18 * 1.2, -2.6], scale: 1.2, at: 0.42, hangFrom: 4.2 });
  k.lamp('pendantDome', { pos: [-8.5, 2.2 - 1.18 * 1.2, -2.2], scale: 1.2, at: 0.46, hangFrom: 4.2 });
  k.light(new THREE.PointLight(WARM, 0, 9, 2), 22, 0.42).position.set(-9, 2.1, -2.2);
  // Sala exterior.
  k.box(5.6, 0.75, 2, fabric, -8.6, 0.5, -3.2);
  k.box(5.6, 1.2, 0.5, fabric, -8.6, 1.0, -4.1);
  k.box(2, 0.75, 3.4, fabric, -3.9, 0.5, -2.5);
  k.box(2.6, 0.4, 1.5, wood, -8.4, 0.3, -0.8);
  k.lamp('earthtone', { pos: [-8.4, 0.5, -0.8], scale: 0.8, at: 0.6 });
  k.light(new THREE.PointLight(WARM, 0, 6, 2), 8, 0.6).position.set(-8.4, 1.4, -0.4);

  // Matera con planta iluminada desde abajo.
  k.cyl(0.85, 1.3, dark, 2.4, 0.65, 2.2);
  for (const [dx, dy, r] of [
    [0, 1.9, 0.75],
    [-0.45, 1.5, 0.55],
    [0.5, 1.6, 0.5],
    [0.1, 2.5, 0.45],
  ]) {
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), leaf);
    s.position.set(2.4 + dx, dy, 2.2);
    s.castShadow = true;
    k.add(s);
  }
  k.spot([3.6, 0.15, 3.9], [2.2, 2.2, 1.8], 130, 0.66, 0.6);

  // Bañadores desde el alero sobre la planta alta, y una ventana con luz tenue.
  for (const x of [-11.6, -0.4]) {
    k.emitter(new THREE.CircleGeometry(0.18, 20), x, 8.18, 0.9, 2.4, 0.74).rotation.x = Math.PI / 2;
    k.decal('down', 2.6, 3.7, x, 6.3, 0.57, 0.6, 0.74);
  }
  k.emitter(new THREE.PlaneGeometry(8.3, 1.75), -6.2, 6.5, 0.645, 0.06, 0.8, '#ffb878');

  // Luna.
  k.add(new THREE.HemisphereLight('#93a6d8', '#1c1510', 0.26));
  k.grid(-15, 15, -0.6, 6, 1.6, 0.012);

  return {
    group: k.group,
    apply: k.apply,
    sky: '#090c14',
    wide: { pos: [-3.5, 2.2, 27], target: [-1, 3.7, 0], fov: 36 },
    narrow: { pos: [3, 2.6, 30], target: [3.5, 3.2, 0], fov: 40 },
  };
}

/* ───────────────────────── Escenario ───────────────────────── */

export interface ArchOptions {
  scene: ArchId;
  /** Fracción de pantalla dibujada como plano, desde la izquierda. */
  split?: number;
  power?: number;
  /** Fuerza el encuadre ancho o estrecho; por defecto según la proporción. */
  view?: 'wide' | 'narrow';
  /** La cámara acompaña al cursor. */
  parallax?: boolean;
  still?: boolean;
}

export class ArchStage {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(38, 1, 0.1, 140);
  private built: Built;
  private envTex: THREE.Texture;
  private litBg = new THREE.Color(NIGHT);
  private planBg = new THREE.Color(PLAN_BG);
  private ro: ResizeObserver;
  private io: IntersectionObserver;
  private raf = 0;
  private last = 0;
  private visible = true;
  private disposed = false;
  private reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /** Teléfonos y tabletas: sin cursor no hay paralaje, y se dibuja solo cuando algo cambia. */
  private touch = window.matchMedia('(hover: none)').matches;
  private size = { w: 1, h: 1 };
  private split: number;
  private splitTarget: number;
  private power: number;
  private powerTarget: number;
  private pointer = { x: 0, y: 0 };
  private look = { x: 0, y: 0 };
  private clock = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private opts: ArchOptions,
  ) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.still ? 2 : this.touch ? 1.5 : 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    this.built = opts.scene === 'fachada' ? fachada() : interior();
    this.scene.add(this.built.group);
    if (this.built.sky) this.litBg.set(this.built.sky);
    this.preparePlan();

    this.split = this.splitTarget = opts.split ?? 0;
    this.power = this.powerTarget = opts.power ?? 0;

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    this.io = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting;
      if (this.visible) this.start();
    });
    this.io.observe(canvas);
    if (opts.parallax && !this.touch) window.addEventListener('pointermove', this.onPointer, { passive: true });
    document.addEventListener('visibilitychange', this.onVisibility);
    this.resize();
    if (opts.still) {
      this.renderStill();
      return;
    }
    // Precalienta los dos pases (compila shaders y sombras) ahora, con la pantalla de carga aún puesta,
    // para que la primera vez que entra la luz no haya tirón.
    const split = this.split;
    this.split = 0.5;
    this.draw();
    this.split = split;
    this.start();
  }

  /** Crea la versión "plano" de cada pieza: relleno oscuro que tapa y aristas claras. */
  private preparePlan() {
    const fill = new THREE.MeshBasicMaterial({
      color: '#15110d',
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });
    const fillLamp = new THREE.MeshBasicMaterial({
      color: '#3b332b',
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });
    const line = new THREE.LineBasicMaterial({ color: '#efe6d5', transparent: true, opacity: 0.78 });
    const meshes: THREE.Mesh[] = [];
    this.built.group.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || m.userData.noPlan || (m as unknown as THREE.InstancedMesh).isInstancedMesh) return;
      const mat = m.material as THREE.MeshStandardMaterial;
      // Reflejos de estudio solo en las luminarias (los materiales de obra no los llevan).
      if (mat && 'envMapIntensity' in mat && this.isLampPart(m) && !mat.envMap && mat.envMapIntensity > 0)
        mat.envMap = this.envTex;
      if (mat && (mat.blending === THREE.AdditiveBlending || (mat.transparent && mat.opacity < 0.2 && !this.isLampPart(m))))
        return;
      meshes.push(m);
    });
    for (const m of meshes) {
      const lampPart = this.isLampPart(m);
      const occ = new THREE.Mesh(m.geometry, lampPart ? fillLamp : fill);
      occ.layers.set(PLAN);
      m.add(occ);
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 28), line);
      edges.layers.set(PLAN);
      m.add(edges);
    }
  }

  private isLampPart(o: THREE.Object3D) {
    // Las piezas de obra cuelgan directamente del grupo de la escena.
    return o.parent !== this.built.group;
  }

  /* ── Controles ── */

  setSplit(v: number, instant = false) {
    this.splitTarget = clamp01(v);
    if (instant) this.split = this.splitTarget;
    this.start();
  }
  setPower(on: boolean, instant = false) {
    this.powerTarget = on ? 1 : 0;
    if (instant) this.power = this.powerTarget;
    this.start();
  }

  private onPointer = (e: PointerEvent) => {
    this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  };
  private onVisibility = () => {
    if (!document.hidden) this.start();
  };

  /* ── Ciclo ── */

  private resize() {
    const w = Math.max(1, this.canvas.clientWidth);
    const h = Math.max(1, this.canvas.clientHeight);
    this.size = { w, h };
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    if (this.opts.still) this.renderStill();
    else this.start();
  }

  private start() {
    if (this.raf || this.disposed || this.opts.still) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  private frame = (now: number) => {
    this.raf = 0;
    if (this.disposed) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const k = (rate: number) => (this.reduced ? 1 : 1 - Math.exp(-dt * rate));
    this.clock += dt;
    this.split += (this.splitTarget - this.split) * k(14);
    // El encendido avanza a ritmo constante para que las luces entren una tras otra.
    const step = this.reduced ? 1 : dt / 2.6;
    this.power += Math.max(-step * 2, Math.min(step, this.powerTarget - this.power));
    this.look.x += (this.pointer.x - this.look.x) * k(2.5);
    this.look.y += (this.pointer.y - this.look.y) * k(2.5);
    this.draw();
    const drifting = !this.reduced && !this.touch && !!this.opts.parallax;
    const settled = Math.abs(this.splitTarget - this.split) < 0.0005 && Math.abs(this.powerTarget - this.power) < 0.0005;
    if (!this.raf && this.visible && !document.hidden && (drifting || !settled)) this.raf = requestAnimationFrame(this.frame);
  };

  private draw() {
    const { w, h } = this.size;
    const narrow = this.opts.view ? this.opts.view === 'narrow' : w / h < 0.9;
    const v = narrow ? this.built.narrow : this.built.wide;
    // Respiración lenta más el cursor: suficiente para sentir profundidad.
    const sway = this.opts.parallax && !this.reduced && !this.touch ? Math.sin(this.clock * 0.22) * 0.35 : 0;
    this.camera.fov = v.fov;
    this.camera.position.set(v.pos[0] + this.look.x * 1.1 + sway, v.pos[1] - this.look.y * 0.45, v.pos[2]);
    this.camera.lookAt(v.target[0], v.target[1], v.target[2]);
    this.camera.updateProjectionMatrix();
    this.built.apply(this.power);

    const r = this.renderer;
    const cut = Math.round(this.split * w);
    r.setScissorTest(true);
    if (cut > 0) {
      this.camera.layers.set(PLAN);
      this.scene.background = this.planBg;
      r.setScissor(0, 0, cut, h);
      r.render(this.scene, this.camera);
    }
    if (cut < w) {
      this.camera.layers.set(LIT);
      this.scene.background = this.litBg;
      r.setScissor(cut, 0, w - cut, h);
      r.render(this.scene, this.camera);
    }
    r.setScissorTest(false);
  }

  renderStill() {
    this.split = this.splitTarget;
    this.power = this.powerTarget;
    this.draw();
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.io.disconnect();
    window.removeEventListener('pointermove', this.onPointer);
    document.removeEventListener('visibilitychange', this.onVisibility);
    disposeTree(this.scene);
    this.envTex.dispose();
    this.renderer.dispose();
  }
}
