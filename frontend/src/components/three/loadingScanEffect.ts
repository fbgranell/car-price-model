import * as THREE from 'three'

/**
 * Sparse animated grid shader for the "scanning" plane shown while a prediction request is in
 * flight (see RotatingCar in PredictCarScene). Distinct from dissolveEffect.ts's per-mesh
 * dissolve shader: this never touches the car's own materials, it's a single flat disc that
 * sweeps through the model, so it can start/stop on `loading` without disturbing the dissolve
 * state used for class-switch transitions.
 */

export const LOADING_SCAN_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const LOADING_SCAN_FRAGMENT_SHADER = `
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    vec2 centered = vUv - 0.5;
    float dist = length(centered) * 2.0;
    if (dist > 1.0) discard;

    // Cartesian grid of cells across the disc - the "matrix" of the scan.
    float cells = 14.0;
    vec2 gv = centered * cells;
    vec2 cellId = floor(gv);
    vec2 cellUv = fract(gv) - 0.5;

    // Faint lines at every cell boundary...
    float lineDist = min(abs(cellUv.x), abs(cellUv.y));
    float line = 1.0 - smoothstep(0.0, 0.05, lineDist);

    // ...but only a sparse, flickering subset of cells get a bright node, so it reads as a
    // scanning data grid rather than a solid disc.
    float rnd = hash(cellId);
    float flicker = step(0.83, fract(rnd * 5.17 + uTime * 0.55));
    float node = (1.0 - smoothstep(0.0, 0.22, length(cellUv))) * flicker;

    float edgeFade = smoothstep(1.0, 0.7, dist);
    float centerFade = smoothstep(0.0, 0.12, dist);

    vec3 color = mix(uColorA, uColorB, hash(cellId + 3.1));
    float intensity = (line * 0.3 + node * 1.3) * edgeFade * centerFade;

    gl_FragColor = vec4(color * intensity, intensity * uOpacity);
  }
`

export function createLoadingScanUniforms() {
  return {
    uTime: { value: 0 },
    uOpacity: { value: 0 },
    // Cyan-to-blue only (no purple) - matches the Estimate Price button's own gradient
    // (see PredictPriceCard's CTA: linear-gradient(135deg,#00D4FF,#0088FF)).
    uColorA: { value: new THREE.Color('#00D4FF') },
    uColorB: { value: new THREE.Color('#0088FF') },
  }
}
