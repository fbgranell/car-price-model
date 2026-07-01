// Shared bell-curve geometry for the price card's distribution visuals
// (resolved estimate + "thinking" state). sigma is a single global constant
// (residual std from training), so the curve's shape never changes —
// only what's plotted on top of it does.

export const WIDTH = 280
export const HEIGHT = 124
export const CURVE_TOP = 14
export const CURVE_BOTTOM = 76
// Single axis row: a muted full market-range (p1–p99) line, with the vibrant likely-range
// drawn as a highlighted segment of that same line (see PredictPriceDistribution).
export const GLOBAL_AXIS_Y = 92
const Z_RANGE = 3.2 // domain shown, in std devs either side of the mean
const BAND_Z = 1.2816 // ~80% two-sided confidence band
export const CENTER_X = WIDTH / 2

const pdf = (z: number) => Math.exp(-(z * z) / 2)
const zToX = (z: number) => ((z + Z_RANGE) / (2 * Z_RANGE)) * WIDTH
const zToY = (z: number) => CURVE_BOTTOM - pdf(z) * (CURVE_BOTTOM - CURVE_TOP)

const CURVE_SAMPLES = 64
export const linePath = Array.from({ length: CURVE_SAMPLES + 1 }, (_, i) => {
  const z = -Z_RANGE + (2 * Z_RANGE * i) / CURVE_SAMPLES
  return `${zToX(z).toFixed(2)},${zToY(z).toFixed(2)}`
}).reduce((d, point, i) => d + (i === 0 ? `M${point}` : ` L${point}`), '')

const BAND_SAMPLES = 40
const bandPoints = Array.from({ length: BAND_SAMPLES + 1 }, (_, i) => {
  const z = -BAND_Z + (2 * BAND_Z * i) / BAND_SAMPLES
  return `${zToX(z).toFixed(2)},${zToY(z).toFixed(2)}`
})
export const bandLeftX = zToX(-BAND_Z)
export const bandRightX = zToX(BAND_Z)
export const areaPath = `M${bandLeftX.toFixed(2)},${CURVE_BOTTOM} L${bandPoints.join(' L')} L${bandRightX.toFixed(2)},${CURVE_BOTTOM} Z`
