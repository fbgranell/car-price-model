import { lazy } from 'react'
import type { CarClass } from '../../types/api'
import './dracoSetup' // must run before any useGLTF call in the lazy-loaded car components below

// Dynamically imported per class so picking one car class's GLB doesn't pull the other two in -
// each of these modules calls useGLTF(MODEL_PATH), which only fires once its module is evaluated.
const StandardCar = lazy(() => import('./StandardCar'))
const FourByFourCar = lazy(() => import('./FourByFourCar'))
const SportCar = lazy(() => import('./SportCar'))

export default function CarModel({ class_, initialDissolve }: { class_: CarClass; initialDissolve?: number }) {
  switch (class_) {
    case '4x4':
      return <FourByFourCar initialDissolve={initialDissolve} />
    case 'sport':
      return <SportCar initialDissolve={initialDissolve} />
    case 'standard':
    default:
      return <StandardCar initialDissolve={initialDissolve} />
  }
}
