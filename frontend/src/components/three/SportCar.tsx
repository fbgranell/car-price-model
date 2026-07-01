import { useGLTF } from '@react-three/drei'
import { useMemo } from 'react'
import { applyCarMaterials, applyOutlines, dampenReflections } from './applyCarMaterials'
import { applyDissolveEffect } from './dissolveEffect'
import { getCarModelPath, getCarModelOffsetY, getCarModelDirection } from '../../constants/carModels'

const MODEL_PATH = getCarModelPath('sport')
const OFFSET_Y = getCarModelOffsetY('sport')
const DIRECTION = getCarModelDirection('sport')

export default function SportCar({ initialDissolve = 0 }: { initialDissolve?: number }) {
  const { scene } = useGLTF(MODEL_PATH)

  // Material setup runs synchronously here (not in useEffect) so the model is never attached
  // to the scene graph with unpatched materials - avoids a race with the dissolve transition.
  const model = useMemo(() => {
    const clone = scene.clone()
    applyCarMaterials(clone, '#1c1f22')
    applyOutlines(clone, 0.0)
    dampenReflections(clone, { maxMetalness: 0.9, minRoughness: 0.12 })
    applyDissolveEffect(clone, '#00D4FF', initialDissolve)
    return clone
  }, [scene])

  return (
    <primitive
      object={model}
      rotation={[0, (-Math.PI / 2) * DIRECTION, 0]}
      position={[0, OFFSET_Y, 0]}
    />
  )
}

useGLTF.preload(MODEL_PATH)
