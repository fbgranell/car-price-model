import * as THREE from 'three'

export const OUTLINE_TAG = '__outline__'

export function applyOutlines(model: THREE.Object3D, thickness = 0.03) {
  model.traverse((child) => {
    const mesh = child as THREE.Mesh
    if (!mesh.isMesh || mesh.name === OUTLINE_TAG) return
    // skip glass and anything already outlined
    const mat = mesh.material as THREE.MeshStandardMaterial
    if (mat?.transparent) return
    if (mesh.children.some((c) => c.name === OUTLINE_TAG)) return

    const outline = new THREE.Mesh(
      mesh.geometry,
      new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide })
    )
    outline.name = OUTLINE_TAG
    outline.scale.setScalar(1 + thickness)
    mesh.add(outline)
  })
}

type MatProps = {
  color: string
  metalness?: number
  roughness?: number
  transparent?: boolean
  opacity?: number
  emissive?: string
  emissiveIntensity?: number
}



/**
 * Glass meshes are alpha-blended (transparent + near-black tint), with no per-triangle
 * depth sorting. Near edge-on angles the curved glass overlaps itself along the view ray,
 * so several partially-transparent dark layers blend on top of each other and converge to
 * solid black regardless of order - that's the "window flashes black for a second" bug.
 * Swapping to MeshPhysicalMaterial's transmission (real refraction/Fresnel) fixes it at the
 * root: transmissive surfaces get brighter and more reflective at grazing angles, the opposite
 * of alpha-blend stacking, so they can't degrade to black. attenuationDistance is derived
 * from each mesh's original opacity so relative tint (e.g. darker rear privacy glass vs.
 * lighter windscreen) is preserved.
 *
 * Standalone by design: doesn't assume applyCarMaterials ran first. Three.js's transmission
 * attenuation computes -log(attenuationColor) per channel, so a literal (0,0,0) tint - which
 * is exactly the raw GLTF glass color on some models - makes log(0) = -Infinity and renders
 * fully opaque black at every angle. Channels are floored above zero to avoid that singularity.
 */
export function fixGlassRendering(model: THREE.Object3D) {
  const thickness = 0.02
  const MIN_CHANNEL = 0.5

  model.traverse((child) => {
    const mesh = child as THREE.Mesh
    if (!mesh.isMesh) return
    if (!/glass|window|windshield/.test(mesh.name.toLowerCase())) return

    const base = mesh.material as THREE.MeshStandardMaterial
    const rawTint = base.color ?? new THREE.Color('#0a0f16')
    const tint = new THREE.Color(
      Math.max(rawTint.r, MIN_CHANNEL),
      Math.max(rawTint.g, MIN_CHANNEL),
      Math.max(rawTint.b, MIN_CHANNEL)
    )
    const opacity = THREE.MathUtils.clamp(base.opacity ?? 0.4, 0.05, 0.15)
    // Beer-Lambert: solve attenuationDistance so a single layer's transmittance matches the old flat opacity.
    const attenuationDistance = thickness / -Math.log(1 - opacity)

    mesh.material = new THREE.MeshPhysicalMaterial({
      color: tint,
      metalness: 0,
      roughness: Math.min(base.roughness ?? 0.0, 0.0),
      transmission: 1,
      thickness,
      ior: 1.2,
      attenuationColor: tint,
      attenuationDistance,
      side: THREE.FrontSide,
      envMapIntensity: 1.2,
    })
  })
}

/** Clamps metalness/roughness on every mesh to kill blown-out specular highlights on pure-white parts, with an optional color overlay on top. */
export function dampenReflections(
  model: THREE.Object3D,
  options: { maxMetalness?: number; minRoughness?: number; tint?: string; tintAmount?: number } = {}
) {
  const { maxMetalness, minRoughness, tint, tintAmount = 0.15 } = options
  const tintColor = tint ? new THREE.Color(tint) : null

  model.traverse((child) => {
    const mesh = child as THREE.Mesh
    if (!mesh.isMesh) return

    const mat = (mesh.material as THREE.MeshStandardMaterial).clone()
    if (maxMetalness !== undefined) mat.metalness = Math.min(mat.metalness, maxMetalness)
    if (minRoughness !== undefined) mat.roughness = Math.max(mat.roughness, minRoughness)
    if (tintColor) mat.color.lerp(tintColor, tintAmount)
    mesh.material = mat
  })
}

export function applyCarMaterials(model: THREE.Object3D, bodyColor: string) {
  model.traverse((child) => {
    const mesh = child as THREE.Mesh
    if (!mesh.isMesh) return

    mesh.castShadow = false
    mesh.receiveShadow = true

    const name = mesh.name.toLowerCase()
    const base = mesh.material as THREE.MeshStandardMaterial
    const mat = base.clone()
    mat.map = null

    const apply = (p: MatProps) => {
      mat.color = new THREE.Color(p.color)
      if (p.metalness !== undefined) mat.metalness = p.metalness
      if (p.roughness !== undefined) mat.roughness = p.roughness
      mat.transparent = !!p.transparent
      if (p.opacity !== undefined) mat.opacity = p.opacity
      if (p.emissive) {
        mat.emissive = new THREE.Color(p.emissive)
        mat.emissiveIntensity = p.emissiveIntensity ?? 1
      }
    }

    if (/body|paint|exterior|door/.test(name)) {
      apply({ color: bodyColor, metalness: 0.85, roughness: 0.15 })
    } else if (/glass|window|windshield/.test(name)) {
      apply({ color: '#82b1ff', transparent: true, opacity: 0.3, metalness: 0.1, roughness: 0.05 })
    } else if (/tire|tyre|rubber/.test(name)) {
      apply({ color: '#1c1c1c', metalness: 0.1, roughness: 0.9 })
    } else if (/rim|wheel|hub|alloy/.test(name)) {
      apply({ color: '#000000', metalness: 0.3, roughness: 0.1 })
    } else if (/light|headlight|taillight/.test(name)) {
      const rear = /tail|back|rear/.test(name)
      apply({ color: '#e0e0e0', emissive: rear ? '#444343' : '#ffffff', emissiveIntensity: 1 })
    } else if (/interior|seat|dashboard/.test(name)) {
      apply({ color: '#1a1a2e', metalness: 0.1, roughness: 0.8 })
    } else {
      apply({ color: '#444343', metalness: 0.9, roughness: 0.4 })
    }

    mat.needsUpdate = true
    mesh.material = mat
  })
}
