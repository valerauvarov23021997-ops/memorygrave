import type { Grave } from '@pamyat/api'
import { formatDate } from '@pamyat/utils'

/** Подпись под именем в списках: годы жизни · кладбище · участок. */
export function graveMeta(grave: Grave): string {
  const years = [formatDate(grave.birthDate), formatDate(grave.deathDate)].filter(Boolean).join(' – ')
  return [years, grave.cemeteryName, grave.plot].filter(Boolean).join(' · ')
}

/** Положение строки в группе для GroupedRow по индексу списка. */
export function groupedPosition(index: number, total: number): 'first' | 'middle' | 'last' | 'single' {
  if (total <= 1) return 'single'
  if (index === 0) return 'first'
  if (index === total - 1) return 'last'
  return 'middle'
}
