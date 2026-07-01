import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, MeshReflectorMaterial, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import CarModel from '../three/CarModel'
import { setModelDissolve, getDissolveBounds } from '../three/dissolveEffect'
import type { CarClass } from '../../types/api'

const SCALE = 0.95
const SCALE_MOBILE = 1.38
const DISSOLVE_SPEED = 1.5 // ~0.45s per phase (out, then in)
const SCAN_RING_INNER_RADIUS = 0.92 // fraction of the outer radius (1) - lower = thicker glowing band

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640)
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 639px)')
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])
  return isMobile
}

function RotatingCar({ class_ }: { class_: CarClass }) {
  const groupRef = useRef<THREE.Group>(null)
  const scanRef = useRef<THREE.Mesh>(null)
  const [displayedClass, setDisplayedClass] = useState<CarClass>(class_)
  const progress = useRef(1) // 0 = fully dissolved out, 1 = fully materialized in
  const phase = useRef<'idle' | 'out' | 'in'>('idle')
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
      const sweepLocalY = THREE.MathUtils.lerp(bounds.minY, bounds.maxY, dissolveAmount)
      scan.position.y = activeModel.position.y + sweepLocalY
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

function Scene({ class_ }: { class_: CarClass }) {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={2.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      {/* Cyan key light from front-left */}
      <pointLight position={[-4, 6, 4]} color="#00D4FF" intensity={2.2} />
      {/* Purple/violet rim from rear-right */}
      <pointLight position={[4, 3, -4]} color="#8B5CF6" intensity={1.6} />
      {/* Warm white floor fill */}
      <pointLight position={[0, -0.5, 6]} color="#ffffff" intensity={0.45} />

      <Environment preset="city" />

      <Suspense fallback={null}>
        <RotatingCar class_={class_} />
      </Suspense>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.42, 0]} receiveShadow>
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

export default function PredictCarScene({ class_ }: { class_: CarClass }) {
  return (
    <div className="absolute inset-0" style={{ background: '#060B14' }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 3.5, 7.5], fov: 42 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#050A14']} />
        <fog attach="fog" args={['#050A14', 14, 30]} />
        <Scene class_={class_} />
      </Canvas>
    </div>
  )
}
