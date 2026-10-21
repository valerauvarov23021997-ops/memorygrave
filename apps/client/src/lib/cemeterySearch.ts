import type { BurialPlace, PlacePerson } from '@pamyat/api'
import { normalizeName, rankByName } from '@pamyat/utils'

/** Регистр и «ё» не должны мешать поиску (общее правило — @pamyat/utils). */
export const normalize = normalizeName

/** «1932–2019»: на карте хватает годов, полные даты — на странице памяти. */
export function lifeYears(p: PlacePerson): string {
  const b = p.birthYear ?? (p.birthDate ? Number(p.birthDate.slice(0, 4)) : null)
  const d = p.deathYear ?? (p.deathDate ? Number(p.deathDate.slice(0, 4)) : null)
  if (!b && !d) return ''
  return `${b ?? '?'}–${d ?? '?'}`
}

export interface PlaceSearchResult {
  /** Искали по ФИО (иначе — по номеру места). */
  byName: boolean
  places: BurialPlace[]
  people: { place: BurialPlace; person: PlacePerson }[]
}

/**
 * Поиск на плане кладбища: цифры — номер места, иначе ФИО.
 * Каждое слово запроса — начало какого-то слова в ФИО, порядок любой:
 * «куликова тамара» находит «Куликова Тамара Николаевна», а «ван» — не «Иванова».
 * Совпавшие по фамилии идут первыми: «Иванов» — сначала Ивановы, потом «…Иванович».
 */
export function searchPlaces(places: BurialPlace[], query: string): PlaceSearchResult | null {
  const q = normalize(query)
  if (!q) return null
  if (/^\d+$/.test(q)) {
    const n = Number(q)
    return { byName: false, places: places.filter(p => p.number === n), people: [] }
  }
  const people = rankByName(
    places.flatMap(place => place.people.map(person => ({ place, person }))),
    r => r.person.fullName,
    query
  )
  const found = [...new Map(people.map(r => [r.place.id, r.place])).values()]
  return { byName: true, places: found, people }
}
