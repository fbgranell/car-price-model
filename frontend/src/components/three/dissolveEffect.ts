import * as THREE from 'three'
import { OUTLINE_TAG } from './applyCarMaterials'

const EDGE_WIDTH = 0.05 // local-space thickness of the glowing scan line right at the cut
const EDGE_GLOW_STRENGTH = 2.2

export interface DissolveBounds {
  minY: number
  maxY: number
  radius: number
}

const boundsByModel = new WeakMap<THREE.Object3D, DissolveBounds>()

/** Local-space floor/roof/footprint of a model, as computed by applyDissolveEffect - used by PredictCarScene to place a glowing scan-plane mesh at the same height as the shader cut. */
export function getDissolveBounds(model: THREE.Object3D): DissolveBounds | undefined {
  return boundsByModel.get(model)
}

const topYByClass = new Map<string, number>()

/** Records a car class's roof height (group-local Y, i.e. already including that class's own vertical offset) - see getSharedDissolveTopY. */
export function registerDissolveTopY(class_: string, groupLocalMaxY: number) {
  topYByClass.set(class_, groupLocalMaxY)
}

/**
 * Tallest roof height among every car class registered so far. PredictCarScene sweeps the scan
 * ring up to this shared height (instead of each model's own, differing roof height) so switching
 * between car classes mid-transition doesn't make the ring visibly teleport up or down.
 */
export function getSharedDissolveTopY(): number | undefined {
  if (topYByClass.size === 0) return undefined
  return Math.max(...topYByClass.values())
}

const COMMON_PATCH = `
  uniform float uDissolve;
  uniform float uDissolveMinY;
  uniform float uDissolveMaxY;
  varying vec3 vDissolvePos;`

const VERTEX_COMMON_PATCH = `
  uniform mat4 uMeshToRoot;
  varying vec3 vDissolvePos;`

const VERTEX_BEGIN_PATCH = `
  vDissolvePos = (uMeshToRoot * vec4(position, 1.0)).xyz;`

/**
 * Patches a mesh material with a hard vertical clip plane, expressed in the model-root's local
 * space (so it travels floor->roof regardless of the model's yaw, and is identical across car
 * classes since it's driven by each model's own bounding box), plus a thin emissive rim right at
 * the cut - a clean "holographic scanner" reveal/hide.
 *
 * Sub-meshes in these GLTFs (wheels, mirrors, etc.) are parented under nodes with their own local
 * offset from the model root, so their raw `position` attribute isn't in the same space as the
 * root-level bounding box used for uDissolveMinY/MaxY - without correcting for that, those parts
 * would already sit partly past the cut plane even at uDissolve = 0. uMeshToRoot (each mesh's own
 * matrixWorld, captured while the model is still unparented, i.e. relative to the model root) is
 * baked in once per mesh to bring every vertex into that shared root space before comparing.
 */
function patchDissolveMaterial(
  mat: THREE.Material,
  meshToRoot: THREE.Matrix4,
  minY: number,
  maxY: number,
  initialDissolve: number,
  edgeColor?: THREE.Color
) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uDissolve = { value: initialDissolve }
    shader.uniforms.uDissolveMinY = { value: minY }
    shader.uniforms.uDissolveMaxY = { value: maxY }
    shader.uniforms.uMeshToRoot = { value: meshToRoot }

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${VERTEX_COMMON_PATCH}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n${VERTEX_BEGIN_PATCH}`)

    if (edgeColor) {
      shader.uniforms.uEdgeColor = { value: edgeColor }
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\n${COMMON_PATCH}\nuniform vec3 uEdgeColor;`)
        .replace(
          '#include <dithering_fragment>',
          `
          float sweepY = mix(uDissolveMinY, uDissolveMaxY, uDissolve);
          if (vDissolvePos.y < sweepY) discard;
          // Fade the rim out right at uDissolve = 0/1 - otherwise sweepY sits exactly on minY/maxY
          // at rest and geometry that's naturally within EDGE_WIDTH of the floor (e.g. wheels)
          // would catch a permanent glow even with no dissolve in progress.
          float dissolveActive = smoothstep(0.0, 0.002, uDissolve) * (1.0 - smoothstep(0.998, 1.0, uDissolve));
          float edgeGlow = 1.0 - clamp((vDissolvePos.y - sweepY) / ${EDGE_WIDTH.toFixed(3)}, 0.0, 1.0);
          gl_FragColor.rgb += uEdgeColor * edgeGlow * edgeGlow * ${EDGE_GLOW_STRENGTH.toFixed(3)} * dissolveActive;
          #include <dithering_fragment>`
        )
    } else {
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\n${COMMON_PATCH}`)
        .replace(
          '#include <clipping_planes_fragment>',
          `#include <clipping_planes_fragment>
          float sweepY = mix(uDissolveMinY, uDissolveMaxY, uDissolve);
          if (vDissolvePos.y < sweepY) discard;`
        )
    }

    mat.userData.dissolveShader = shader
  }
  mat.needsUpdate = true
}

/**
 * Patches every mesh material to support a dissolve wipe driven by setModelDissolve(), used for
 * the class-switch transition. PredictCarScene reads getDissolveBounds() to place a matching
 * glow-ring mesh at the same height as the shader cut.
 */
export function applyDissolveEffect(model: THREE.Object3D, edgeColor = '#00D4FF', initialDissolve = 0) {
  const box = new THREE.Box3().setFromObject(model)
  const size = box.getSize(new THREE.Vector3())
  const bounds: DissolveBounds = {
    minY: box.min.y,
    maxY: box.max.y,
    radius: Math.max(size.x, size.z) / 2,
  }
  boundsByModel.set(model, bounds)
  const color = new THREE.Color(edgeColor)

  model.traverse((child) => {
    const mesh = child as THREE.Mesh
    if (!mesh.isMesh || mesh.name === OUTLINE_TAG) return

    patchDissolveMaterial(mesh.material as THREE.Material, mesh.matrixWorld.clone(), bounds.minY, bounds.maxY, initialDissolve, color)
    // Shadow maps are rendered with three.js's own auto-generated depth material, which never sees
    // the onBeforeCompile patch above - so without a matching custom depth material, a dissolving
    // model keeps casting its full shadow the whole time. Each mesh gets its own (cheap, tiny)
    // depth material rather than a shared one, since each needs its own uMeshToRoot.
    const depthMat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking })
    patchDissolveMaterial(depthMat, mesh.matrixWorld.clone(), bounds.minY, bounds.maxY, initialDissolve)
    mesh.customDepthMaterial = depthMat
  })
}

/** amount: 0 = fully visible, 1 = fully dissolved away. */
export function setModelDissolve(model: THREE.Object3D, amount: number) {
  const clamped = THREE.MathUtils.clamp(amount, 0, 1)

  model.traverse((child) => {
    const mesh = child as THREE.Mesh
    if (!mesh.isMesh) return
    const shader = (mesh.material as THREE.Material).userData.dissolveShader
    if (shader) shader.uniforms.uDissolve.value = clamped
    const depthShader = (mesh.customDepthMaterial as THREE.Material | undefined)?.userData.dissolveShader
    if (depthShader) depthShader.uniforms.uDissolve.value = clamped
  })
}
