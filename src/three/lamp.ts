// Contrato común de todas las luminarias 3D y ayudantes mínimos de construcción.

import * as THREE from 'three';

export interface LampState {
  /** 0 apagada · 1 encendida. */
  power: number;
  color: THREE.Color;
  /** 0–1: inclinación del cabezal. */
  tilt: number;
  /** 0–1: giro del cabezal sobre su eje de montaje. */
  pan: number;
  /** 0–1: despiece. */
  explode: number;
}

export interface LampView {
  target: THREE.Vector3;
  radius: number;
  polar: number;
  minPolar: number;
  maxPolar: number;
}

/**
 * Dónde vive la pieza:
 * - table: apoyada o colgada frente a un fondo de estudio
 * - room: montada en el techo de una sala (riel, superficie, empotrado orientable)
 * - wall: montada en una pared, que recibe sus haces
 * - studio: flotando, para ver el cuerpo completo (empotrados)
 */
export type EnvId = 'table' | 'room' | 'studio' | 'wall';

export interface Lamp {
  /** Gira sobre la tornamesa (o queda fija si `orbit` está definido). */
  root: THREE.Group;
  /** Objetos de la escena que no giran. */
  props?: THREE.Group;
  env: EnvId;
  /** Giro inicial. */
  azimuth: number;
  /** Si está, la pieza no gira: es la cámara la que orbita entre estos límites (rad). */
  orbit?: { min: number; max: number };
  /** room: pone una pieza en pedestal bajo la luminaria para tener a qué apuntar. */
  subject?: boolean;
  /** table: radio de la sombra de contacto en el suelo. */
  footprint?: number;
  /** Punto al que se acerca la cámara al hacer zoom. */
  focus: THREE.Vector3;
  /** Nombre fantasma en la pared: altura y ancho. */
  ghost: { y: number; width: number; x?: number };
  /** Resplandor en la pared detrás de la pieza. */
  halo: { y: number; intensity: number };
  view(state: LampState): LampView;
  apply(state: LampState): void;
  setFinish(id: string): void;
  /** Piezas rotuladas (despiece). */
  anchors?: { id: string; label: string; object: THREE.Object3D; side: 1 | -1 }[];
}

/** Altura del techo en el entorno `room`. */
export const CEILING = 1.9;

export const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export function at<T extends THREE.Object3D>(o: T, x: number, y: number, z: number): T {
  o.position.set(x, y, z);
  return o;
}

/** Foco real con su objetivo; `aim` es la dirección local hacia la que alumbra. */
export function spot(angle: number, penumbra = 0.6, shadow = false, aim: [number, number, number] = [0, -1, 0]) {
  const light = new THREE.SpotLight('#ffffff', 0, 0, angle, penumbra, 2);
  // three coloca los focos en (0,1,0) por defecto; aquí nacen en el origen del grupo.
  light.position.set(0, 0, 0);
  if (shadow) {
    light.castShadow = true;
    light.shadow.mapSize.set(1024, 1024);
    light.shadow.bias = -0.0008;
    light.shadow.radius = 5;
    light.shadow.camera.near = 0.08;
    light.shadow.camera.far = 8;
  }
  const target = new THREE.Object3D();
  target.position.set(...aim);
  light.target = target;
  const group = new THREE.Group();
  group.add(light, target);
  return { group, light, target };
}
