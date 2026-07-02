import type { CarClass } from '../../types/api'
import './dracoSetup' // must run before the car imports below, which preload GLTFs on module eval
import StandardCar from './StandardCar'
import FourByFourCar from './FourByFourCar'
import SportCar from './SportCar'

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
