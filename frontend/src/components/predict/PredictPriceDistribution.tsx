import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, animate as animateValue } from 'framer-motion'
import type { Lang } from './PredictSpecPanel'
import summary from '../../summary.json'
import {
  WIDTH,
  HEIGHT,
  CURVE_TOP,
  CURVE_BOTTOM,
  GLOBAL_AXIS_Y,
  CENTER_X,
  linePath,
  areaPath,
  bandLeftX,
  bandRightX,
} from './priceDistributionGeometry'

interface PredictPriceDistributionProps {
  loading: boolean
  price: number | null
  low: number | null
  high: number | null
  lang: Lang
}

const CAPTION = { en: 'Analyzing patterns…', es: 'Analizando patrones…' } satisfies Record<Lang, string>
const RANGE_LABEL = { en: 'Likely range', es: 'Rango probable' } satisfies Record<Lang, string>

const DEFAULT_ANCHOR = 15000
const SIGMA = summary.global.sigma
const JITTER_AMPLITUDE = 5 * SIGMA // how far the number scans either side of the anchor while thinking
const TRAVEL_PX = 56 // how far the curve slides either side of center while thinking
const ease = [0.22, 1, 0.36, 1] as [number, number, number, number]
const RESOLVE_DURATION = 1.3 // seconds for the wander/spread/color to settle back to center on resolve

// Marker wander while thinking — independent of the curve's own movement above.
const MARKER_TRAVEL_PX = 30 // how far the marker slides either side of center, in px (its "min/max movement")

// Both the curve's and marker's wander patterns are randomized fresh each time a request starts
// (see randomWander below), so the "thinking" animation doesn't play out identically every time.
const WANDER_STEPS = 5 // intermediate points in the random search pattern (excludes the 0 at each end)
const WANDER_MAG_MIN = 0.3 // smallest magnitude (in -1..1 units) a random wander point can take
const WANDER_MAG_MAX = 1 // largest magnitude a random wander point can take
const WANDER_PERIOD_MIN = 2.8 // seconds — fastest a random wander loop can run
const WANDER_PERIOD_MAX = 4.2 // seconds — slowest a random wander loop can run

const randRange = (min: number, max: number) => min + Math.random() * (max - min)
const randSign = () => (Math.random() < 0.5 ? -1 : 1)

/** A random search pattern in -1..1 units. Starts and ends at 0 so it loops seamlessly (repeat:
 *  Infinity replays the same array) and so it's already at rest when the resolve transition
 *  takes over from wherever `sweep`/`markerSweep` currently sit. */
function randomWander(steps: number): number[] {
  return [0, ...Array.from({ length: steps }, () => randSign() * randRange(WANDER_MAG_MIN, WANDER_MAG_MAX)), 0]
}

// Marker color while thinking — cycles through this palette, then converges to RESOLVED_MARKER_COLOR.
const MARKER_COLOR_PERIOD = 2.4 // seconds for one full color cycle
const MARKER_COLOR_KEYFRAMES = ['#00D4FF', '#8B5CF6', '#F59E0B', '#00D4FF']
const RESOLVED_MARKER_COLOR = '#00FF88'

// Curve-width ("std") breathing while thinking — tunable independently of the X wander above.
const SPREAD_MIN = 0.5 // narrowest the curve gets, as a multiple of its real (resolved) width
const SPREAD_MAX = 0.8 // widest the curve gets, as a multiple of its real (resolved) width
const SPREAD_PERIOD_MIN = 2.8 // seconds — fastest a random breathing cycle can run
const SPREAD_PERIOD_MAX = 4.2 // seconds — slowest a random breathing cycle can run

// The resolved curve narrows to this multiple of its "true" width — <1 reads as a sharper,
// more confident peak. Band ticks/labels are scaled by the same factor so everything stays aligned.
const RESOLVED_SPREAD = 0.35

/** A random narrow→wide→settle breathing cycle, randomized fresh each request. Starts and ends at
 *  RESOLVED_SPREAD (not the neutral 1) so the loop is already resting near its final value — the
 *  snap to RESOLVED_SPREAD on resolve stays tiny regardless of where in the cycle it was cut off. */
function randomSpreadKeyframes(): number[] {
  return [RESOLVED_SPREAD, randRange(SPREAD_MIN, SPREAD_MAX), randRange(SPREAD_MIN, SPREAD_MAX), RESOLVED_SPREAD]
}

const roundToTen = (v: number) => Math.round(v / 10) * 10
const formatK = (v: number) => `${Math.round(v / 1000)}k`
const AXIS_TICK_COUNT = 4 // 5 tick marks, evenly spaced across the full visible axis

// The likely-range (80%) segment on the axis is centered on the curve (same CENTER_X), but
// the curve's own visual width narrows via the animated RESOLVED_SPREAD transform (a CSS
// scaleX the axis segment doesn't share, since it's plain SVG coordinates, not transformed).
// Tune this by hand to match how narrow the resolved curve actually looks on screen.
const AXIS_BAND_SCALE = 0.3
const axisLeftX = CENTER_X + (bandLeftX - CENTER_X) * AXIS_BAND_SCALE
const axisRightX = CENTER_X + (bandRightX - CENTER_X) * AXIS_BAND_SCALE
const bandLeftPct = (axisLeftX / WIDTH) * 100
const bandRightPct = (axisRightX / WIDTH) * 100

// Spinning axis while thinking — ticks scroll continuously, like the straight-line cross-section
// of a circular dial's rim that's been given a push, instead of tracking the jittering mean.
// No values on them: with no real low/high yet, made-up numbers would have nothing sensible to
// converge into once resolved, so only the marks themselves move.
const SPIN_TICK_SPACING = 32 // px between scrolling tick marks
const SPIN_TICK_PERIOD = 0.50 // seconds to travel one tick-spacing while thinking
const SPIN_DECEL_DURATION = 1 // seconds for the spin to ease to a stop once resolved
const spinEase = [0.16, 1, 0.3, 1] as [number, number, number, number] // pronounced ease-out - losing momentum
const BAND_REVEAL_DELAY = 0.5 // seconds after resolve before the real ticks/labels/band start drawing in, so the spin visibly settles first
const BAND_DRAW_DURATION = 0.5
const SPIN_TICK_XS = Array.from(
  { length: Math.ceil(WIDTH / SPIN_TICK_SPACING) + 3 },
  (_, i) => -SPIN_TICK_SPACING + i * SPIN_TICK_SPACING
)

export default function PredictPriceDistribution({ loading, price, low, high, lang }: PredictPriceDistributionProps) {
  const anchor = price ?? DEFAULT_ANCHOR

  // Horizontal "wander" position, -1..1. Loops while thinking, settles to 0 once resolved —
  // this is what makes the whole distribution slide back to center on resolve.
  const sweep = useMotionValue(0)
  const groupX = useTransform(sweep, [-1, 1], [-TRAVEL_PX, TRAVEL_PX])

  // The marker's own wander position — moves independently of the curve's `sweep` (different
  // keyframes, different period) while thinking, then converges back to center in step with it
  // once resolved.
  const markerSweep = useMotionValue(0)
  const markerX = useTransform(markerSweep, [-1, 1], [-MARKER_TRAVEL_PX, MARKER_TRAVEL_PX])

  // The marker's color — cycles while thinking, converges to green once resolved (in step with
  // its position settling above).
  const markerColor = useMotionValue(RESOLVED_MARKER_COLOR)

  // Curve width multiplier. Breathes wider/narrower while thinking — as if the model's
  // uncertainty (std) hasn't settled yet — then converges to RESOLVED_SPREAD, the sharp,
  // "confident" shape, once resolved.
  const spread = useMotionValue(RESOLVED_SPREAD)

  // Height companion to `spread` — a real PDF that widens also flattens (area stays ~1), so
  // scaling width alone reads as taffy being stretched rather than uncertainty changing. This
  // derives the peak height directly from the current width so they always move together.
  const spreadHeight = useTransform(spread, [RESOLVED_SPREAD, SPREAD_MIN, SPREAD_MAX], [1, 0.82, 0.65])

  // Scroll offset for the "spinning" placeholder axis ticks while thinking - see SPIN_TICK_XS.
  const spinX = useMotionValue(0)

  // The displayed number is a spring that either chases the jittering target (thinking)
  // or the real price (resolved) — same mechanism, so it always "runs" smoothly to wherever
  // it's headed instead of snapping.
  const numSpring = useSpring(anchor, { stiffness: 60, damping: 14 })
  const [display, setDisplay] = useState(Math.round(anchor))

  useEffect(() => {
    return numSpring.on('change', (v) => setDisplay(Math.round(v)))
  }, [numSpring])

  useEffect(() => {
    if (!loading) {
      // Both converge to center at the same rate — this is the "coming together" moment.
      animateValue(sweep, 0, { duration: RESOLVE_DURATION, ease })
      animateValue(markerSweep, 0, { duration: RESOLVE_DURATION, ease })
      animateValue(spread, RESOLVED_SPREAD, { duration: RESOLVE_DURATION, ease })
      animateValue(markerColor, RESOLVED_MARKER_COLOR, { duration: RESOLVE_DURATION, ease })
      // The spin decelerates to rest rather than just vanishing - see the fade-out delay on the
      // spinning ticks below, timed to let it visibly slow down first.
      animateValue(spinX, 0, { duration: SPIN_DECEL_DURATION, ease: spinEase })
      if (price !== null) numSpring.set(price)
      return
    }
    // While thinking, the curve and marker wander independently — freshly randomized shapes and
    // periods each time a request starts — so they visibly search out of sync, rather than moving
    // as one, and the animation doesn't play out identically on every request.
    const sweepControls = animateValue(sweep, randomWander(WANDER_STEPS), {
      duration: randRange(WANDER_PERIOD_MIN, WANDER_PERIOD_MAX),
      repeat: Infinity,
      ease: 'easeInOut',
    })
    const markerWander = randomWander(WANDER_STEPS)
    const markerControls = animateValue(markerSweep, markerWander, {
      duration: randRange(WANDER_PERIOD_MIN, WANDER_PERIOD_MAX),
      repeat: Infinity,
      ease: 'easeInOut',
    })
    // Axis ticks spin in the same first direction the marker wanders off in, so the whole thing
    // reads as one push rather than two unrelated animations.
    const spinDirection = markerWander[1] >= 0 ? 1 : -1
    const spinControls = animateValue(spinX, spinDirection * SPIN_TICK_SPACING, {
      duration: SPIN_TICK_PERIOD,
      repeat: Infinity,
      ease: 'linear',
    })
    const spreadControls = animateValue(spread, randomSpreadKeyframes(), {
      duration: randRange(SPREAD_PERIOD_MIN, SPREAD_PERIOD_MAX),
      repeat: Infinity,
      ease: 'easeInOut',
    })
    const colorControls = animateValue(markerColor, MARKER_COLOR_KEYFRAMES, {
      duration: MARKER_COLOR_PERIOD,
      repeat: Infinity,
      ease: 'easeInOut',
    })
    const unsubscribe = markerSweep.on('change', (v) => {
      // Jitter can swing past 0 when the anchor is small - abs() keeps the wandering number
      // reading as a plausible price instead of flashing negative.
      numSpring.set(roundToTen(Math.abs(anchor + v * JITTER_AMPLITUDE)))
    })
    return () => {
      sweepControls.stop()
      markerControls.stop()
      spreadControls.stop()
      spinControls.stop()
      colorControls.stop()
      unsubscribe()
    }
  }, [loading, price, anchor, sweep, markerSweep, spread, markerColor, spinX, numSpring])

  const bandLabelPct = ((GLOBAL_AXIS_Y + 10) / HEIGHT) * 100 // shared row for both the vibrant and muted axis labels

  // Ticks along the full grey axis, extrapolated from the likely range's own known scale
  // (its two endpoints are the only euro-to-pixel reference we actually have). The middle tick
  // always falls inside the likely-range highlight, so it's dropped — nothing useful to add there.
  const eurosPerPx = low !== null && high !== null ? (high - low) / (axisRightX - axisLeftX) : null
  const middleTickIndex = AXIS_TICK_COUNT / 2
  const axisTicks =
    eurosPerPx !== null && low !== null
      ? Array.from({ length: AXIS_TICK_COUNT + 1 }, (_, i) => {
          const x = (i / AXIS_TICK_COUNT) * WIDTH
          return { x, value: low + (x - axisLeftX) * eurosPerPx, i }
        }).filter((tick) => tick.i !== middleTickIndex)
      : []

  return (
    <div className="w-full flex flex-col items-center">
      <motion.div
        animate={{ opacity: loading ? 0.75 : 1 }}
        transition={{ duration: 0.4 }}
        className="font-heading font-bold leading-none z-10"
      >
        <span
          className="text-5xl sm:text-6xl"
          style={{
            background: 'linear-gradient(90deg,#00D4FF,#8B5CF6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {display.toLocaleString('es-ES')}
        </span>
        <span className="text-2xl text-slate-500 ml-2">&euro;</span>
      </motion.div>

      <div className="relative w-full max-w-[320px]">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-36">
          <defs>
            <linearGradient id="pdf-stroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#00D4FF" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="pdf-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#00D4FF" stopOpacity="0.02" />
            </linearGradient>
            {/* the market-range axis fades to nothing near the card's edges — it's a real, true-scale
                line extending far off-canvas toward p1/p99, not a line that literally ends at p1/p99 */}
            <linearGradient id="axis-fade" gradientUnits="userSpaceOnUse" x1="0" y1={GLOBAL_AXIS_Y} x2={WIDTH} y2={GLOBAL_AXIS_Y}>
              <stop offset="0%" stopColor="rgba(148,163,184,0)" />
              <stop offset="18%" stopColor="rgba(148,163,184,0.45)" />
              <stop offset="82%" stopColor="rgba(148,163,184,0.45)" />
              <stop offset="100%" stopColor="rgba(148,163,184,0)" />
            </linearGradient>
            <clipPath id="dist-clip">
              <rect x="0" y="0" width={WIDTH} height={HEIGHT} />
            </clipPath>
          </defs>

          <g clipPath="url(#dist-clip)">
            <line x1="0" y1={CURVE_BOTTOM} x2={WIDTH} y2={CURVE_BOTTOM} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

            {/* the distribution slides + breathes as one unit — wanders/widens while thinking, settles on resolve */}
            <motion.g style={{ x: groupX, scaleX: spread, scaleY: spreadHeight, transformOrigin: `${CENTER_X}px ${CURVE_BOTTOM}px` }}>
              <motion.path
                d={areaPath}
                fill="url(#pdf-fill)"
                animate={{ opacity: loading ? [0.45, 0.9, 0.45] : 1 }}
                transition={loading ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.4 }}
              />
              {/* non-scaling-stroke: the group above applies non-uniform scaleX/scaleY, which would
                  otherwise skew this stroke's width unevenly around the curve */}
              <path
                d={linePath}
                fill="none"
                stroke="url(#pdf-stroke)"
                strokeWidth="2"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </motion.g>

            {/* the marker mirrors the curve's wander while thinking but settles faster — locks in first */}
            <motion.g style={{ x: markerX }}>
              <motion.line
                x1={CENTER_X}
                x2={CENTER_X}
                y1={CURVE_BOTTOM}
                y2={CURVE_TOP - 8}
                style={{ stroke: markerColor }}
                strokeWidth="1.5"
                strokeDasharray="2 3"
                opacity={0.9}
              />
              <motion.circle cx={CENTER_X} cy={CURVE_TOP - 8} r="3.5" style={{ fill: markerColor }} />
              {!loading && (
                <motion.circle
                  cx={CENTER_X}
                  cy={CURVE_TOP - 8}
                  r="3.5"
                  fill="none"
                  stroke="#00FF88"
                  strokeWidth="1"
                  initial={{ scale: 1, opacity: 0.7 }}
                  animate={{ scale: 2.4, opacity: 0 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              )}
            </motion.g>

            {/* real market-range axis — true scale, fading out toward the edges since it actually
                extends far beyond this card in both directions. Always visible (not tied to
                loading) - it's the backdrop the spinning ticks below scroll along while thinking. */}
            <line x1="0" y1={GLOBAL_AXIS_Y} x2={WIDTH} y2={GLOBAL_AXIS_Y} stroke="url(#axis-fade)" strokeWidth="1.5" />

            {/* spinning placeholder ticks while thinking — no values, just marks sliding past, like
                the straight-line cross-section of a circular dial that's been given a push. Fades
                out with a delay on resolve so the spin visibly decelerates before it disappears. */}
            <motion.g
              style={{ x: spinX }}
              animate={{ opacity: loading ? 1 : 0 }}
              transition={{ duration: 0.35, delay: loading ? 0 : SPIN_DECEL_DURATION * 0.55 }}
            >
              {SPIN_TICK_XS.map((x) => (
                <line key={x} x1={x} y1={GLOBAL_AXIS_Y - 3} x2={x} y2={GLOBAL_AXIS_Y + 3} stroke="rgba(148,163,184,0.35)" strokeWidth="1" />
              ))}
            </motion.g>

            {/* axis ticks — values extrapolated from the likely range's own known scale. Delayed
                on resolve so they land right as the spin settles, not the instant it starts easing. */}
            {axisTicks.map((tick) => (
              <motion.line
                key={tick.x}
                x1={tick.x}
                y1={GLOBAL_AXIS_Y - 3}
                x2={tick.x}
                y2={GLOBAL_AXIS_Y + 3}
                stroke="rgba(148,163,184,0.45)"
                strokeWidth="1"
                initial={{ opacity: 0 }}
                animate={{ opacity: !loading ? 1 : 0 }}
                transition={{ duration: 0.4, delay: !loading ? BAND_REVEAL_DELAY : 0 }}
              />
            ))}

            {/* likely range (80%) — vibrant, centered on the curve's own marker, scaled to match its
                resolved width. Draws outward from the center instead of a flat fade, landing just
                after the ticks above so it reads as the last piece settling into place. */}
            <motion.g
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: !loading ? 1 : 0, scaleX: !loading ? 1 : 0 }}
              transition={{
                opacity: { duration: 0.3, delay: !loading ? BAND_REVEAL_DELAY + 0.15 : 0 },
                scaleX: { duration: BAND_DRAW_DURATION, delay: !loading ? BAND_REVEAL_DELAY + 0.15 : 0, ease },
              }}
              style={{ transformOrigin: `${CENTER_X}px ${GLOBAL_AXIS_Y}px` }}
            >
              <line x1={axisLeftX} y1={GLOBAL_AXIS_Y} x2={axisRightX} y2={GLOBAL_AXIS_Y} stroke="#00D4FF" strokeWidth="3" strokeLinecap="round" />
              <line x1={axisLeftX} y1={GLOBAL_AXIS_Y - 4} x2={axisLeftX} y2={GLOBAL_AXIS_Y + 4} stroke="#00D4FF" strokeWidth="1.5" />
              <line x1={axisRightX} y1={GLOBAL_AXIS_Y - 4} x2={axisRightX} y2={GLOBAL_AXIS_Y + 4} stroke="#00D4FF" strokeWidth="1.5" />
            </motion.g>
          </g>
        </svg>

        {/* axis tick labels — muted, extrapolated from the likely range's own scale. A tick that
            lands on a negative (unrealistic) price still keeps its mark above, just no label. */}
        {axisTicks
          .filter((tick) => tick.value >= 0)
          .map((tick) => (
            <motion.span
              key={tick.x}
              className="absolute text-[10px] text-slate-500 -translate-x-1/2"
              style={{ left: `${(tick.x / WIDTH) * 100}%`, top: `${bandLabelPct}%` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: !loading ? 1 : 0 }}
              transition={{ duration: 0.4, delay: !loading ? BAND_REVEAL_DELAY : 0 }}
            >
              &euro;{formatK(tick.value)}
            </motion.span>
          ))}

        {/* likely range (80%) labels — vibrant, aligned under the band, landing in step with it */}
        <motion.span
          className="absolute text-[11px] font-semibold -translate-x-1/2"
          style={{ left: `${bandLeftPct}%`, top: `${bandLabelPct}%`, color: '#5FD4FF' }}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: !loading && low !== null ? 1 : 0, y: !loading && low !== null ? 0 : 4 }}
          transition={{ duration: 0.35, delay: !loading ? BAND_REVEAL_DELAY + 0.25 : 0 }}
        >
          {low !== null && <>&euro;{formatK(low)}</>}
        </motion.span>
        <motion.span
          className="absolute text-[11px] font-semibold -translate-x-1/2"
          style={{ left: `${bandRightPct}%`, top: `${bandLabelPct}%`, color: '#5FD4FF' }}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: !loading && high !== null ? 1 : 0, y: !loading && high !== null ? 0 : 4 }}
          transition={{ duration: 0.35, delay: !loading ? BAND_REVEAL_DELAY + 0.25 : 0 }}
        >
          {high !== null && <>&euro;{formatK(high)}</>}
        </motion.span>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.span
            key="thinking"
            className="text-[9px] uppercase tracking-[0.14em] text-slate-600 -mt-1"
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            {CAPTION[lang]}
          </motion.span>
        ) : (
          <motion.span
            key="resolved"
            className="text-[9px] uppercase tracking-[0.14em] text-slate-600 -mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {RANGE_LABEL[lang]}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}
