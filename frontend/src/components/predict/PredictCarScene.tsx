import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, MeshReflectorMaterial, OrbitControls, useGLTF } from '@react-three/drei'
import { AnimatePresence, motion } from 'framer-motion'
import * as THREE from 'three'
import CarModel from '../three/CarModel'
import { setModelDissolve, getDissolveBounds, getSharedDissolveTopY } from '../three/dissolveEffect'
import { getCarModelPath } from '../../constants/carModels'
import useIsMobile from '../../hooks/useIsMobile'
import type { CarClass } from '../../types/api'

const ALL_CAR_CLASSES: CarClass[] = ['standard', '4x4', 'sport']

const SCALE = 0.95
const SCALE_MOBILE = 1.1
const DISSOLVE_SPEED = 1.8 // ~0.45s per phase (out, then in)
const DISSOLVE_HOLD = 0.1 // seconds to pause fully hidden between the out and in phases
const SCAN_RING_INNER_RADIUS = 0.92 // fraction of the outer radius (1) - lower = thicker glowing band

function RotatingCar({ class_ }: { class_: CarClass }) {
  const groupRef = useRef<THREE.Group>(null)
  const scanRef = useRef<THREE.Mesh>(null)
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

function Scene({ class_, onReady }: { class_: CarClass; onReady: () => void }) {
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

      <Environment preset="city" />

      <Suspense fallback={null}>
        <RotatingCar class_={class_} />
        <SceneReadySignal onReady={onReady} />
      </Suspense>

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

/** Themed cover shown until the scene's first car model has rendered - hides the pop-in of the
 *  model, lighting and reflective floor materializing piece by piece on a slow connection. */
function SceneLoadingOverlay() {
  return (
    <motion.div
      className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
      style={{ background: '#060B14' }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="h-9 w-9 rounded-full animate-spin"
        style={{ border: '2px solid rgba(0,212,255,0.15)', borderTopColor: '#00D4FF' }}
      />
    </motion.div>
  )
}

export default function PredictCarScene({ class_ }: { class_: CarClass }) {
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
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 3.5, 7.5], fov: 42 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#050A14']} />
        <fog attach="fog" args={['#050A14', 14, 30]} />
        <Scene class_={class_} onReady={handleReady} />
      </Canvas>

      <AnimatePresence>{!ready && <SceneLoadingOverlay />}</AnimatePresence>
    </div>
  )
}
