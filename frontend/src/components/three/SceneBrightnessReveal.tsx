import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

const REVEAL_EASE = [0.22, 1, 0.36, 1] as [number, number, number, number]

/** Keeps the whole rendered scene (lights, floor, car - everything) pinned fully opaque but
 *  black until `ready`, then slowly brings the brightness up - like stage lights coming up,
 *  rather than the scene fading in/out of transparency. Shared by PredictCarScene and
 *  HeroSection so both car viewers reveal the same way. */
export default function SceneBrightnessReveal({
  ready,
  duration,
  children,
}: {
  ready: boolean
  duration: number
  children: ReactNode
}) {
  return (
    <motion.div
      className="absolute inset-0"
      initial={false}
      animate={{ filter: ready ? 'brightness(1)' : 'brightness(0)' }}
      transition={{ duration, ease: REVEAL_EASE }}
    >
      {children}
    </motion.div>
  )
}
