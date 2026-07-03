import { Suspense, useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { Environment, MeshReflectorMaterial, OrbitControls } from '@react-three/drei'
import StandardCar from '../three/StandardCar'
import SceneBrightnessReveal from '../three/SceneBrightnessReveal'

// ── Inline 3D scene — home-specific camera angle and lighting ────────────────

const CAR_SCALE = 1.2
const REVEAL_DURATION = 3 // seconds - matches PredictCarScene's brightness ramp-up

function CarReadySignal({ onReady }: { onReady: () => void }) {
  useEffect(() => { onReady() }, [onReady])
  return null
}

function Scene({ onCarReady }: { onCarReady: () => void }) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[6, 12, 6]}
        intensity={3}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-5, 7, 4]} color="#00D4FF" intensity={2.4} />
      <pointLight position={[5, 2, -5]} color="#8B5CF6" intensity={1.6} />
      <pointLight position={[2, -0.5, 7]} color="#ffffff" intensity={0.4} />
      {/* Self-hosted instead of drei's preset="city" (which fetches from raw.githack.com,
          redirecting to raw.githubusercontent.com) so the scene doesn't depend on a third-party
          host being up/fast. Same file drei's "city" preset points to - see PredictCarScene.tsx. */}
      <Environment files="/hdri/potsdamer_platz_1k.hdr" />
      <Suspense fallback={null}>
        <group scale={CAR_SCALE}>
          <StandardCar />
        </group>
        <CarReadySignal onReady={onCarReady} />
      </Suspense>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.42, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <MeshReflectorMaterial
          blur={[300, 80]}
          resolution={1024}
          mixBlur={1}
          mixStrength={55}
          roughness={0.9}
          depthScale={1.1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#050A14"
          metalness={0.6}
          mirror={0.45}
        />
      </mesh>
      <OrbitControls
        autoRotate
        autoRotateSpeed={0.55}
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.1}
      />
    </>
  )
}

// ── Stats ────────────────────────────────────────────────────────────────────

const STATS = [
  { value: '20+', label: 'car brands' },
  { value: '15', label: 'vehicle specs' },
  { value: 'XGBoost', label: 'ML model' },
]

// ── Shared animation preset ──────────────────────────────────────────────────

const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
})

// ── Page ─────────────────────────────────────────────────────────────────────

export default function HeroSection() {
  const navigate = useNavigate()
  const [carReady, setCarReady] = useState(false)
  const handleCarReady = useCallback(() => setCarReady(true), [])

  return (
    <motion.section
      className="min-h-screen flex flex-col"
      exit={{ opacity: 0, y: -12, transition: { duration: 0.22, ease: 'easeIn' } }}
    >
      {/* navbar spacer */}
      <div className="h-16 shrink-0" />

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* ── Left: typography ─────────────────────────────────────── */}
        <div className="flex flex-col justify-between px-8 sm:px-14 lg:px-20 xl:px-28 pt-14 pb-12 lg:py-20 lg:w-[40%]">
          <div>
            {/* Meta */}
            <motion.p
              {...rise(0)}
              className="text-xs sm:text-sm uppercase tracking-[0.18em] text-slate-500 font-mono mb-10 lg:mb-14"
            >
              Spain &middot; Second-hand cars &middot; {new Date().getFullYear()}
            </motion.p>

            {/* Headline */}
            <motion.h1
              {...rise(0.08)}
              className="font-heading font-bold text-white leading-[0.93] tracking-[-0.03em]"
              style={{ fontSize: 'clamp(58px, 7.5vw, 116px)' }}
            >
              Price
              <br />
              your car
              <span style={{ color: '#00D4FF' }}>.</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              {...rise(0.18)}
              className="mt-8 text-base sm:text-lg text-slate-400 max-w-md leading-relaxed"
            >
              Machine learning predictions trained on real listings
              from the Spanish used-car market. Tune 15 vehicle specs
              and get your estimate instantly.
            </motion.p>

            {/* CTA */}
            <motion.div {...rise(0.28)} className="mt-10">
              <button
                onClick={() => navigate('/predict')}
                className="group inline-flex items-center gap-3 font-semibold text-sm text-white
                           border rounded-full px-6 py-3 transition-all duration-300
                           hover:text-primary"
                style={{ borderColor: 'rgba(255,255,255,0.14)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0,212,255,0.45)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'
                }}
              >
                Try the estimator
                <span className="transition-transform duration-300 group-hover:translate-x-1 text-base">
                  &rarr;
                </span>
              </button>
            </motion.div>
          </div>

          {/* Stats row */}
          <motion.div
            {...rise(0.38)}
            className="flex items-end gap-10 sm:gap-14 pt-8 mt-14 border-t"
            style={{ borderColor: 'rgba(255,255,255,0.07)' }}
          >
            {STATS.map((s) => (
              <div key={s.value}>
                <div className="font-heading text-2xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-slate-600 mt-1 tracking-wide">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── Right: 3D car ─────────────────────────────────────────── */}
        <div className="relative h-72 sm:h-96 lg:h-auto lg:flex-1" style={{ background: '#060B14' }}>
          <SceneBrightnessReveal ready={carReady} duration={REVEAL_DURATION} background="#050A14">
            <Canvas
              shadows
              dpr={[1, 2]}
              camera={{ position: [2, 2.5, 7], fov: 44 }}
              gl={{ antialias: true }}
              style={{ position: 'absolute', inset: 0 }}
            >
              <color attach="background" args={['#050A14']} />
              <fog attach="fog" args={['#050A14', 14, 30]} />
              <Scene onCarReady={handleCarReady} />
            </Canvas>
          </SceneBrightnessReveal>

          {/* Blend into left text panel on desktop */}
          <div
            className="absolute inset-y-0 left-0 w-32 pointer-events-none hidden lg:block"
            style={{ background: 'linear-gradient(to right, #050A14, transparent)' }}
          />
          {/* Blend top on mobile */}
          <div
            className="absolute inset-x-0 top-0 h-16 pointer-events-none lg:hidden"
            style={{ background: 'linear-gradient(to bottom, #050A14, transparent)' }}
          />
        </div>
      </div>
    </motion.section>
  )
}
