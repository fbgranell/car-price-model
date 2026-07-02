import type { ReactNode } from 'react'
import type { CarSpecs, CarClass, Fuel, Gearbox } from '../../types/api'
import { displayBrand } from '../../constants/brands'
import summary from '../../summary.json'
import PredictSlider from './PredictSlider'
import PredictChips from './PredictChips'
import PredictPriceCard from './PredictPriceCard'
import InfoTooltip from './InfoTooltip'

// ── Slider bounds from global p1/p99 ─────────────────────────────────────────

const _g = summary.global
const _CY = new Date().getFullYear()
const B = {
  cv:          { min: _g.cv.p1,          max: _g.cv.p99 },
  displac:     { min: _g.displac.p1,     max: _g.displac.p99 },
  n_cylinders: { min: _g.n_cylinders.min, max: _g.n_cylinders.max },
  cmixto:      { min: _g.cmixto.p1,      max: _g.cmixto.p99 },
  gear:        { min: _g.gear.min,        max: _g.gear.max },
  max_sp:      { min: _g.max_sp.p1,      max: _g.max_sp.p99 },
  length:      { min: _g.length.p1,      max: _g.length.p99 },
  width:       { min: _g.width.p1,       max: _g.width.p99 },
  boot:        { min: _g.boot.p1,        max: _g.boot.p99 },
  year:        { min: _CY - _g.age.p99,  max: _CY - _g.age.p1 },
  km:          { min: _g.km.p1,          max: 500 },
}

// ── Icons ────────────────────────────────────────────────────────────────────

function IconCar() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 20 14" fill="none">
      <path d="M4 9h12M2 9l2-5h12l2 5v3H2V9z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="5" cy="12" r="1.5" fill="currentColor" />
      <circle cx="15" cy="12" r="1.5" fill="currentColor" />
    </svg>
  )
}
function IconEngine() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none">
      <rect x="5" y="6" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 6V4M12 6V4M3 10h2M15 10h2M8 15v2M12 15v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
function IconGear() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 3v2M10 15v2M3 10h2M15 10h2M5.05 5.05l1.41 1.41M13.54 13.54l1.41 1.41M5.05 14.95l1.41-1.41M13.54 6.46l1.41-1.41" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
function IconSpeed() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none">
      <path d="M3 13a7 7 0 1 1 14 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M10 13l3-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="10" cy="13" r="1" fill="currentColor" />
    </svg>
  )
}
function IconRuler() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 20 14" fill="none">
      <rect x="1" y="4" width="18" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 4v3M8 4v2M11 4v3M14 4v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
function IconCal() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="4" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 8h16M7 2v4M13 2v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
function IconGlobe() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 2c-2 2.5-3 5-3 8s1 5.5 3 8M10 2c2 2.5 3 5 3 8s-1 5.5-3 8M2 10h16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

// ── Translations ─────────────────────────────────────────────────────────────

export type Lang = 'en' | 'es'

export const T = {
  en: {
    configurator: 'Configurator', vehicleSpecs: 'Vehicle Specs',
    vehicle: 'Vehicle', engine: 'Engine', transmission: 'Transmission',
    performance: 'Performance', dimensions: 'Dimensions', history: 'History',
    class: 'Class', brand: 'Brand', country: 'Country', spain: 'Spain',
    power: 'Power', displacement: 'Displacement', cylinders: 'Cylinders',
    fuelType: 'Fuel type', consumption: 'Consumption', gearbox: 'Gearbox',
    gears: 'Gears', topSpeed: 'Top Speed', length: 'Length', width: 'Width',
    boot: 'Boot', year: 'Year', mileage: 'Mileage', mileageUnit: '× 1,000 km',
    city: 'City', fourx4: '4×4', sport: 'Sport',
    gasoline: 'Gasoline', diesel: 'Diesel', hybrid: 'Hybrid',
    manual: 'Manual', automatic: 'Automatic',
  },
  es: {
    configurator: 'Configurador', vehicleSpecs: 'Especificaciones',
    vehicle: 'Vehículo', engine: 'Motor', transmission: 'Transmisión',
    performance: 'Rendimiento', dimensions: 'Dimensiones', history: 'Historial',
    class: 'Categoría', brand: 'Marca', country: 'País', spain: 'España',
    power: 'Potencia', displacement: 'Cilindrada', cylinders: 'Cilindros',
    fuelType: 'Combustible', consumption: 'Consumo', gearbox: 'Caja',
    gears: 'Marchas', topSpeed: 'Vel. máxima', length: 'Longitud', width: 'Ancho',
    boot: 'Maletero', year: 'Año', mileage: 'Kilometraje', mileageUnit: '× 1.000 km',
    city: 'Turismo', fourx4: '4×4', sport: 'Deportivo',
    gasoline: 'Gasolina', diesel: 'Diésel', hybrid: 'Híbrido',
    manual: 'Manual', automatic: 'Automático',
  },
} satisfies Record<Lang, Record<string, string>>

// ── Tooltips ─────────────────────────────────────────────────────────────────

const TOOLTIPS = {
  class_:      { en: 'Body style: City (compact/sedan), 4×4 (off-road/SUV), Sport (performance).', es: 'Tipo de carrocería: Turismo (compacto/sedán), 4×4 (todoterreno/SUV), Deportivo (deportivo).' },
  brand:       { en: 'Car manufacturer. The model was trained on Spanish market listings.', es: 'Fabricante del coche. El modelo se entrenó con anuncios del mercado español.' },
  fuel:        { en: 'Type of fuel the engine runs on.', es: 'Tipo de combustible que usa el motor.' },
  gearbox:     { en: 'Manual gives more driver control; automatic shifts without a clutch pedal.', es: 'El manual ofrece más control; el automático cambia de marcha sin pedal de embrague.' },
  power:       { en: 'Engine output in horsepower (CV). Higher values deliver stronger acceleration.', es: 'Potencia del motor en CV. Valores más altos ofrecen mayor aceleración.' },
  displacement:{ en: 'Total volume swept by all pistons (cc). Larger displacement usually means more power.', es: 'Volumen total barrido por los pistones (cc). Mayor cilindrada suele implicar más potencia.' },
  cylinders:   { en: 'Number of combustion chambers. More cylinders enable higher power and smoother running.', es: 'Número de cámaras de combustión. Más cilindros permiten mayor potencia y un funcionamiento más suave.' },
  consumption: { en: 'Average litres used per 100 km. Lower means more fuel-efficient.', es: 'Litros medios consumidos cada 100 km. Menor valor indica mayor eficiencia.' },
  gears:       { en: 'Number of forward gear ratios. More gears help use engine power efficiently across speeds.', es: 'Número de relaciones de marcha. Más marchas permiten aprovechar mejor la potencia a distintas velocidades.' },
  topSpeed:    { en: 'Maximum speed the car can reach.', es: 'Velocidad máxima que puede alcanzar el coche.' },
  length:      { en: 'Total length of the car in centimetres, bumper to bumper.', es: 'Longitud total del coche en centímetros, de parachoques a parachoques.' },
  width:       { en: 'Width of the car in centimetres, excluding mirrors.', es: 'Anchura del coche en centímetros, sin incluir los retrovisores.' },
  boot:        { en: 'Boot storage volume in litres.', es: 'Volumen del maletero en litros.' },
  year:        { en: 'Year the car was manufactured.', es: 'Año de primera matriculación del coche.' },
  mileage:     { en: 'Total distance driven, in thousands of kilometres. Higher values indicate more wear.', es: 'Distancia recorrida en miles de kilómetros. Valores más altos indican mayor desgaste.' },
}

// ── Section card ─────────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div
      className="rounded-2xl border p-4"
      style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.022)' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span style={{ color: 'rgba(0,212,255,0.5)' }}>{icon}</span>
        <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-semibold">
          {title}
        </span>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────

interface PredictSpecPanelProps {
  specs: CarSpecs
  onChange: <K extends keyof CarSpecs>(field: K, value: CarSpecs[K]) => void
  price: number | null
  loading: boolean
  error: string | null
  onSubmit: () => void
  onReset: () => void
  lang: Lang
  setLang: (l: Lang) => void
}

export default function PredictSpecPanel({
  specs,
  onChange,
  price,
  loading,
  error,
  onSubmit,
  onReset,
  lang,
  setLang,
}: PredictSpecPanelProps) {
  const t = T[lang]

  const classOpts: { value: CarClass; label: string }[] = [
    { value: 'standard', label: t.city },
    { value: '4x4', label: t.fourx4 },
    { value: 'sport', label: t.sport },
  ]
  const fuelOpts: { value: Fuel; label: string }[] = [
    { value: 'gasoline', label: t.gasoline },
    { value: 'diesel', label: t.diesel },
    { value: 'hybrid', label: t.hybrid },
  ]
  const gearboxOpts: { value: Gearbox; label: string }[] = [
    { value: 'manual', label: t.manual },
    { value: 'automatic', label: t.automatic },
  ]

  return (
    <div className="flex flex-col sm:h-full">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div
        className="shrink-0 px-5 pt-5 pb-4 border-b flex items-end justify-between"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div>
          <p
            className="text-[10px] uppercase tracking-[0.22em] font-semibold mb-0.5"
            style={{ color: 'rgba(0,212,255,0.6)' }}
          >
            {t.configurator}
          </p>
          <h2 className="font-heading text-lg font-bold text-white">{t.vehicleSpecs}</h2>
        </div>

        {/* Language toggle */}
        <div className="flex items-center gap-1.5 mb-0.5">
          <span style={{ color: 'rgba(0,212,255,0.45)' }}><IconGlobe /></span>
          {(['en', 'es'] as Lang[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full transition-all"
              style={
                lang === l
                  ? {
                      background: 'rgba(0,212,255,0.12)',
                      border: '1px solid rgba(0,212,255,0.35)',
                      color: '#00D4FF',
                    }
                  : {
                      background: 'transparent',
                      border: '1px solid transparent',
                      color: 'rgba(100,116,139,0.8)',
                    }
              }
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* ── 2-column spec grid ─────────────────────────────────────── */}
      <div className="sm:flex-1 sm:overflow-y-auto predict-scroll sm:min-h-0 p-4">
        {/* fieldset (not div) so `disabled` natively locks every chip/select/slider inside while
            a request is in flight, with no need to thread a `disabled` prop through each one. */}
        <fieldset
          disabled={loading}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-0 p-0 m-0 min-w-0 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity duration-300"
        >
          {/* ── Left column ────────────────────────────────────────── */}
          <div className="space-y-3">
            {/* Vehicle */}
            <Section title={t.vehicle} icon={<IconCar />}>
              <div className="space-y-2.5">
                <span className="flex items-center gap-2 text-sm text-slate-400">
                  {t.class}<InfoTooltip {...TOOLTIPS.class_} lang={lang} />
                </span>
                <PredictChips
                  options={classOpts}
                  value={specs.class_}
                  onChange={(v) => onChange('class_', v)}
                />
              </div>
              <div className="space-y-1.5">
                <span className="flex items-center gap-2 text-sm text-slate-400">
                  {t.brand}<InfoTooltip {...TOOLTIPS.brand} lang={lang} />
                </span>
                <div className="relative">
                  <select
                    value={specs.brand}
                    onChange={(e) => onChange('brand', e.target.value)}
                    className="w-full rounded-xl px-3 py-2 text-sm text-white appearance-none cursor-pointer focus:outline-none transition-colors pr-8"
                    style={{
                      background: 'rgba(10,22,40,0.7)',
                      border: '1px solid rgba(255,255,255,0.09)',
                    }}
                  >
                    {[...summary.by_class[specs.class_ as keyof typeof summary.by_class].brand.unique].sort((a, b) => a.localeCompare(b)).map((b) => (
                      <option key={b} value={b} className="bg-[#0A1628]">
                        {displayBrand(b)}
                      </option>
                    ))}
                  </select>
                  <svg
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none"
                    viewBox="0 0 12 8"
                    fill="none"
                    style={{ color: 'rgba(100,116,139,1)' }}
                  >
                    <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
              <div className="space-y-1.5">
                <span className="text-xs text-slate-500">{t.country}</span>
                <div
                  className="w-full rounded-xl px-3 py-2 text-sm"
                  style={{
                    background: 'rgba(10,22,40,0.4)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: 'rgba(148,163,184,0.7)',
                  }}
                >
                  {t.spain}
                </div>
              </div>
            </Section>

            {/* Engine */}
            <Section title={t.engine} icon={<IconEngine />}>
              <PredictSlider
                label={t.power}
                unit="CV"
                value={specs.cv}
                min={B.cv.min}
                max={B.cv.max}
                step={1}
                onChange={(v) => onChange('cv', v)}
                perfScale
                tooltip={TOOLTIPS.power}
                lang={lang}
              />
              <PredictSlider
                label={t.displacement}
                unit="cc"
                value={specs.displac}
                min={B.displac.min}
                max={B.displac.max}
                step={50}
                onChange={(v) => onChange('displac', v)}
                perfScale
                tooltip={TOOLTIPS.displacement}
                lang={lang}
              />
              <PredictSlider
                label={t.cylinders}
                value={specs.n_cylinders}
                min={B.n_cylinders.min}
                max={B.n_cylinders.max}
                step={1}
                onChange={(v) => onChange('n_cylinders', v)}
                perfScale
                tooltip={TOOLTIPS.cylinders}
                lang={lang}
              />
              <div className="space-y-2.5">
                <span className="flex items-center gap-2 text-sm text-slate-400">
                  {t.fuelType}<InfoTooltip {...TOOLTIPS.fuel} lang={lang} />
                </span>
                <PredictChips
                  options={fuelOpts}
                  value={specs.fuel}
                  onChange={(v) => onChange('fuel', v)}
                />
              </div>
              <PredictSlider
                label={t.consumption}
                unit="L/100km"
                value={specs.cmixto}
                min={B.cmixto.min}
                max={B.cmixto.max}
                step={0.1}
                onChange={(v) => onChange('cmixto', v)}
                heatScale
                tooltip={TOOLTIPS.consumption}
                lang={lang}
              />
            </Section>
          </div>

          {/* ── Right column ───────────────────────────────────────── */}
          <div className="space-y-3">
            {/* Transmission */}
            <Section title={t.transmission} icon={<IconGear />}>
              <div className="space-y-2.5">
                <span className="flex items-center gap-2 text-sm text-slate-400">
                  {t.gearbox}<InfoTooltip {...TOOLTIPS.gearbox} lang={lang} />
                </span>
                <PredictChips
                  options={gearboxOpts}
                  value={specs.gearbox}
                  onChange={(v) => onChange('gearbox', v)}
                />
              </div>
              <PredictSlider
                label={t.gears}
                value={specs.gear}
                min={B.gear.min}
                max={B.gear.max}
                step={1}
                onChange={(v) => onChange('gear', v)}
                tooltip={TOOLTIPS.gears}
                lang={lang}
              />
            </Section>

            {/* Performance */}
            <Section title={t.performance} icon={<IconSpeed />}>
              <PredictSlider
                label={t.topSpeed}
                unit="km/h"
                value={specs.max_sp}
                min={B.max_sp.min}
                max={B.max_sp.max}
                step={1}
                onChange={(v) => onChange('max_sp', v)}
                perfScale
                tooltip={TOOLTIPS.topSpeed}
                lang={lang}
              />
            </Section>

            {/* Dimensions */}
            <Section title={t.dimensions} icon={<IconRuler />}>
              <PredictSlider
                label={t.length}
                unit="cm"
                value={specs.length}
                min={B.length.min}
                max={B.length.max}
                step={1}
                onChange={(v) => onChange('length', v)}
                tooltip={TOOLTIPS.length}
                lang={lang}
              />
              <PredictSlider
                label={t.width}
                unit="cm"
                value={specs.width}
                min={B.width.min}
                max={B.width.max}
                step={1}
                onChange={(v) => onChange('width', v)}
                tooltip={TOOLTIPS.width}
                lang={lang}
              />
              <PredictSlider
                label={t.boot}
                unit="L"
                value={specs.boot}
                min={B.boot.min}
                max={B.boot.max}
                step={5}
                onChange={(v) => onChange('boot', v)}
                tooltip={TOOLTIPS.boot}
                lang={lang}
              />
            </Section>

            {/* History */}
            <Section title={t.history} icon={<IconCal />}>
              <PredictSlider
                label={t.year}
                value={specs.year}
                min={B.year.min}
                max={B.year.max}
                step={1}
                onChange={(v) => onChange('year', v)}
                heatScale
                invertScale
                tooltip={TOOLTIPS.year}
                lang={lang}
              />
              <PredictSlider
                label={t.mileage}
                unit={t.mileageUnit}
                value={specs.km}
                min={B.km.min}
                max={B.km.max}
                step={1}
                onChange={(v) => onChange('km', v)}
                heatScale
                tooltip={TOOLTIPS.mileage}
                lang={lang}
              />
            </Section>
          </div>
        </fieldset>
      </div>

      {/* Price card */}
      <PredictPriceCard price={price} loading={loading} error={error} onSubmit={onSubmit} onReset={onReset} lang={lang} />
    </div>
  )
}
