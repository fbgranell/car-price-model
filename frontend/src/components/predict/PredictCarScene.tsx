import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, MeshReflectorMaterial, OrbitControls, useGLTF } from '@react-three/drei'
import { AnimatePresence, motion } from 'framer-motion'
import * as THREE from 'three'
import CarModel from '../three/CarModel'
import SceneBrightnessReveal from '../three/SceneBrightnessReveal'
import { setModelDissolve, getDissolveBounds, getSharedDissolveTopY } from '../three/dissolveEffect'
import {
  LOADING_SCAN_VERTEX_SHADER,
  LOADING_SCAN_FRAGMENT_SHADER,
  createLoadingScanUniforms,
} from '../three/loadingScanEffect'
import { getCarModelPath } from '../../constants/carModels'
import useIsMobile from '../../hooks/useIsMobile'
import type { CarClass } from '../../types/api'

const ALL_CAR_CLASSES: CarClass[] = ['standard', '4x4', 'sport']

const SCALE = 0.95
const SCALE_MOBILE = 1.1
const DISSOLVE_SPEED = 1.8 // ~0.45s per phase (out, then in)
const DISSOLVE_HOLD = 0.1 // seconds to pause fully hidden between the out and in phases
const SCAN_RING_INNER_RADIUS = 0.92 // fraction of the outer radius (1) - lower = thicker glowing band
const LOADING_SCAN_SCALE = 1.1 // fraction of the model's footprint radius the scan disc covers
const LOADING_SCAN_SWEEP_SPEED = 1.1 // radians/sec fed into the sin() ping-pong sweep
const LOADING_SCAN_FADE_LAMBDA = 4 // opacity damp rate (in/out) when `loading` toggles

function RotatingCar({ class_, loading }: { class_: CarClass; loading: boolean }) {
  const groupRef = useRef<THREE.Group>(null)
  const scanRef = useRef<THREE.Mesh>(null)
  const loadingScanRef = useRef<THREE.Mesh>(null)
  const loadingScanUniforms = useRef(createLoadingScanUniforms())
  const loadingScanSweep = useRef(0)
  const loadingScanOpacity = useRef(0)
  const [displayedClass, setDisplayedClass] = useState<CarClass>(class_)
  const progress = useRef(1) // 0 = fully dissolved out, 1 = fully materialized in
  const phase = useRef<'idle' | 'out' | 'hold' | 'in'>('idle')
  const holdTimer = useRef(0)
  const nextClass = useRef<CarClass>(class_)
  const isMobile = useIsMobile()
  const scale = isMobile ? SCALE_MOBILE : SCALE

  useEffect(() => {
    if (class_ !== displayedClass) {
      nextClass.current = class_
      phase.current = 'out'
    }
  }, [class_, displayedClass])

  useFrame((_, delta) => {
    const g = groupRef.current
    if (!g) return

    g.rotation.y += delta * 0.35
    g.scale.setScalar(scale)

    const activeModel = g.children[0]

    if (phase.current === 'out') {
      progress.current = Math.max(0, progress.current - delta * DISSOLVE_SPEED)
      if (activeModel) setModelDissolve(activeModel, 1 - progress.current)
      if (progress.current === 0) {
        setDisplayedClass(nextClass.current)
        holdTimer.current = 0
        phase.current = 'hold'
      }
    } else if (phase.current === 'hold') {
      holdTimer.current += delta
      if (holdTimer.current >= DISSOLVE_HOLD) {
        phase.current = 'in'
      }
    } else if (phase.current === 'in') {
      progress.current = Math.min(1, progress.current + delta * DISSOLVE_SPEED)
      if (activeModel) setModelDissolve(activeModel, 1 - progress.current)
      if (progress.current >= 1) {
        phase.current = 'idle'
      }
    }

    const scan = scanRef.current
    const bounds = activeModel ? getDissolveBounds(activeModel) : undefined
    if (scan && activeModel && bounds && phase.current !== 'idle') {
      const dissolveAmount = 1 - progress.current
      const worldMinY = activeModel.position.y + bounds.minY
      // Sweep up to the tallest car class's roof (not this model's own, possibly shorter one) so
      // the ring doesn't teleport when it swaps to a taller/shorter model mid-transition.
      const worldMaxY = getSharedDissolveTopY()
      scan.position.y = THREE.MathUtils.lerp(worldMinY, worldMaxY, dissolveAmount)
      scan.scale.setScalar(Math.max(bounds.radius * 1.15, 0.05))
      scan.visible = true
    } else if (scan) {
      scan.visible = false
    }

    // Loading scan: a sparse grid disc that ping-pongs floor<->roof for as long as `loading` is
    // true, independent of the class-dissolve phase above - the car itself never dissolves for
    // this one, it just gets "scanned" while the prediction request is in flight.
    const loadingScan = loadingScanRef.current
    const uniforms = loadingScanUniforms.current
    if (loadingScan && activeModel && bounds) {
      loadingScanSweep.current += delta * LOADING_SCAN_SWEEP_SPEED
      const wave = (Math.sin(loadingScanSweep.current) + 1) / 2
      const worldMinY = activeModel.position.y + bounds.minY
      const worldMaxY = getSharedDissolveTopY()
      loadingScan.position.y = THREE.MathUtils.lerp(worldMinY, worldMaxY, wave)
      loadingScan.scale.setScalar(Math.max(bounds.radius * LOADING_SCAN_SCALE, 0.05))

      loadingScanOpacity.current = THREE.MathUtils.damp(
        loadingScanOpacity.current,
        loading ? 1 : 0,
        LOADING_SCAN_FADE_LAMBDA,
        delta
      )
      uniforms.uOpacity.value = loadingScanOpacity.current
      uniforms.uTime.value += delta
      loadingScan.visible = loadingScanOpacity.current > 0.01
    } else if (loadingScan) {
      loadingScan.visible = false
    }
  })

  return (
    <group ref={groupRef}>
      <CarModel class_={displayedClass} initialDissolve={phase.current !== 'idle' ? 1 : 0} />
      <mesh ref={scanRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[SCAN_RING_INNER_RADIUS, 1, 64]} />
        <meshBasicMaterial
          color="#00D4FF"
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={loadingScanRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <circleGeometry args={[1, 64]} />
        <shaderMaterial
          uniforms={loadingScanUniforms.current}
          vertexShader={LOADING_SCAN_VERTEX_SHADER}
          fragmentShader={LOADING_SCAN_FRAGMENT_SHADER}
          transparent
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

/** Fires onReady once mounted - since it's a sibling of RotatingCar inside the same Suspense
 *  boundary, React withholds committing both until RotatingCar's GLTF suspense resolves, so this
 *  only fires the moment the first car model is actually ready to show. */
function SceneReadySignal({ onReady }: { onReady: () => void }) {
  useEffect(() => { onReady() }, [onReady])
  return null
}

/** Mounted in the real Canvas (not just a network/parse Suspense gate) while a class switch is
 *  pending, so shader compilation for the target class's materials happens off the critical path
 *  instead of stalling the dissolve-in transition the instant RotatingCar actually swaps to it.
 *
 *  Kept `visible={false}` so R3F's normal per-frame render never draws it - three.js skips
 *  invisible subtrees entirely, so this costs nothing on the regular render path. Warming instead
 *  goes through gl.compileAsync(), which builds/links the shader programs (running each
 *  material's onBeforeCompile, including the dissolve patch from applyDissolveEffect) without a
 *  real draw call - a real draw's first use of a brand-new program forces the CPU to block until
 *  the driver finishes linking it, which is exactly the stall this is meant to avoid: with the car
 *  itself invisible instead, there's nothing else on screen for that stall to be visible on.
 *  compileAsync polls link status non-blockingly (via KHR_parallel_shader_compile where available)
 *  instead, so onWarmed only fires once the program is actually ready to draw with.
 *
 *  This only pre-warms shaders, not geometry/texture GPU upload - those still happen lazily on
 *  the model's first real (visible) draw, but are normally far cheaper than shader link. */
function PendingModelWarmup({ class_, onWarmed }: { class_: CarClass; onWarmed: (class_: CarClass) => void }) {
  const groupRef = useRef<THREE.Group>(null)
  const { gl, camera, scene } = useThree()

  useEffect(() => {
    const group = groupRef.current
    if (!group) return
    let cancelled = false
    gl.compileAsync(group, camera, scene).then(() => {
      if (!cancelled) onWarmed(class_)
    })
    return () => {
      cancelled = true
    }
  }, [class_, gl, camera, scene, onWarmed])

  return (
    <group ref={groupRef} visible={false}>
      <CarModel class_={class_} initialDissolve={1} />
    </group>
  )
}

function Scene({
  class_,
  loading,
  onReady,
  pendingClass,
  onPendingWarmed,
}: {
  class_: CarClass
  loading: boolean
  onReady: () => void
  pendingClass: CarClass | null
  onPendingWarmed: (class_: CarClass) => void
}) {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 10, 5]} intensity={2.8} />
      {/* Cyan key light from front-left */}
      <pointLight position={[-4, 6, 4]} color="#00D4FF" intensity={2.2} />
      {/* Purple/violet rim from rear-right */}
      <pointLight position={[4, 3, -4]} color="#8B5CF6" intensity={1.6} />
      {/* Warm white floor fill */}
      <pointLight position={[0, -0.5, 6]} color="#ffffff" intensity={0.45} />

      {/* Self-hosted instead of drei's preset="city" (which fetches from raw.githack.com,
          redirecting to raw.githubusercontent.com) so the scene doesn't depend on a third-party
          host being up/fast - public/hdri/potsdamer_platz_1k.hdr is the same file that preset
          points to. */}
      <Environment files="/hdri/potsdamer_platz_1k.hdr" />

      <Suspense fallback={null}>
        <RotatingCar class_={class_} loading={loading} />
        <SceneReadySignal onReady={onReady} />
      </Suspense>

      {pendingClass && (
        <Suspense fallback={null}>
          <PendingModelWarmup class_={pendingClass} onWarmed={onPendingWarmed} />
        </Suspense>
      )}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.42, 0]}>
        <planeGeometry args={[40, 40]} />
        <MeshReflectorMaterial
          blur={[300, 80]}
          resolution={1024}
          mixBlur={1}
          mixStrength={60}
          roughness={0.9}
          depthScale={1.1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#050A14"
          metalness={0.6}
          mirror={0.5}
        />
      </mesh>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.15}
      />
    </>
  )
}

const REVEAL_EASE = [0.22, 1, 0.36, 1] as [number, number, number, number]

/** Spinner shown until the scene's first car model has rendered. Doesn't need to mask the
 *  scene behind it (SceneBrightnessReveal already keeps that black until ready), so it can
 *  clear quickly once ready flips true instead of carrying the slow reveal itself. */
function SceneLoadingOverlay() {
  return (
    <motion.div
      className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: REVEAL_EASE }}
    >
      <div
        className="h-9 w-9 rounded-full animate-spin"
        style={{ border: '2px solid rgba(0,212,255,0.15)', borderTopColor: '#00D4FF' }}
      />
    </motion.div>
  )
}

const REVEAL_DURATION = 4 // seconds - brightness ramp-up once the model has loaded

export default function PredictCarScene({
  class_,
  loading = false,
  pendingClass = null,
  onPendingWarmed = () => {},
}: {
  class_: CarClass
  loading?: boolean
  pendingClass?: CarClass | null
  onPendingWarmed?: (class_: CarClass) => void
}) {
  const [ready, setReady] = useState(false)
  const handleReady = useCallback(() => setReady(true), [])

  useEffect(() => {
    // The currently shown class already loads via CarModel's own lazy import + useGLTF -
    // once that settles, warm the cache for the other two classes too (in the background, off the
    // critical path) so a later class swap is an instant dissolve instead of stalling on a fresh
    // multi-MB GLB fetch. Only fires once per mount, using the class shown on first render.
    const others = ALL_CAR_CLASSES.filter((c) => c !== class_)
    const prefetch = () => others.forEach((c) => useGLTF.preload(getCarModelPath(c)))
    if (typeof window.requestIdleCallback === 'function') {
      const handle = window.requestIdleCallback(prefetch)
      return () => window.cancelIdleCallback(handle)
    }
    const timer = setTimeout(prefetch, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="absolute inset-0" style={{ background: '#060B14' }}>
      <SceneBrightnessReveal ready={ready} duration={REVEAL_DURATION} background="#050A14">
        <Canvas
          dpr={[1, 2]}
          camera={{ position: [0, 3.5, 7.5], fov: 42 }}
          gl={{ antialias: true }}
        >
          <color attach="background" args={['#050A14']} />
          <fog attach="fog" args={['#050A14', 14, 30]} />
          <Scene
            class_={class_}
            loading={loading}
            onReady={handleReady}
            pendingClass={pendingClass}
            onPendingWarmed={onPendingWarmed}
          />
        </Canvas>
      </SceneBrightnessReveal>

      <AnimatePresence>{!ready && <SceneLoadingOverlay />}</AnimatePresence>
    </div>
  )
}
