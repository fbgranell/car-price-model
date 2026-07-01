import { useState, useEffect } from 'react'
import InfoTooltip from './InfoTooltip'

interface InfoText { en: string; es: string }

interface PredictSliderProps {
  label: string
  unit?: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  heatScale?: boolean
  perfScale?: boolean
  invertScale?: boolean
  tooltip?: InfoText
  lang?: 'en' | 'es'
}

function perfColor(pct: number): string {
  // 0% = blue, 50% = cyan, 100% = purple — mirrors the scene lighting
  const blue:   [number, number, number] = [0,   136, 255]
  const cyan:   [number, number, number] = [0,   212, 255]
  const purple: [number, number, number] = [139,  92, 246]
  const [from, to, t] = pct <= 50
    ? [blue,  cyan,   pct / 50]
    : [cyan,  purple, (pct - 50) / 50]
  const lerp = (x: number, y: number) => Math.round(x + (y - x) * t)
  return `rgb(${lerp(from[0], to[0])},${lerp(from[1], to[1])},${lerp(from[2], to[2])})`
}

function heatColor(pct: number): string {
  // 0% = green, 50% = amber, 100% = red
  const green: [number, number, number] = [34, 197, 94]
  const amber: [number, number, number] = [245, 158, 11]
  const red:   [number, number, number] = [239, 68,  68]
  const [from, to, t] = pct <= 50
    ? [green, amber, pct / 50]
    : [amber, red,   (pct - 50) / 50]
  const lerp = (x: number, y: number) => Math.round(x + (y - x) * t)
  return `rgb(${lerp(from[0], to[0])},${lerp(from[1], to[1])},${lerp(from[2], to[2])})`
}

export default function PredictSlider({ label, unit, value, min, max, step, onChange, heatScale, perfScale, invertScale, tooltip, lang }: PredictSliderProps) {
  const [local, setLocal] = useState(value)

  // Keep in sync if parent resets the value (e.g. loading a preset)
  useEffect(() => { setLocal(value) }, [value])

  const pct = ((local - min) / (max - min)) * 100
  const colorPct = invertScale ? 100 - pct : pct
  const display = step < 1 ? local.toFixed(1) : local.toLocaleString('es-ES')

  const fillColor = heatScale ? heatColor(colorPct) : perfScale ? perfColor(colorPct) : '#00D4FF'
  const labelColor = heatScale ? heatColor(colorPct) : perfScale ? perfColor(colorPct) : 'white'
  const thumbVars = perfScale
    ? { '--thumb-color': 'white', '--thumb-glow': 'rgba(255,255,255,0.35)' } as React.CSSProperties
    : {}

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline">
        <span className="flex items-center gap-2 text-sm text-slate-400">
            {label}
            {tooltip && <InfoTooltip en={tooltip.en} es={tooltip.es} lang={lang} />}
          </span>
        <span
          className="text-sm font-semibold tabular-nums"
          style={{ color: labelColor }}
        >
          {display}
          {unit && <span className="text-xs font-normal text-slate-500 ml-1">{unit}</span>}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={local}
        onChange={(e) => setLocal(Number(e.target.value))}
        onPointerUp={(e) => onChange(Number((e.target as HTMLInputElement).value))}
        className="predict-slider w-full"
        style={{
          background: `linear-gradient(to right, ${fillColor} ${pct}%, rgba(255,255,255,0.09) ${pct}%)`,
          ...thumbVars,
        }}
      />
    </div>
  )
}
