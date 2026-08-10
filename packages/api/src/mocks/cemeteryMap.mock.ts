import type { CemeteryMap } from '../types'

import raw from './cemeteryMap.json'

interface RawMap {
  places: { n: number; la: number; lo: number }[]
  paths: { s: string; p: [number, number][] }[]
  plots: [number, number][][]
}

/** Съёмка кладбища д. Даймище (Гатчинский р-н) — 382 места, 266 участков.
 *  Генерируется скриптом tools/cemetery/export_app.py из съёмки геодезиста. */
export const cemeteryMapMock: CemeteryMap = {
  places: (raw as RawMap).places.map(p => ({
    id: `dm-${p.n}`,
    number: p.n,
    coordinates: { latitude: p.la, longitude: p.lo },
  })),
  paths: (raw as RawMap).paths.map(r => ({ surface: r.s, polygon: r.p })),
  plots: (raw as RawMap).plots,
}
