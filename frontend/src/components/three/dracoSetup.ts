import { useGLTF } from '@react-three/drei'

// Serve the Draco decoder from our own public/ dir instead of drei's default
// (gstatic.com) so decoding a car model doesn't wait on a third-party CDN
// round-trip. Must be imported before any useGLTF/useGLTF.preload call.
useGLTF.setDecoderPath('/draco/')
