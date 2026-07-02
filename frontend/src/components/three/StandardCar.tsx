import { useGLTF } from '@react-three/drei'
import { useMemo } from 'react'
import { dampenReflections, fixGlassRendering } from './applyCarMaterials'
import { applyDissolveEffect } from './dissolveEffect'
import { getCarModelPath, getCarModelOffsetY, getCarModelDirection } from '../../constants/carModels'

const MODEL_PATH = getCarModelPath('standard')
const OFFSET_Y = getCarModelOffsetY('standard')
const DIRECTION = getCarModelDirection('standard')

export default function StandardCar({ initialDissolve = 0 }: { initialDissolve?: number }) {
  const { scene } = useGLTF(MODEL_PATH)

  // Material setup runs synchronously here (not in useEffect) so the model is never attached
  // to the scene graph with unpatched materials - avoids a race with the dissolve transition.
  const model = useMemo(() => {
    const clone = scene.clone()
    dampenReflections(clone, { maxMetalness: 0.9, minRoughness: 0.2 })
    fixGlassRendering(clone)
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
