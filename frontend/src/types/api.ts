export type Fuel = 'gasoline' | 'diesel' | 'hybrid'
export type Gearbox = 'manual' | 'automatic'
export type CarClass = 'standard' | '4x4' | 'sport'

export interface CarSpecs {
  year: number
  cv: number
  km: number
  fuel: Fuel
  gearbox: Gearbox
  brand: string
  boot: number
  length: number
  width: number
  max_sp: number
  cmixto: number
  displac: number
  gear: number
  class_: CarClass
  n_cylinders: number
}

// NOTE: key is class_ (underscore) — FastAPI Pydantic requires it
export interface PricePrediction {
  predicted_price: number
}
