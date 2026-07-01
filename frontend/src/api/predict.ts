import type { CarSpecs, PricePrediction } from '../types/api'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:8000'

export async function fetchPrediction(specs: CarSpecs): Promise<PricePrediction> {
  const res = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(specs),
  })

  if (!res.ok) {
    let detail = `Request failed with status ${res.status}`
    try {
      const body = await res.json()
      if (body?.detail) detail = JSON.stringify(body.detail)
    } catch {
      // ignore parse errors, keep default message
    }
    throw new Error(detail)
  }

  return (await res.json()) as PricePrediction
}
