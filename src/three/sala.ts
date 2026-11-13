// Sala Iluminak: la sala de exhibición reconstruida para recorrerla en primera persona.
// Se mira arrastrando y se camina tocando el suelo (o con el teclado).

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { clamp01, contactTexture, disposeTree, grainTexture, lerp, mesh, rand, studioEnvironment } from './kit';
import { spot } from './lamp';
import { roundedBox } from './parts';

/** Medidas de la sala en metros. La pared de madera queda al fondo (z negativo). */
const W = 4.6;
const BACK = -3;
const FRONT = 3.6;
const H = 2.7;
const EYE = 1.52;
/** El sofá es un arco: centro, radio al eje del asiento y media apertura en radianes. */
const SOFA = { x: 0.1, z: 0.55, r: 2.6, half: 1.05 };
/** Línea del techo de la que cuelga el sistema. */
const LINE = -2.2;

export interface SalaView {
  id: string;
  label: string;
  at: [number, number];
  yaw: number;
  pitch: number;
}

export const VIEWS: SalaView[] = [
  { id: 'general', label: 'Entrada', at: [1.15, 3.05], yaw: 0.24, pitch: -0.07 },
  { id: 'sofa', label: 'Sofá', at: [1.25, 1.2], yaw: 0.5, pitch: -0.14 },
  { id: 'luz', label: 'Lámparas', at: [-2.75, 0.9], yaw: -0.12, pitch: 0.3 },
];

export interface SalaOptions {
  /** Empieza de día (luz natural) o de noche (solo las lámparas). */
  day?: boolean;
  /** Imagen fija: sin recorrido de entrada ni interacción. */
  still?: boolean;
  onMove?: () => void;
}

interface Emitter {
  light: THREE.SpotLight;
  power: number;
  glow: THREE.MeshBasicMaterial;
  shade: THREE.MeshStandardMaterial;
}

function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, color = true) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

/** Piso de madera clara en tablas largas. */
function floorTexture() {
  const r = rand(11);
  return canvasTexture(1024, 1024, (g) => {
    const cols = 6;
    const pw = 1024 / cols;
    for (let i = 0; i < cols; i++) {
      let y = -r() * 500;
      while (y < 1024) {
        const len = 420 + r() * 380;
        const v = 204 + r() * 22;
        g.fillStyle = `rgb(${v + 8},${v - 4},${v - 24})`;
        g.fillRect(i * pw, y, pw, len);
        g.fillStyle = 'rgba(96,74,50,0.22)';
        g.fillRect(i * pw, y, pw, 1.5);
        y += len;
      }
      g.fillStyle = 'rgba(96,74,50,0.24)';
      g.fillRect(i * pw, 0, 1.5, 1024);
    }
    // Veta: trazos largos y muy tenues en el sentido de la tabla.
    for (let i = 0; i < 1500; i++) {
      g.fillStyle = `rgba(${r() > 0.5 ? '255,250,240' : '120,96,70'},${0.03 + r() * 0.07})`;
      g.fillRect(r() * 1024, r() * 1024, 1 + r() * 1.5, 40 + r() * 220);
    }
  });
}

/** Panel de listones de roble: listón redondeado, ranura oscura. */
function slatTexture() {
  const r = rand(23);
  return canvasTexture(512, 512, (g) => {
    const n = 16;
    const w = 512 / n;
    for (let i = 0; i < n; i++) {
      const tint = 0.9 + r() * 0.2;
      const grad = g.createLinearGradient(i * w, 0, (i + 1) * w, 0);
      const c = (k: number) => `rgb(${Math.round(190 * tint * k)},${Math.round(140 * tint * k)},${Math.round(84 * tint * k)})`;
      grad.addColorStop(0, c(0.62));
      grad.addColorStop(0.22, c(1));
      grad.addColorStop(0.78, c(0.96));
      grad.addColorStop(1, c(0.6));
      g.fillStyle = grad;
      g.fillRect(i * w, 0, w, 512);
      g.fillStyle = '#3d2814';
      g.fillRect(i * w, 0, 2.5, 512);
    }
    for (let i = 0; i < 900; i++) {
      g.fillStyle = `rgba(${r() > 0.5 ? '255,226,180' : '92,58,26'},${0.04 + r() * 0.08})`;
      g.fillRect(r() * 512, r() * 512, 1, 30 + r() * 160);
    }
  });
}

/** Rizo del tapizado (relieve). */
function boucleTexture() {
  const r = rand(37);
  return canvasTexture(
    256,
    256,
    (g) => {
      g.fillStyle = '#808080';
      g.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 2600; i++) {
        const v = Math.round(70 + r() * 150);
        g.fillStyle = `rgb(${v},${v},${v})`;
        g.beginPath();
        g.arc(r() * 256, r() * 256, 1.2 + r() * 2.4, 0, Math.PI * 2);
        g.fill();
      }
    },
    false,
  );
}

/** Contorno cerrado de un rectángulo redondeado (radio, altura) para tornear. */
function roundRect(r0: number, y0: number, r1: number, y1: number, rad: number) {
  const pts: THREE.Vector2[] = [];
  const corners: [number, number, number][] = [
    [r1 - rad, y0 + rad, -Math.PI / 2],
    [r1 - rad, y1 - rad, 0],
    [r0 + rad, y1 - rad, Math.PI / 2],
    [r0 + rad, y0 + rad, Math.PI],
  ];
  for (const [cx, cy, a0] of corners) {
    for (let i = 0; i <= 6; i++) {
      const a = a0 + (i / 6) * (Math.PI / 2);
      pts.push(new THREE.Vector2(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad));
    }
  }
  pts.push(pts[0].clone());
  return pts;
}

/** Pieza redonda de canto suave (un puf): perfil para tornear alrededor de su eje. */
function pill(r: number, y0: number, y1: number, rad: number) {
  const pts: THREE.Vector2[] = [new THREE.Vector2(0.0001, y0)];
  for (let i = 0; i <= 8; i++) {
    const a = -Math.PI / 2 + (i / 8) * (Math.PI / 2);
    pts.push(new THREE.Vector2(r - rad + Math.cos(a) * rad, y0 + rad + Math.sin(a) * rad));
  }
  for (let i = 0; i <= 8; i++) {
    const a = (i / 8) * (Math.PI / 2);
    pts.push(new THREE.Vector2(r - rad + Math.cos(a) * rad, y1 - rad + Math.sin(a) * rad));
  }
  pts.push(new THREE.Vector2(0.0001, y1));
  return new THREE.LatheGeometry(pts, 48);
}

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

export class Sala {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(60, 1, 0.05, 40);
  private composer: EffectComposer;
  private env: THREE.Texture;
  private ro: ResizeObserver;
  private raf = 0;
  private last = 0;
  private disposed = false;

  private pos = new THREE.Vector2(1.6, 3.1);
  private goal: THREE.Vector2 | null = null;
  private yaw = 0.24;
  private pitch = -0.07;
  private yawT = 0.24;
  private pitchT = -0.07;
  private keys = new Set<string>();
  private drag: { id: number; x: number; y: number; sx: number; sy: number; t: number } | null = null;
  private blockers: { x: number; z: number; r: number }[] = [];
  private reticle: THREE.Mesh;
  private emitters: Emitter[] = [];
  private hemi: THREE.HemisphereLight;
  private sun: THREE.DirectionalLight;
  private tone = new THREE.Color('#ffc387');
  private toneT = new THREE.Color('#ffc387');
  private power = 1;
  private powerT = 1;
  private day: number;
  private dayT: number;
  private bg = new THREE.Color();
  private dirty = true;
  private cleanup: (() => void)[] = [];

  constructor(
    private canvas: HTMLCanvasElement,
    private opts: SalaOptions = {},
  ) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    const touch = window.matchMedia('(hover: none)').matches;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.still ? 2 : touch ? 1.5 : 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.env = studioEnvironment(this.renderer);
    this.day = this.dayT = opts.day ? 1 : 0;

    const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: touch && !opts.still ? 2 : 4 });
    this.composer = new EffectComposer(this.renderer, target);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), 0.22, 0.55, 1.25));
    this.composer.addPass(new OutputPass());

    this.hemi = new THREE.HemisphereLight('#fff3e2', '#e6dac6', 0);
    this.sun = new THREE.DirectionalLight('#fff6e8', 0);
    this.sun.position.set(-3.5, 4.5, 6);
    this.scene.add(this.hemi, this.sun);

    this.buildShell();
    this.buildFurniture();
    this.buildLighting(!touch || !!opts.still);

    this.reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.15, 0.19, 48),
      new THREE.MeshBasicMaterial({ color: '#fff2dc', transparent: true, opacity: 0, depthWrite: false }),
    );
    this.reticle.rotation.x = -Math.PI / 2;
    this.reticle.position.y = 0.012;
    this.scene.add(this.reticle);

    this.camera.rotation.order = 'YXZ';
    if (opts.still) this.pos.set(...VIEWS[0].at);
    else this.goal = new THREE.Vector2(...VIEWS[0].at);

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas.parentElement ?? canvas);
    this.resize();
    if (!opts.still) this.bind();
    this.wake();
  }

  /* ───────────── Arquitectura ───────────── */

  private buildShell() {
    const flat = (color: string, roughness = 0.94) =>
      new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, envMapIntensity: 0, dithering: true });
    const plane = (w: number, h: number, mat: THREE.Material) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      m.receiveShadow = true;
      this.scene.add(m);
      return m;
    };
    const depth = FRONT - BACK;
    const midZ = (FRONT + BACK) / 2;

    const wood = floorTexture();
    wood.repeat.set((W * 2) / 2.4, depth / 2.4);
    const floorMat = new THREE.MeshStandardMaterial({
      map: wood,
      roughness: 0.62,
      metalness: 0,
      envMap: this.env,
      envMapIntensity: 0.12,
    });
    const floor = plane(W * 2, depth, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, midZ);

    const ceiling = plane(W * 2, depth, flat('#ece8e0'));
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, H, midZ);

    // Fondo: panel de listones de roble a la izquierda y paneles lisos a la derecha.
    const split = -0.25;
    const slats = slatTexture();
    const oakW = split + W;
    slats.repeat.set(oakW / 0.74, 1);
    const bump = slatTexture();
    bump.repeat.copy(slats.repeat);
    const oak = plane(
      oakW,
      H,
      new THREE.MeshStandardMaterial({
        map: slats,
        bumpMap: bump,
        bumpScale: 1.4,
        roughness: 0.58,
        metalness: 0,
        envMapIntensity: 0,
      }),
    );
    oak.position.set(-W + oakW / 2, H / 2, BACK);
    const greige = flat('#c2b8a9', 0.9);
    const panels = plane(W - split, H, greige);
    panels.position.set((W + split) / 2, H / 2, BACK);
    const seam = flat('#6f675c');
    for (let x = split; x < W - 0.2; x += 0.92) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.008, H, 0.004), seam);
      s.position.set(x, H / 2, BACK + 0.003);
      this.scene.add(s);
    }

    const left = plane(depth, H, greige);
    left.rotation.y = Math.PI / 2;
    left.position.set(-W, H / 2, midZ);
    const right = plane(depth, H, flat('#e6e1d8'));
    right.rotation.y = -Math.PI / 2;
    right.position.set(W, H / 2, midZ);
    const front = plane(W * 2, H, flat('#e6e1d8'));
    front.rotation.y = Math.PI;
    front.position.set(0, H / 2, FRONT);

    // Zócalo: la sombra fina que separa pared y piso.
    const base = flat('#8a8073');
    for (const [w, x, z, ry] of [
      [W * 2, 0, BACK + 0.008, 0],
      [depth, -W + 0.008, midZ, Math.PI / 2],
      [depth, W - 0.008, midZ, Math.PI / 2],
      [W * 2, 0, FRONT - 0.008, 0],
    ] as const) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.07, 0.014), base);
      b.position.set(x, 0.035, z);
      b.rotation.y = ry;
      this.scene.add(b);
    }
  }

  /* ───────────── Mobiliario ───────────── */

  private shadow(x: number, z: number, size: number, opacity = 0.5) {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(size, size),
      new THREE.MeshBasicMaterial({ map: contactTexture(), transparent: true, opacity, depthWrite: false }),
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.006, z);
    m.renderOrder = 1;
    this.scene.add(m);
  }

  private buildFurniture() {
    const boucleBump = boucleTexture();
    const boucle = (repeat: number) => {
      const t = boucleBump.clone();
      t.needsUpdate = true;
      t.repeat.set(repeat, repeat * 0.4);
      return new THREE.MeshStandardMaterial({
        color: '#eee8dc',
        roughness: 0.96,
        metalness: 0,
        bumpMap: t,
        bumpScale: 1.3,
        envMapIntensity: 0,
      });
    };
    const blackWood = new THREE.MeshStandardMaterial({
      color: '#141210',
      roughness: 0.5,
      metalness: 0.1,
      envMap: this.env,
      envMapIntensity: 0.5,
    });
    const gold = new THREE.MeshStandardMaterial({
      color: '#b48d4c',
      roughness: 0.28,
      metalness: 1,
      envMap: this.env,
      envMapIntensity: 1.5,
    });

    // Sofá curvo: asiento y respaldo torneados sobre un arco, con los extremos redondeados.
    const sofa = new THREE.Group();
    sofa.position.set(SOFA.x, 0, SOFA.z);
    const fabric = boucle(26);
    fabric.side = THREE.DoubleSide;
    const start = Math.PI - SOFA.half;
    const seat = mesh(
      new THREE.LatheGeometry(roundRect(SOFA.r - 0.5, 0.1, SOFA.r + 0.5, 0.45, 0.13), 96, start, SOFA.half * 2),
      fabric,
    );
    const back = mesh(
      new THREE.LatheGeometry(roundRect(SOFA.r + 0.1, 0.28, SOFA.r + 0.54, 0.8, 0.18), 96, start, SOFA.half * 2),
      fabric,
    );
    seat.receiveShadow = back.receiveShadow = true;
    sofa.add(seat, back);
    const endMat = boucle(4);
    endMat.side = THREE.DoubleSide;
    for (const side of [-1, 1]) {
      const a = Math.PI + side * SOFA.half;
      const end = mesh(pill(0.5, 0.1, 0.45, 0.13), endMat);
      end.position.set(Math.sin(a) * SOFA.r, 0, Math.cos(a) * SOFA.r);
      const endBack = mesh(pill(0.22, 0.28, 0.8, 0.18), endMat);
      endBack.position.set(Math.sin(a) * (SOFA.r + 0.32), 0, Math.cos(a) * (SOFA.r + 0.32));
      sofa.add(end, endBack);
    }
    const pillow = boucle(3);
    for (const [off, lean] of [
      [-0.78, 0.2],
      [-0.6, -0.1],
      [0.32, 0.12],
      [0.5, -0.16],
    ]) {
      const a = Math.PI + off;
      const p = mesh(roundedBox(0.52, 0.46, 0.2, 0.1), pillow);
      p.position.set(Math.sin(a) * (SOFA.r - 0.02), 0.67, Math.cos(a) * (SOFA.r - 0.02));
      p.rotation.set(0.28, a + Math.PI + lean, 0, 'YXZ');
      sofa.add(p);
    }
    for (let i = 0; i < 5; i++) {
      const a = Math.PI + lerp(-SOFA.half * 0.9, SOFA.half * 0.9, i / 4);
      const foot = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 24), gold, false);
      foot.position.set(Math.sin(a) * SOFA.r, 0.05, Math.cos(a) * SOFA.r);
      sofa.add(foot);
    }
    this.scene.add(sofa);
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI + lerp(-SOFA.half, SOFA.half, i / 8);
      this.shadow(SOFA.x + Math.sin(a) * SOFA.r, SOFA.z + Math.cos(a) * SOFA.r, 1.9, 0.42);
    }

    // Butacas: asiento, respaldo envolvente y patas de madera negra.
    const armchair = (x: number, z: number, ry: number) => {
      const g = new THREE.Group();
      const mat = boucle(6);
      mat.side = THREE.DoubleSide;
      const cushion = mesh(roundedBox(0.72, 0.3, 0.7, 0.13), mat);
      cushion.position.set(0, 0.36, 0.06);
      const wrapBack = mesh(new THREE.LatheGeometry(roundRect(0.36, 0.3, 0.58, 0.8, 0.11), 56, Math.PI - 1.75, 3.5), mat);
      for (const side of [-1, 1]) {
        const tip = mesh(new THREE.SphereGeometry(1, 24, 16), mat);
        tip.scale.set(0.115, 0.25, 0.115);
        tip.position.set(Math.sin(Math.PI + side * 1.75) * 0.47, 0.55, Math.cos(Math.PI + side * 1.75) * 0.47);
        const leg = mesh(roundedBox(0.07, 0.62, 0.52, 0.02), blackWood);
        leg.position.set(side * 0.53, 0.31, -0.08);
        g.add(tip, leg);
      }
      g.add(cushion, wrapBack);
      g.position.set(x, 0, z);
      g.rotation.y = ry;
      this.scene.add(g);
      this.blockers.push({ x, z, r: 0.62 });
      this.shadow(x, z, 1.7, 0.5);
    };
    armchair(-0.7, 1.7, Math.PI * 0.93);
    armchair(3.15, 0.35, -Math.PI * 0.55);

    // Mesas de centro: tapa de vidrio negro con aro dorado sobre un cono de vidrio ahumado.
    const glassTop = new THREE.MeshPhysicalMaterial({
      color: '#0a0a0b',
      roughness: 0.06,
      metalness: 0.3,
      clearcoat: 1,
      envMap: this.env,
      envMapIntensity: 1.3,
    });
    const smoked = new THREE.MeshPhysicalMaterial({
      color: '#4a443d',
      roughness: 0.05,
      metalness: 0.1,
      transparent: true,
      opacity: 0.62,
      envMap: this.env,
      envMapIntensity: 1.6,
      side: THREE.DoubleSide,
    });
    const white = new THREE.MeshStandardMaterial({ color: '#efece6', roughness: 0.5, envMapIntensity: 0 });
    const table = (x: number, z: number, r: number, h: number) => {
      const g = new THREE.Group();
      const top = mesh(new THREE.CylinderGeometry(r, r, 0.022, 72), glassTop);
      top.position.y = h;
      const rim = mesh(new THREE.CylinderGeometry(r + 0.012, r - 0.02, 0.05, 72), gold);
      rim.position.y = h - 0.034;
      const neck = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.16, 32), gold);
      neck.position.y = h - 0.13;
      const cone = mesh(new THREE.CylinderGeometry(0.05, r * 0.52, h - 0.21, 56, 1, true), smoked, false);
      cone.position.y = (h - 0.21) / 2;
      const tray = mesh(roundedBox(r * 0.82, 0.026, r * 0.6, 0.01), white);
      tray.position.set(0.02, h + 0.024, 0.02);
      tray.rotation.y = 0.3;
      const piece = mesh(roundedBox(0.12, 0.16, 0.05, 0.012), blackWood);
      piece.position.set(-0.03, h + 0.118, 0);
      piece.rotation.y = 0.5;
      g.add(top, rim, neck, cone, tray, piece);
      g.position.set(x, 0, z);
      this.scene.add(g);
      this.blockers.push({ x, z, r });
      this.shadow(x, z, r * 2.6, 0.45);
    };
    table(0.45, -0.25, 0.56, 0.44);
    table(1.28, -0.72, 0.38, 0.58);
  }

  /* ───────────── Sistema Iluminak ───────────── */

  private buildLighting(shadows: boolean) {
    const black = new THREE.MeshStandardMaterial({
      color: '#131211',
      roughness: 0.46,
      metalness: 0.35,
      envMap: this.env,
      envMapIntensity: 1.4,
      bumpMap: grainTexture(),
      bumpScale: 0.5,
    });
    const strap = new THREE.MeshStandardMaterial({ color: '#cbbfa9', roughness: 0.85, envMapIntensity: 0 });
    const add = (o: THREE.Object3D) => {
      this.scene.add(o);
      return o;
    };
    const emitter = (
      holder: THREE.Group,
      angle: number,
      power: number,
      cast: boolean,
      glowGeo: THREE.BufferGeometry,
      glowY: number,
    ) => {
      const shade = new THREE.MeshStandardMaterial({
        color: '#f1ece2',
        roughness: 0.7,
        emissive: '#ffffff',
        emissiveIntensity: 0,
        side: THREE.BackSide,
        envMapIntensity: 0,
      });
      const glow = new THREE.MeshBasicMaterial({ color: '#000000' });
      const disc = new THREE.Mesh(glowGeo, glow);
      disc.position.y = glowY;
      const s = spot(angle, 0.9, cast);
      s.group.position.y = glowY - 0.01;
      holder.add(disc, s.group);
      this.emitters.push({ light: s.light, power, glow, shade });
      return shade;
    };
    const anchor = (x: number) => {
      const a = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.05, 24), black, false);
      a.position.set(x, H - 0.025, LINE);
      add(a);
      return new THREE.Vector3(x, H - 0.05, LINE);
    };
    const cord = (pts: THREE.Vector3[], radius = 0.011, mat: THREE.Material = strap) => {
      add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.35), 40, radius, 8), mat, false));
    };
    const swag = (a: THREE.Vector3, top: THREE.Vector3, b: THREE.Vector3) => {
      const sag = (p: THREE.Vector3, q: THREE.Vector3) =>
        p
          .clone()
          .lerp(q, 0.5)
          .add(new THREE.Vector3(0, -0.07, 0));
      cord([a, sag(a, top), top, sag(top, b), b]);
    };

    // Campana: media esfera negra con el interior blanco. Cuelga de su casquillo y se inclina.
    const dome = (x: number, y: number, tiltZ: number, tiltX: number, cast: boolean) => {
      const r = 0.19;
      const holder = new THREE.Group();
      holder.position.set(x, y, LINE);
      holder.rotation.set(tiltX, 0, tiltZ);
      const body = new THREE.Group();
      body.position.y = -(r + 0.04);
      const geo = new THREE.SphereGeometry(r, 56, 24, 0, Math.PI * 2, 0, Math.PI / 2);
      const shade = emitter(body, 1.02, 13, cast, new THREE.CircleGeometry(r * 0.86, 48).rotateX(Math.PI / 2), 0.035);
      const inner = new THREE.Mesh(geo, shade);
      inner.scale.setScalar(0.975);
      const cap = mesh(new THREE.CylinderGeometry(0.028, 0.034, 0.05, 24), black, false);
      cap.position.y = r + 0.018;
      const lip = mesh(new THREE.TorusGeometry(r - 0.002, 0.005, 10, 72).rotateX(Math.PI / 2), black, false);
      body.add(mesh(geo, black, false), inner, cap, lip);
      holder.add(body);
      add(holder);
      return new THREE.Vector3(x, y, LINE);
    };

    const a = [-4.2, -3.0, -1.95, -0.75, 1.75, 2.75, 3.75].map(anchor);
    swag(a[0], dome(-3.55, 2.08, 0.55, 0.25, false), a[1]);
    swag(a[1], dome(-2.5, 2.14, -0.34, 0.5, shadows), a[2]);
    swag(a[4], dome(2.2, 2.1, 0.3, 0.5, false), a[5]);
    swag(a[5], dome(3.25, 2.16, -0.58, 0.22, false), a[6]);
    // El cable baja por el rincón hasta su contrapeso en el suelo.
    cord([a[0], new THREE.Vector3(-4.36, 1.5, -2.5), new THREE.Vector3(-4.3, 0.12, -2.55)]);
    const weight = mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.12, 32), black, false);
    weight.position.set(-4.3, 0.06, -2.55);
    add(weight);

    // Plato: pantalla cónica plana, a nivel.
    {
      const holder = new THREE.Group();
      holder.position.set(-1.35, 2.26, LINE);
      const geo = new THREE.CylinderGeometry(0.03, 0.34, 0.13, 64, 1, true);
      const shade = emitter(holder, 1.08, 17, shadows, new THREE.SphereGeometry(0.045, 24, 16), -0.02);
      const inner = new THREE.Mesh(geo, shade);
      inner.scale.setScalar(0.985);
      holder.add(mesh(geo, black, false), inner);
      holder.children.forEach((c) => c instanceof THREE.Mesh && c.geometry === geo && (c.position.y = 0.035));
      add(holder);
      swag(a[2], new THREE.Vector3(-1.35, 2.36, LINE), a[3]);
    }

    // Barra lineal suspendida de dos tensores.
    {
      const x = 0.5;
      const y = 2.4;
      const len = 1.5;
      const bar = mesh(new THREE.CylinderGeometry(0.036, 0.036, len, 32).rotateZ(Math.PI / 2), black, false);
      bar.position.set(x, y, LINE);
      add(bar);
      const steelWire = new THREE.MeshStandardMaterial({ color: '#2a2826', roughness: 0.4, metalness: 0.8 });
      for (const side of [-1, 1]) {
        const wire = mesh(new THREE.CylinderGeometry(0.003, 0.003, H - y, 6), steelWire, false);
        wire.position.set(x + side * (len / 2 - 0.08), (H + y) / 2, LINE);
        add(wire);
      }
      const holder = new THREE.Group();
      holder.position.set(x, y - 0.034, LINE);
      emitter(holder, 1.12, 15, false, new THREE.BoxGeometry(len - 0.12, 0.006, 0.03), 0);
      add(holder);
      cord([a[3], new THREE.Vector3(-0.2, y + 0.16, LINE), new THREE.Vector3(x - len / 2, y, LINE)], 0.006, black);
      cord([new THREE.Vector3(x + len / 2, y, LINE), new THREE.Vector3(1.4, y + 0.16, LINE), a[4]], 0.006, black);
    }

    // Fuente de alimentación en el techo, al final de la línea.
    const driver = mesh(roundedBox(0.5, 0.07, 0.12, 0.03), black, false);
    driver.position.set(4.15, H - 0.035, LINE);
    add(driver);
  }

  /* ───────────── Recorrido ───────────── */

  private free(x: number, z: number) {
    const m = 0.42;
    if (x < -W + m || x > W - m || z < BACK + m || z > FRONT - m) return false;
    for (const b of this.blockers) if (Math.hypot(x - b.x, z - b.z) < b.r + 0.32) return false;
    const dx = x - SOFA.x;
    const dz = z - SOFA.z;
    const d = Math.hypot(dx, dz);
    if (d > SOFA.r - 0.85 && d < SOFA.r + 0.9 && Math.abs(wrap(Math.atan2(dx, dz) - Math.PI)) < SOFA.half + 0.3) return false;
    return true;
  }

  private tryMove(x: number, z: number) {
    if (this.free(x, z)) this.pos.set(x, z);
    else if (this.free(x, this.pos.y)) this.pos.x = x;
    else if (this.free(this.pos.x, z)) this.pos.y = z;
    else return false;
    return true;
  }

  /** Punto del suelo bajo el cursor, llevado al sitio libre más cercano hacia la cámara. */
  private pick(clientX: number, clientY: number) {
    const rect = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector3(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
      0.5,
    );
    const dir = ndc.unproject(this.camera).sub(this.camera.position).normalize();
    if (dir.y > -0.04) return null;
    const t = -this.camera.position.y / dir.y;
    if (t > 14) return null;
    const hit = new THREE.Vector2(this.camera.position.x + dir.x * t, this.camera.position.z + dir.z * t);
    for (let i = 0; i <= 24; i++) {
      const p = hit.clone().lerp(this.pos, i / 24);
      if (this.free(p.x, p.y)) return p.distanceTo(this.pos) > 0.25 ? p : null;
    }
    return null;
  }

  private bind() {
    const c = this.canvas;
    const on = <K extends keyof HTMLElementEventMap>(
      el: HTMLElement | Window,
      type: K | string,
      fn: (e: never) => void,
      o?: AddEventListenerOptions,
    ) => {
      el.addEventListener(type, fn as EventListener, o);
      this.cleanup.push(() => el.removeEventListener(type, fn as EventListener, o));
    };
    on(c, 'pointerdown', (e: PointerEvent) => {
      c.setPointerCapture(e.pointerId);
      this.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now() };
      c.focus({ preventScroll: true });
    });
    on(c, 'pointermove', (e: PointerEvent) => {
      const d = this.drag;
      if (d && d.id === e.pointerId) {
        this.yawT += (e.clientX - d.x) * 0.0042;
        this.pitchT = Math.min(0.55, Math.max(-0.6, this.pitchT + (e.clientY - d.y) * 0.0034));
        d.x = e.clientX;
        d.y = e.clientY;
        (this.reticle.material as THREE.MeshBasicMaterial).opacity = 0;
        this.wake();
      } else if (e.pointerType === 'mouse') {
        const p = this.pick(e.clientX, e.clientY);
        (this.reticle.material as THREE.MeshBasicMaterial).opacity = p ? 0.75 : 0;
        if (p) this.reticle.position.set(p.x, 0.012, p.y);
        c.style.cursor = p ? 'pointer' : 'grab';
        this.dirty = true;
        this.wake();
      }
    });
    const up = (e: PointerEvent) => {
      const d = this.drag;
      if (!d || d.id !== e.pointerId) return;
      this.drag = null;
      const still = Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 7 && performance.now() - d.t < 450;
      if (still && e.type === 'pointerup') {
        const p = this.pick(e.clientX, e.clientY);
        if (p) {
          this.goal = p;
          this.reticle.position.set(p.x, 0.012, p.y);
          (this.reticle.material as THREE.MeshBasicMaterial).opacity = 0.75;
          this.opts.onMove?.();
        }
      } else if (!still) this.opts.onMove?.();
      this.wake();
    };
    on(c, 'pointerup', up);
    on(c, 'pointercancel', up);
    on(c, 'pointerleave', () => {
      if (!this.goal) (this.reticle.material as THREE.MeshBasicMaterial).opacity = 0;
      this.dirty = true;
      this.wake();
    });
    const walk = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'];
    on(c, 'keydown', (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (!walk.includes(k)) return;
      e.preventDefault();
      this.keys.add(k);
      this.goal = null;
      this.opts.onMove?.();
      this.wake();
    });
    on(c, 'keyup', (e: KeyboardEvent) => this.keys.delete(e.key.toLowerCase()));
    on(c, 'blur', () => this.keys.clear());
  }

  /* ───────────── API ───────────── */

  setLights(onState: boolean) {
    this.powerT = onState ? 1 : 0;
    this.wake();
  }

  setDay(day: boolean) {
    this.dayT = day ? 1 : 0;
    this.wake();
  }

  setTone(hex: string) {
    this.toneT.set(hex);
    this.wake();
  }

  goTo(id: string) {
    const v = VIEWS.find((x) => x.id === id);
    if (!v) return;
    this.goal = new THREE.Vector2(...v.at);
    // Se gira por el camino corto.
    this.yawT = this.yaw + wrap(v.yaw - this.yaw);
    this.pitchT = v.pitch;
    this.wake();
  }

  /** Coloca la cámara sin animación (para imágenes fijas). */
  place(x: number, z: number, yaw: number, pitch: number) {
    this.pos.set(x, z);
    this.goal = null;
    this.yaw = this.yawT = yaw;
    this.pitch = this.pitchT = pitch;
    this.dirty = true;
    this.wake();
  }

  /** Dibuja el estado final y lo devuelve como imagen. */
  snapshot(quality = 0.9) {
    this.power = this.powerT;
    this.day = this.dayT;
    this.tone.copy(this.toneT);
    this.yaw = this.yawT;
    this.pitch = this.pitchT;
    if (this.goal) this.pos.copy(this.goal);
    this.goal = null;
    (this.reticle.material as THREE.MeshBasicMaterial).opacity = 0;
    this.draw();
    return this.canvas.toDataURL('image/webp', quality);
  }

  private wake() {
    if (this.raf || this.disposed) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  private resize() {
    const el = this.canvas.parentElement ?? this.canvas;
    const w = Math.max(1, el.clientWidth);
    const h = Math.max(1, el.clientHeight);
    this.renderer.setSize(w, h, false);
    this.composer.setPixelRatio(this.renderer.getPixelRatio());
    this.composer.setSize(w, h);
    this.camera.aspect = w / h;
    // En vertical se abre el ángulo para que la sala no se sienta estrecha.
    this.camera.fov = w / h < 0.8 ? 80 : w / h < 1.3 ? 68 : 58;
    this.camera.updateProjectionMatrix();
    this.dirty = true;
    this.wake();
  }

  private frame = (now: number) => {
    this.raf = 0;
    if (this.disposed) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    let moving = this.dirty;
    this.dirty = false;

    // Teclado: avanzar, retroceder, girar y desplazarse de lado.
    if (this.keys.size) {
      const has = (...k: string[]) => k.some((x) => this.keys.has(x));
      const fwd = (has('arrowup', 'w') ? 1 : 0) - (has('arrowdown', 's') ? 1 : 0);
      const side = (has('d') ? 1 : 0) - (has('a') ? 1 : 0);
      this.yawT += ((has('arrowleft') ? 1 : 0) - (has('arrowright') ? 1 : 0)) * 1.5 * dt;
      const sp = 1.9 * dt;
      const sin = Math.sin(this.yaw);
      const cos = Math.cos(this.yaw);
      if (fwd || side) this.tryMove(this.pos.x + (-sin * fwd + cos * side) * sp, this.pos.y + (-cos * fwd - sin * side) * sp);
      moving = true;
    }
    if (this.goal) {
      const d = this.goal.distanceTo(this.pos);
      const stepLen = Math.min(d, Math.min(2.5, Math.max(0.35, d * 2.4)) * dt);
      const dir = this.goal.clone().sub(this.pos).normalize();
      if (d < 0.02 || !this.tryMove(this.pos.x + dir.x * stepLen, this.pos.y + dir.y * stepLen)) {
        this.goal = null;
        (this.reticle.material as THREE.MeshBasicMaterial).opacity = 0;
      }
      moving = true;
    }
    const k = 1 - Math.exp(-dt * 9);
    const ease = (from: number, to: number, rate = k) => (Math.abs(to - from) < 0.0004 ? to : lerp(from, to, rate));
    const before = this.yaw + this.pitch + this.power + this.day + this.tone.r + this.tone.b;
    this.yaw = ease(this.yaw, this.yawT);
    this.pitch = ease(this.pitch, this.pitchT);
    const slow = 1 - Math.exp(-dt * 4);
    this.power = ease(this.power, this.powerT, slow);
    this.day = ease(this.day, this.dayT, slow);
    this.tone.lerp(this.toneT, slow);
    if (Math.abs(this.tone.r - this.toneT.r) + Math.abs(this.tone.b - this.toneT.b) < 0.002) this.tone.copy(this.toneT);
    if (before !== this.yaw + this.pitch + this.power + this.day + this.tone.r + this.tone.b) moving = true;

    this.draw();
    if (moving || this.drag) this.raf = requestAnimationFrame(this.frame);
  };

  private draw() {
    const day = clamp01(this.day);
    this.hemi.intensity = lerp(0.3, 1.5, day);
    this.sun.intensity = lerp(0, 0.85, day);
    this.renderer.toneMappingExposure = lerp(1.1, 1.05, day);
    this.scene.background = this.bg.set('#0d0a07').lerp(new THREE.Color('#e9e4da'), day);
    for (const e of this.emitters) {
      e.light.color.copy(this.tone);
      e.light.intensity = e.power * this.power * lerp(1, 0.8, day);
      e.glow.color.copy(this.tone).multiplyScalar(0.02 + 2.6 * this.power);
      e.shade.emissive.copy(this.tone);
      e.shade.emissiveIntensity = 0.75 * this.power;
    }
    this.camera.position.set(this.pos.x, EYE, this.pos.y);
    this.camera.rotation.set(this.pitch, this.yaw, 0);
    this.composer.render();
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.cleanup.forEach((fn) => fn());
    disposeTree(this.scene);
    this.env.dispose();
    this.composer.dispose();
    this.renderer.dispose();
  }
}
