import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PredictPriceDistribution from './PredictPriceDistribution'
import type { Lang } from './PredictSpecPanel'
import summary from '../../summary.json'

interface PredictPriceCardProps {
  price: number | null
  loading: boolean
  error: string | null
  onSubmit: () => void
  onReset: () => void
  lang: Lang
}

const SIGMA = summary.global.sigma
const BAND_Z = 1.2816 // ~80% two-sided confidence band, matches PredictPriceDistribution
const ease = [0.22, 1, 0.36, 1] as [number, number, number, number]

const LABELS = {
  en: { title: 'Estimated Price', estimating: 'Estimating price…', calculating: 'Calculating…', recalc: 'Recalculate →', estimate: 'Estimate Price →', reset: 'Reset' },
  es: { title: 'Precio Estimado', estimating: 'Estimando precio…', calculating: 'Calculando…', recalc: 'Recalcular →', estimate: 'Estimar Precio →', reset: 'Reiniciar' },
} satisfies Record<Lang, Record<string, string>>

export default function PredictPriceCard({ price, loading, error, onSubmit, onReset, lang }: PredictPriceCardProps) {
  const t = LABELS[lang]
  const hasContent = loading || price !== null
  const low = price !== null ? Math.max(0, Math.round(price - BAND_Z * SIGMA)) : null
  const high = price !== null ? Math.round(price + BAND_Z * SIGMA) : null

  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    // The card grows taller once a request starts (label + chart appear above
    // the button), which on mobile pushes that new content below the fold
    // since the button was already at the bottom of the viewport. Scroll it
    // into view so the result is visible without the user hunting for it.
    if (loading) containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [loading])

  return (
    <div ref={containerRef} className="shrink-0 p-4 pt-5 border-t" style={{ borderColor: 'rgba(0,212,255,0.1)' }}>
      <motion.div
        layout
        transition={{ layout: { duration: 0.45, ease } }}
        className="rounded-2xl p-px transition-shadow duration-500"
        style={{
          background: hasContent
            ? 'linear-gradient(135deg,rgba(0,212,255,0.55),rgba(139,92,246,0.4),rgba(0,212,255,0.2))'
            : 'rgba(255,255,255,0.05)',
          boxShadow: hasContent ? '0 0 44px rgba(0,212,255,0.14)' : 'none',
        }}
      >
        <div
          className="relative rounded-[15px] px-5 py-5 space-y-4 flex flex-col items-center text-center"
          style={{ background: 'linear-gradient(180deg,#0A1830 0%,#070D1B 100%)' }}
        >
          {/* Reset button — clears the current estimate (hidden mid-request) */}
          <AnimatePresence>
            {price !== null && !loading && (
              <motion.button
                type="button"
                onClick={onReset}
                aria-label={t.reset}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.2 }}
                className="absolute top-3 right-3 h-6 w-6 flex items-center justify-center rounded-full text-slate-500 hover:text-slate-200 transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Idle state: just the CTA, no empty label/dash taking up space */}
          {hasContent && (
            <>
              {/* Label row */}
              <div className="flex items-center gap-2">
                {loading ? (
                  <svg className="h-3 w-3 animate-spin text-accent/70" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3.5" />
                    <path className="opacity-90" d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                  </svg>
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_6px_#00FF88]" />
                )}
                <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-semibold">
                  {loading ? t.estimating : t.title}
                </span>
              </div>

              {/* Single persistent component: smoothly morphs between thinking and resolved states */}
              <PredictPriceDistribution loading={loading} price={price} low={low} high={high} lang={lang} />
            </>
          )}

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2 w-full">{error}</p>
          )}

          {/* CTA button */}
          <button
            onClick={onSubmit}
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-wait"
            style={{
              background: 'linear-gradient(135deg,#00D4FF,#0088FF)',
              color: '#050A14',
              boxShadow: '0 0 20px rgba(0,212,255,0.25)',
            }}
          >
            {loading ? t.calculating : price !== null ? t.recalc : t.estimate}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
