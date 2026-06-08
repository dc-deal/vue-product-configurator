import type { Configuration } from '../data/types'
import { machineToolXr } from '../data/fixtures'

// Stub. v1: returns fixtures wrapped in a Promise.
// v2: replaced by fetch('/api/products/…') without touching store or UI
// (concept §3.3 service layer rationale).
export interface ProductService {
  loadConfiguration(product: string): Promise<Configuration>
}

export const productService: ProductService = {
  async loadConfiguration(product: string): Promise<Configuration> {
    if (product === 'machine-tool-xr') {
      return machineToolXr
    }
    throw new Error(`Unknown product: ${product}`)
  },
}
