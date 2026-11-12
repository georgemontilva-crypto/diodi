// Escenario 3D: un estudio a oscuras donde la única luz es la de la luminaria.
// La pieza gira sobre una tornamesa; la cámara solo sube, baja y se acerca.

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { ModelId } from '../data/catalog';
import { NIGHT, STUDIO, clamp01, disposeTree, ghostTexture, lerp } from './kit';
import { buildLamp, type Lamp, type LampState } from './models';

export interface StageOptions {
  model: ModelId;
  /** Texto en la pared. `null` lo oculta. */
  ghost?: string | null;
  ghostWidth?: number;
  ghostY?: number;
  finish?: string;
  /** Color de la luz (hex). */
  tone?: string;
  power?: number;
  tilt?: number;
  explode?: number;
  /** Permite girar arrastrando. */
  interactive?: boolean;
  /** Giro inicial de la tornamesa (rad). Por defecto, el del modelo. */
  azimuth?: number;
  /** Giro automático en rad/s mientras nadie toca. */
  autoRotate?: number;
  /** Multiplicador de distancia de cámara (<1 acerca). */
  distance?: number;
  /** Desplaza el encuadre: fracción del ancho y del alto. */
  shift?: [number, number];
  /** Sin animación: dibuja cuadros sueltos (renders de catálogo). */
  still?: boolean;
  onPower?: (power: number) => void;
  onFrame?: (stage: Stage) => void;
}

const WALL_Z: Record<Lamp['env'], number> = { table: -3.2, room: -2.3, studio: -3.4 };

export class Stage {
  readonly lamp: Lamp;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  private halo = new THREE.PointLight('#ffffff', 0, 0, 2);
  private ghostMat: THREE.MeshStandardMaterial | null = null;
  private envTex: THREE.Texture;
  private ro: ResizeObserver;
  private io: IntersectionObserver;
  private raf = 0;
  private last = 0;
  private visible = true;
  private disposed = false;
  private reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  private state: LampState = { power: 0, color: new THREE.Color('#ffb163'), tilt: 0, explode: 0 };
  private target = { power: 0, color: new THREE.Color('#ffb163'), tilt: 0, explode: 0, az: 0, polar: 0, zoom: 0 };
  private az = 0;
  private polar = 0;
  private polarOffset = 0;
  private zoom = 0;
  private size = { w: 1, h: 1 };
  private pointers = new Map<number, { x: number; y: number; type: string }>();
  private pinch = 0;
  private touched = 0;
  private lastPower = -1;
  private dirty = false;

  constructor(
    private canvas: HTMLCanvasElement,
    private opts: StageOptions,
  ) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    // En teléfonos (pantallas 3x) se limita la densidad: mismo aspecto, mucho menos trabajo por cuadro.
    const cap = opts.still ? 2 : window.matchMedia('(hover: none)').matches ? 1.6 : 2;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cap));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    this.scene.background = new THREE.Color(NIGHT);
    this.scene.fog = new THREE.Fog(NIGHT, 9, 24);
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    this.lamp = buildLamp(opts.model);
    if (opts.finish) this.lamp.setFinish(opts.finish);
    this.scene.add(this.lamp.root);
    if (this.lamp.props) this.scene.add(this.lamp.props);
    // Solo la luminaria refleja el estudio; suelo y pared dependen de su luz.
    for (const group of [this.lamp.root, this.lamp.props]) {
      group?.traverse((o) => {
        const mat = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
        if (mat && 'envMapIntensity' in mat && !mat.envMap && mat.envMapIntensity > 0) mat.envMap = this.envTex;
      });
    }
    this.buildRoom();

    if (opts.tone) {
      this.state.color.set(opts.tone);
      this.target.color.set(opts.tone);
    }
    this.state.power = this.target.power = opts.power ?? 0;
    this.state.tilt = this.target.tilt = opts.tilt ?? 0;
    this.state.explode = this.target.explode = opts.explode ?? 0;
    this.az = this.target.az = opts.azimuth ?? this.lamp.azimuth;

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    this.io = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting;
      if (this.visible) this.start();
    });
    this.io.observe(canvas);
    this.resize();

    if (opts.interactive) this.bind();
    document.addEventListener('visibilitychange', this.onVisibility);
    if (opts.still) this.renderStill();
    else this.start();
  }

  /* ── Escena ── */

  private buildRoom() {
    const z = WALL_Z[this.lamp.env];
    const surface = new THREE.MeshStandardMaterial({
      color: STUDIO,
      roughness: 0.94,
      metalness: 0,
      envMapIntensity: 0,
      dithering: true,
    });
    const floor = new THREE.Mesh(new THREE.CircleGeometry(16, 64), surface);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(44, 14), surface);
    wall.position.set(0, 7, z);
    this.scene.add(wall);

    const text = this.opts.ghost;
    if (text) {
      const width = this.opts.ghostWidth ?? this.lamp.ghost.width;
      this.ghostMat = new THREE.MeshStandardMaterial({
        map: ghostTexture(text),
        color: '#9c8263',
        transparent: true,
        depthWrite: false,
        roughness: 1,
        envMapIntensity: 0,
      });
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(width, (width * 400) / 2048), this.ghostMat);
      plane.position.set(0, this.opts.ghostY ?? this.lamp.ghost.y, z + 0.012);
      this.scene.add(plane);
    }

    this.halo.position.set(0, this.lamp.halo.y, z + 1.7);
    this.scene.add(this.halo);
    // Penumbra mínima para que la pieza se adivine apagada.
    this.scene.add(new THREE.HemisphereLight('#ffe9cf', '#1a120b', 0.045));
  }

  /* ── Controles públicos ── */

  setPower(on: boolean) {
    this.target.power = on ? 1 : 0;
    this.start();
  }
  setTone(hex: string) {
    this.target.color.set(hex);
    this.start();
  }
  setFinish(id: string) {
    this.lamp.setFinish(id);
    this.start();
  }
  setTilt(v: number) {
    this.target.tilt = clamp01(v);
    this.start();
  }
  setExplode(v: number, instant = false) {
    this.target.explode = clamp01(v);
    if (instant) this.state.explode = this.target.explode;
    this.start();
  }
  setAzimuth(v: number, instant = false) {
    this.target.az = v;
    if (instant) this.az = v;
    this.start();
  }
  zoomBy(delta: number) {
    this.target.zoom = clamp01(this.target.zoom + delta);
    this.start();
  }
  get zoomLevel() {
    return this.target.zoom;
  }
  get explode() {
    return this.state.explode;
  }

  /** Posición en pantalla (px CSS dentro del canvas) de un objeto de la escena. */
  project(object: THREE.Object3D, out = { x: 0, y: 0 }, offsetX = 0) {
    const v = new THREE.Vector3();
    object.getWorldPosition(v);
    v.x += offsetX;
    v.project(this.camera);
    out.x = (v.x * 0.5 + 0.5) * this.size.w;
    out.y = (-v.y * 0.5 + 0.5) * this.size.h;
    return out;
  }

  /* ── Interacción ── */

  private onVisibility = () => {
    if (!document.hidden) this.start();
  };

  private bind() {
    const c = this.canvas;
    c.addEventListener('pointerdown', this.onDown);
    c.addEventListener('pointermove', this.onMove);
    c.addEventListener('pointerup', this.onUp);
    c.addEventListener('pointercancel', this.onUp);
    c.addEventListener('keydown', this.onKey);
  }

  private onDown = (e: PointerEvent) => {
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, type: e.pointerType });
    this.canvas.setPointerCapture?.(e.pointerId);
    this.canvas.classList.add('is-dragging');
    this.pinch = 0;
    this.touched = performance.now();
    this.start();
  };

  private onMove = (e: PointerEvent) => {
    const p = this.pointers.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;
    this.touched = performance.now();
    if (this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (this.pinch) this.zoomBy((d - this.pinch) / 260);
      this.pinch = d;
      return;
    }
    this.target.az += dx * 0.0085;
    // En táctil, si el gesto empieza en vertical el navegador hace scroll y cancela el puntero;
    // si llega hasta aquí es nuestro y también puede subir o bajar la cámara.
    this.polarOffset -= dy * 0.004;
    this.start();
  };

  private onUp = (e: PointerEvent) => {
    this.pointers.delete(e.pointerId);
    this.pinch = 0;
    if (!this.pointers.size) this.canvas.classList.remove('is-dragging');
  };

  private onKey = (e: KeyboardEvent) => {
    const step: Record<string, () => void> = {
      ArrowLeft: () => (this.target.az -= 0.3),
      ArrowRight: () => (this.target.az += 0.3),
      ArrowUp: () => (this.polarOffset -= 0.08),
      ArrowDown: () => (this.polarOffset += 0.08),
      '+': () => this.zoomBy(0.2),
      '-': () => this.zoomBy(-0.2),
    };
    const fn = step[e.key];
    if (!fn) return;
    e.preventDefault();
    fn();
    this.touched = performance.now();
    this.start();
  };

  /* ── Ciclo ── */

  private resize() {
    const w = Math.max(1, this.canvas.clientWidth);
    const h = Math.max(1, this.canvas.clientHeight);
    this.size = { w, h };
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.applyShift();
    if (this.opts.still) this.renderStill();
    else this.start();
  }

  private applyShift() {
    const { w, h } = this.size;
    const [sx, sy] = this.opts.shift ?? [0, 0];
    if (sx || sy) this.camera.setViewOffset(w, h, -sx * w, -sy * h, w, h);
    else this.camera.clearViewOffset();
    this.camera.updateProjectionMatrix();
  }

  /** Desplaza el encuadre (fracción del ancho y del alto). Barato: se puede llamar en cada paso de scroll. */
  setShift(shift: [number, number]) {
    const [x, y] = this.opts.shift ?? [0, 0];
    if (Math.abs(x - shift[0]) < 0.0005 && Math.abs(y - shift[1]) < 0.0005) return;
    this.opts.shift = shift;
    this.applyShift();
    if (this.opts.still) this.renderStill();
    else {
      this.dirty = true;
      this.start();
    }
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
    const moving = this.step(dt, now);
    this.draw();
    if (!this.raf && this.visible && !document.hidden && moving) this.raf = requestAnimationFrame(this.frame);
  };

  /** Avanza las animaciones; devuelve si hace falta seguir dibujando. */
  private step(dt: number, now: number) {
    const s = this.state;
    const t = this.target;
    const k = (rate: number) => (this.reduced ? 1 : 1 - Math.exp(-dt * rate));
    const idle = !this.pointers.size && now - this.touched > 2600;
    const spin = !this.reduced && idle ? (this.opts.autoRotate ?? 0) : 0;
    if (spin) t.az += spin * dt;

    s.power += (t.power - s.power) * k(t.power > s.power ? 2.4 : 5);
    s.tilt += (t.tilt - s.tilt) * k(7);
    s.explode += (t.explode - s.explode) * k(6);
    s.color.lerp(t.color, k(5));
    this.az += (t.az - this.az) * k(9);
    this.zoom += (t.zoom - this.zoom) * k(6);
    this.polar += (this.polarOffset - this.polar) * k(9);

    const settled =
      Math.abs(t.power - s.power) < 0.002 &&
      Math.abs(t.tilt - s.tilt) < 0.001 &&
      Math.abs(t.explode - s.explode) < 0.001 &&
      Math.abs(t.az - this.az) < 0.0008 &&
      Math.abs(t.zoom - this.zoom) < 0.001 &&
      Math.abs(this.polarOffset - this.polar) < 0.0008 &&
      Math.abs(s.color.r - t.color.r) + Math.abs(s.color.g - t.color.g) + Math.abs(s.color.b - t.color.b) < 0.004;
    const dirty = this.dirty;
    this.dirty = false;
    return !settled || !!spin || !!this.pointers.size || dirty;
  }

  private draw() {
    const s = this.state;
    const lamp = this.lamp;
    const view = lamp.view(s);

    // Límite de inclinación de cámara.
    const want = view.polar + this.polarOffset;
    const clampPolar = Math.min(view.maxPolar, Math.max(view.minPolar, want));
    this.polarOffset += clampPolar - want;
    const polar = Math.min(view.maxPolar, Math.max(view.minPolar, view.polar + this.polar));

    lamp.root.rotation.y = this.az;
    lamp.apply(s);
    this.halo.color.copy(s.color);
    this.halo.intensity = lamp.halo.intensity * s.power;
    if (this.ghostMat) this.ghostMat.opacity = 0.3 + 0.28 * s.power;

    const aspect = this.size.w / this.size.h;
    const fit = Math.max(1, 0.6 / aspect);
    const radius = view.radius * (this.opts.distance ?? 1) * fit * lerp(1, 0.42, this.zoom);
    const tgt = view.target.clone().lerp(lamp.focus, this.zoom);
    // La cámara se mece un poco con el giro: da paralaje contra la pared aunque la pieza sea simétrica.
    const sway = 0.3 * Math.sin(this.az - lamp.azimuth);
    const flat = radius * Math.sin(polar);
    // Nunca por debajo del suelo.
    const height = Math.max(0.16, tgt.y + radius * Math.cos(polar));
    this.camera.position.set(tgt.x + flat * Math.sin(sway), height, tgt.z + flat * Math.cos(sway));
    this.camera.lookAt(tgt);
    this.camera.updateMatrixWorld();

    this.renderer.render(this.scene, this.camera);

    if (Math.abs(s.power - this.lastPower) > 0.004) {
      this.lastPower = s.power;
      this.opts.onPower?.(s.power);
    }
    this.opts.onFrame?.(this);
  }

  /** Dibuja un cuadro con todo en su valor final. */
  renderStill() {
    const s = this.state;
    const t = this.target;
    s.power = t.power;
    s.tilt = t.tilt;
    s.explode = t.explode;
    s.color.copy(t.color);
    this.az = t.az;
    this.zoom = t.zoom;
    this.draw();
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.io.disconnect();
    document.removeEventListener('visibilitychange', this.onVisibility);
    const c = this.canvas;
    c.removeEventListener('pointerdown', this.onDown);
    c.removeEventListener('pointermove', this.onMove);
    c.removeEventListener('pointerup', this.onUp);
    c.removeEventListener('pointercancel', this.onUp);
    c.removeEventListener('keydown', this.onKey);
    disposeTree(this.scene);
    this.ghostMat?.map?.dispose();
    this.envTex.dispose();
    this.renderer.dispose();
  }
}
