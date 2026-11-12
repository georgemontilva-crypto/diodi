import * as THREE from 'three';

/** Color de la noche: fondo de todas las escenas y de las secciones oscuras del sitio. */
export const NIGHT = '#0d0a07';
/** Color del suelo y la pared del estudio cuando reciben luz. */
export const STUDIO = '#6a5a4b';

const texCache = new Map<string, THREE.Texture>();

/** Degradado radial para halos de luz (sprites aditivos). */
export function glowTexture(): THREE.Texture {
  const hit = texCache.get('glow');
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.18, 'rgba(255,255,255,0.55)');
  grad.addColorStop(0.45, 'rgba(255,255,255,0.14)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  texCache.set('glow', t);
  return t;
}

/** Relieve martillado para el interior dorado de los colgantes. */
export function hammeredTexture(): THREE.Texture {
  const hit = texCache.get('hammer');
  if (hit) return hit;
  const S = 512;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d')!;
  g.fillStyle = '#808080';
  g.fillRect(0, 0, S, S);
  const cols = 16;
  const step = S / cols;
  const rowH = step * 0.866;
  const rows = Math.round(S / rowH);
  for (let r = -1; r <= rows; r++) {
    for (let q = -1; q <= cols; q++) {
      const x = q * step + (r % 2 ? step / 2 : 0);
      const y = r * (S / rows);
      const grad = g.createRadialGradient(x, y, 0, x, y, step * 0.56);
      grad.addColorStop(0, 'rgba(20,20,20,0.95)');
      grad.addColorStop(0.7, 'rgba(110,110,110,0.5)');
      grad.addColorStop(1, 'rgba(235,235,235,0)');
      g.fillStyle = grad;
      g.beginPath();
      g.arc(x, y, step * 0.56, 0, Math.PI * 2);
      g.fill();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  texCache.set('hammer', t);
  return t;
}

/** Degradado longitudinal para el cono de luz visible del spot. */
export function beamTexture(): THREE.Texture {
  const hit = texCache.get('beam');
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, 'rgba(255,255,255,0.9)');
  grad.addColorStop(0.25, 'rgba(255,255,255,0.3)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  texCache.set('beam', t);
  return t;
}

/** Nombre del producto para la pared: blanco sobre transparente, ajustado al ancho. */
export function ghostTexture(text: string): THREE.CanvasTexture {
  const W = 2048;
  const H = 400;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const draw = () => {
    const g = c.getContext('2d')!;
    g.clearRect(0, 0, W, H);
    const family = '"Montserrat Variable", Montserrat, "Helvetica Neue", Arial, sans-serif';
    let size = 300;
    g.font = `800 ${size}px ${family}`;
    const width = g.measureText(text).width;
    size = Math.min(300, (size * W * 0.96) / width);
    g.font = `800 ${size}px ${family}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#fff';
    g.fillText(text, W / 2, H / 2 + size * 0.04);
    tex.needsUpdate = true;
  };
  draw();
  // La fuente de marca puede llegar después del primer dibujo.
  document.fonts
    ?.load('800 200px "Montserrat Variable"')
    .then(draw)
    .catch(() => {});
  return tex;
}

export function makeGlow(scaleX: number, scaleY = scaleX): THREE.Sprite {
  const mat = new THREE.SpriteMaterial({
    map: glowTexture(),
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    opacity: 0,
    fog: false,
  });
  const s = new THREE.Sprite(mat);
  s.scale.set(scaleX, scaleY, 1);
  s.renderOrder = 10;
  return s;
}

export interface FinishLook {
  color: string;
  roughness: number;
  metalness: number;
  /** Cuánto refleja el estudio: el negro necesita más para leerse a oscuras. */
  env: number;
}

export const FINISHES: Record<string, FinishLook> = {
  negro: { color: '#121110', roughness: 0.54, metalness: 0.3, env: 0.95 },
  blanco: { color: '#e9e5dd', roughness: 0.62, metalness: 0.04, env: 0.3 },
  tierra: { color: '#57402f', roughness: 0.72, metalness: 0.1, env: 0.34 },
};

export function bodyMaterial(finish = 'negro', extra: THREE.MeshStandardMaterialParameters = {}) {
  const f = FINISHES[finish] ?? FINISHES.negro;
  return new THREE.MeshStandardMaterial({
    color: f.color,
    roughness: f.roughness,
    metalness: f.metalness,
    envMapIntensity: f.env,
    dithering: true,
    ...extra,
  });
}

export function applyFinish(mat: THREE.MeshStandardMaterial, finish: string) {
  const f = FINISHES[finish] ?? FINISHES.negro;
  mat.color.set(f.color);
  mat.roughness = f.roughness;
  mat.metalness = f.metalness;
  mat.envMapIntensity = f.env;
}

/** Material que emite luz; `apply` ajusta su intensidad con el encendido. */
export function lightMaterial(base = '#2a2420') {
  return new THREE.MeshStandardMaterial({
    color: base,
    emissive: '#ffffff',
    emissiveIntensity: 0,
    roughness: 0.5,
    metalness: 0,
    envMapIntensity: 0.15,
  });
}

/** Cilindro con estrías verticales (pantallas acanaladas y plisadas). */
export function flutedCylinder(rTop: number, rBottom: number, h: number, ribs: number, depth: number, open = true) {
  const geo = new THREE.CylinderGeometry(rTop, rBottom, h, ribs * 2, 1, open);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const seg = (Math.PI * 2) / (ribs * 2);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const r = Math.hypot(x, z);
    if (r < 1e-5) continue;
    const idx = Math.round((Math.atan2(z, x) + Math.PI * 2) / seg);
    if (idx % 2 === 1) {
      const k = (r - depth) / r;
      pos.setX(i, x * k);
      pos.setZ(i, z * k);
    }
  }
  geo.computeVertexNormals();
  return geo;
}

export function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, shadow = true) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = shadow;
  m.receiveShadow = false;
  return m;
}

export function disposeTree(root: THREE.Object3D) {
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
    const mat = (m as unknown as { material?: THREE.Material | THREE.Material[] }).material;
    if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
    else if (mat) mat.dispose();
  });
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
