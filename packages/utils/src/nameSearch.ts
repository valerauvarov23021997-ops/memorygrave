/**
 * Поиск людей по ФИО — одно правило для общего поиска, карты кладбища и моков.
 *
 * Каждое слово запроса должно быть НАЧАЛОМ какого-то слова в ФИО (порядок любой):
 * «куликова тамара» находит «Куликова Тамара Николаевна», «ван» — не «Иванова».
 * Регистр и «ё/е» не важны: на памятниках пишут по-разному.
 */

/** Нижний регистр, «ё» → «е», без лишних пробелов. */
export function normalizeName(s: string): string {
  return s.toLowerCase().replace(/ё/g, 'е').trim()
}

/** Слова запроса без знаков препинания: «Иванов, Пётр» → ['иванов', 'петр']. */
export function queryWords(query: string): string[] {
  return normalizeName(query)
    .split(/[^a-zа-я0-9-]+/i)
    .filter(Boolean)
}

/** Насколько ФИО подходит под запрос: 0 — нет, 1 — по имени/отчеству, 2 — по фамилии. */
export function nameMatchRank(fullName: string, words: string[]): 0 | 1 | 2 {
  if (!words.length) return 0
  const parts = normalizeName(fullName).split(/\s+/)
  if (!words.every(w => parts.some(part => part.startsWith(w)))) return 0
  return words.some(w => parts[0]?.startsWith(w)) ? 2 : 1
}

/**
 * Отбирает подходящих и ставит совпавших по фамилии первыми; внутри групп
 * порядок исходный. «Иванов» — сначала Ивановы, потом «…Иванович».
 */
export function rankByName<T>(items: T[], fullName: (item: T) => string, query: string): T[] {
  const words = queryWords(query)
  const bySurname: T[] = []
  const byOther: T[] = []
  for (const item of items) {
    const rank = nameMatchRank(fullName(item), words)
    if (rank === 2) bySurname.push(item)
    else if (rank === 1) byOther.push(item)
  }
  return [...bySurname, ...byOther]
}
