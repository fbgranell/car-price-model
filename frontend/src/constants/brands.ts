

export function displayBrand(brand: string): string {
  if (brand === 'bmw') return 'BMW'
  return brand.charAt(0).toUpperCase() + brand.slice(1)
}
