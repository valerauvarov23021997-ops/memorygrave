import type { BurialPlace, PlacePerson } from '@pamyat/api'

/** Регистр и «ё» не должны мешать поиску: на памятниках пишут по-разному. */
export function normalize(s: string): string {
  return s.toLowerCase().replace(/ё/g, 'е').trim()
}

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
  const words = q.split(/\s+/)
  const bySurname: PlaceSearchResult['people'] = []
  const byOther: PlaceSearchResult['people'] = []
  for (const place of places) {
    for (const person of place.people) {
      const parts = normalize(person.fullName).split(/\s+/)
      if (!words.every(w => parts.some(part => part.startsWith(w)))) continue
      const surnameHit = words.some(w => parts[0]?.startsWith(w))
      ;(surnameHit ? bySurname : byOther).push({ place, person })
    }
  }
  const people = [...bySurname, ...byOther]
  const found = [...new Map(people.map(r => [r.place.id, r.place])).values()]
  return { byName: true, places: found, people }
}
