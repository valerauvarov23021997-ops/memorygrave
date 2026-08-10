import type { CemeteryMap } from '../types'

import raw from './cemeteryMap.json'

interface RawMap {
  places: { n: number; la: number; lo: number }[]
  paths: { s: string; p: [number, number][] }[]
  plots: [number, number][][]
}

/** Съёмка кладбища д. Даймище (Гатчинский р-н) — 383 места, 267 участков. */
export const cemeteryMapMock: CemeteryMap = {
  places: (raw as RawMap).places.map(p => ({
    id: `dm-${p.n}`,
    number: p.n,
    coordinates: { latitude: p.la, longitude: p.lo },
  })),
  paths: (raw as RawMap).paths.map(r => ({ surface: r.s, polygon: r.p })),
  plots: (raw as RawMap).plots,
}
