import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

const REVEAL_EASE = [0.22, 1, 0.36, 1] as [number, number, number, number]

/** Covers the scene with a solid `background`-colored curtain until `ready`, then fades the
 *  curtain away - like stage lights coming up, rather than the scene fading in/out of
 *  transparency. Curtain color should match the page background behind it (not pure black -
 *  CSS `brightness(0)` always clamps to rgb(0,0,0) regardless of the scene's actual colors,
 *  which showed a seam against the page's dark-navy background). Shared by PredictCarScene and
 *  HeroSection so both car viewers reveal the same way. */
export default function SceneBrightnessReveal({
  ready,
  duration,
  background,
  children,
}: {
  ready: boolean
  duration: number
  background: string
  children: ReactNode
}) {
  return (
    <div className="absolute inset-0">
      {children}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background }}
        initial={false}
        animate={{ opacity: ready ? 0 : 1 }}
        transition={{ duration, ease: REVEAL_EASE }}
      />
    </div>
  )
}
