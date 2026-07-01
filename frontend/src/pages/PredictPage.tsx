import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import type { CarSpecs, CarClass, Fuel, Gearbox } from '../types/api'
import { fetchPrediction } from '../api/predict'
import PredictCarScene from '../components/predict/PredictCarScene'
import PredictSpecPanel, { T, type Lang } from '../components/predict/PredictSpecPanel'
import { displayBrand } from '../constants/brands'
import summary from '../summary.json'

type ClassKey = keyof typeof summary.by_class
type BrandData = typeof summary.by_brand.standard.peugeot

function brandDefaults(brand: string, class_: CarClass): Partial<CarSpecs> {
  const classKey = class_ as ClassKey
  const brandData = (summary.by_brand[classKey] as Record<string, BrandData>)?.[brand]
  const classStats = summary.by_class[classKey]

  if (!brandData) return { brand, class_: class_ }

  return {
    brand,
    class_: class_,
    // year and km always come from by_class, not by_brand
    year: new Date().getFullYear() - classStats.age.median,
    km: classStats.km.median,
    // rest from by_brand[class][brand]
    cv: brandData.cv.median,
    boot: brandData.boot.median,
    length: brandData.length.median,
    width: brandData.width.median,
    max_sp: brandData.max_sp.median,
    cmixto: brandData.cmixto.median,
    displac: brandData.displac.median,
    gear: brandData.gear.median,
    n_cylinders: brandData.n_cylinders.median,
    fuel: brandData.fuel.mode as Fuel,
    gearbox: brandData.gearbox.mode as Gearbox,
  }
}

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number]
const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease },
})

const DEFAULT_CLASS: CarClass = 'standard'
const DEFAULT_BRAND = summary.by_class[DEFAULT_CLASS].brand.mode
const INITIAL_SPECS: CarSpecs = {
  class_: DEFAULT_CLASS,
  brand: DEFAULT_BRAND,
  year: 2021,
  km: 79,
  fuel: 'diesel',
  gearbox: 'manual',
  cv: 115,
  boot: 380,
  length: 430,
  width: 180,
  max_sp: 190,
  cmixto: 5,
  displac: 1499,
  gear: 6,
  n_cylinders: 4,
  ...brandDefaults(DEFAULT_BRAND, DEFAULT_CLASS),
}

export default function PredictPage() {
  const [specs, setSpecs] = useState<CarSpecs>(INITIAL_SPECS)
  const [price, setPrice] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lang, setLang] = useState<Lang>('en')

  const handleChange = useCallback(<K extends keyof CarSpecs>(field: K, value: CarSpecs[K]) => {
    if (field === 'class_') {
      const newClass = value as CarClass
      const modeBrand = summary.by_class[newClass as ClassKey].brand.mode
      setSpecs((prev) => ({ ...prev, ...brandDefaults(modeBrand, newClass) }))
    } else if (field === 'brand') {
      setSpecs((prev) => ({ ...prev, ...brandDefaults(value as string, prev.class_) }))
    } else {
      setSpecs((prev) => ({ ...prev, [field]: value }))
    }
    setPrice(null)
    setError(null)
  }, [])

  const handleSubmit = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      // Force a minimum "thinking" duration so the distribution animation is
      // actually visible even when the API responds near-instantly.
      const MIN_THINKING_MS = 3500
      const delay = new Promise((resolve) => setTimeout(resolve, MIN_THINKING_MS))
      const [result] = await Promise.all([fetchPrediction(specs), delay])
      setPrice(result.predicted_price)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Prediction failed')
    } finally {
      setLoading(false)
    }
  }, [specs])

  const handleReset = useCallback(() => {
    setPrice(null)
    setError(null)
  }, [])

  return (
    /*
     * Mobile:  normal page flow — car fixed height, spec panel grows with content.
     * Desktop: locked to viewport — car and spec panel share the full screen height.
     */
    <motion.div
      className="flex flex-col sm:h-screen sm:overflow-hidden"
      exit={{ opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } }}
    >
      {/* spacer for fixed navbar */}
      <div className="h-16 shrink-0" />

      <div className="flex flex-col sm:flex-row sm:flex-1 sm:min-h-0">
        {/* ── Car viewer ──────────────────────────────────────────── */}
        <motion.div {...rise(0)} className="relative h-64 sm:h-auto sm:flex-none sm:w-[42%]">
          <PredictCarScene class_={specs.class_} />

          {/* Right-edge blend into spec panel (desktop only) */}

          <div
            className="absolute inset-y-0 right-0 w-12 pointer-events-none hidden sm:block"
            style={{ background: 'linear-gradient(to right, transparent, #060D1A)' }}
          />

          {/* Car summary pill */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none w-max">
            <div
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm backdrop-blur-sm"
              style={{
                background: 'rgba(5,10,20,0.65)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <span className="text-white font-medium">{displayBrand(specs.brand)}</span>
              <span className="text-slate-600">·</span>
              <span style={{ color: '#00D4FF' }}>
                {specs.class_ === 'standard' ? T[lang].city : specs.class_ === '4x4' ? T[lang].fourx4 : T[lang].sport}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400 capitalize">
                {specs.fuel === 'gasoline' ? T[lang].gasoline : specs.fuel === 'diesel' ? T[lang].diesel : T[lang].hybrid}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">{specs.year}</span>
            </div>
          </div>

        </motion.div>

        {/* ── Spec configurator ───────────────────────────────────── */}
        <motion.div
          {...rise(0.12)}
          className="sm:flex-1 sm:min-w-0 border-t sm:border-t-0 sm:border-l flex flex-col sm:h-full"
          style={{
            borderColor: 'rgba(255,255,255,0.05)',
            background: 'linear-gradient(180deg,#060D1A 0%,#050A14 100%)',
          }}
        >
          <PredictSpecPanel
            specs={specs}
            onChange={handleChange}
            price={price}
            loading={loading}
            error={error}
            onSubmit={handleSubmit}
            onReset={handleReset}
            lang={lang}
            setLang={setLang}
          />
        </motion.div>
      </div>
    </motion.div>
  )
}
