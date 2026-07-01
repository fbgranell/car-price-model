import type { CarClass } from '../types/api'

/** Folder under /public/models holding the active model set. Switch to 'detailed' once those files are in place. */
const MODEL_SET: 'classic' | 'detailed' = 'detailed'

const MODEL_FILES: Record<CarClass, string> = {
  standard: 'sedan.glb',
  '4x4': 'suv.glb',
  sport: 'sport.glb',
}

const BASE_OFFSET_Y = -0.314

/** Extra vertical nudge per model set/class, added on top of BASE_OFFSET_Y. Tweak here if a model floats or sinks. */
const OFFSET_Y: Record<'classic' | 'detailed', Record<CarClass, number>> = {
  classic: {
    standard: 0,
    '4x4': 0,
    sport: 0,
  },
  detailed: {
    standard: 0.73,
    '4x4': 0,
    sport: 0,
  },
}

/** Facing direction per model set/class: 1 = default, -1 = flipped 180°. Tweak here if a model faces backwards relative to the others. */
const DIRECTION: Record<'classic' | 'detailed', Record<CarClass, 1 | -1>> = {
  classic: {
    standard: 1,
    '4x4': 1,
    sport: 1,
  },
  detailed: {
    standard: -1,
    '4x4': 1,
    sport: 1,
  },
}

export function getCarModelPath(class_: CarClass): string {
  return `/models/${MODEL_SET}/${MODEL_FILES[class_]}`
}

export function getCarModelOffsetY(class_: CarClass): number {
  return BASE_OFFSET_Y + OFFSET_Y[MODEL_SET][class_]
}

export function getCarModelDirection(class_: CarClass): 1 | -1 {
  return DIRECTION[MODEL_SET][class_]
}
