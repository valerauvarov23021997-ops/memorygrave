/**
 * Православные дни поминовения — главные даты посещения кладбищ в России.
 * Считаются от Пасхи (алгоритм Меёуса для юлианской пасхалии),
 * поэтому работают для любого года без справочников.
 */

export interface MemorialDay {
  /** ISO-дата ГГГГ-ММ-ДД. */
  date: string
  /** Название дня. */
  name: string
  /** Короткое пояснение для карточки. */
  hint: string
}

/** Православная Пасха по григорианскому календарю (верно для 1900–2099). */
export function orthodoxEaster(year: number): Date {
  const a = year % 4
  const b = year % 7
  const c = year % 19
  const d = (19 * c + 15) % 30
  const e = (2 * a + 4 * b - d + 34) % 7
  const month = Math.floor((d + e + 114) / 31) // 3 = март, 4 = апрель (юлианский)
  const day = ((d + e + 114) % 31) + 1
  // Юлианская дата → григорианская: +13 дней в 1900–2099
  return new Date(Date.UTC(year, month - 1, day + 13))
}

const iso = (d: Date) => d.toISOString().slice(0, 10)

const addDays = (d: Date, n: number) => {
  const copy = new Date(d)
  copy.setUTCDate(copy.getUTCDate() + n)
  return copy
}

/** Суббота, предшествующая дате (если дата сама суббота — берётся предыдущая). */
const saturdayBefore = (d: Date) => {
  const back = ((d.getUTCDay() + 1) % 7) || 7
  return addDays(d, -back)
}

/** Все дни поминовения указанного года, по возрастанию даты. */
export function memorialDaysForYear(year: number): MemorialDay[] {
  const easter = orthodoxEaster(year)
  const days: MemorialDay[] = [
    {
      date: iso(addDays(easter, -57)),
      name: 'Вселенская родительская суббота',
      hint: 'Мясопустная — день всеобщего поминовения',
    },
    {
      date: iso(addDays(easter, 9)),
      name: 'Радоница',
      hint: 'Главный день поминовения усопших',
    },
    {
      date: iso(addDays(easter, 48)),
      name: 'Троицкая родительская суббота',
      hint: 'Поминовение накануне Троицы',
    },
    {
      date: iso(saturdayBefore(new Date(Date.UTC(year, 10, 8)))),
      name: 'Дмитриевская родительская суббота',
      hint: 'Осенний день поминовения',
    },
  ]
  return days.sort((x, y) => x.date.localeCompare(y.date))
}

/** Ближайший день поминовения начиная с даты from (включительно). */
export function nextMemorialDay(from: Date = new Date()): MemorialDay {
  const fromIso = iso(new Date(Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())))
  const year = from.getFullYear()
  const candidates = [...memorialDaysForYear(year), ...memorialDaysForYear(year + 1)]
  return candidates.find(d => d.date >= fromIso) ?? candidates[candidates.length - 1]!
}

/** Дней до даты ISO начиная с from (0 = сегодня). */
export function daysUntilIso(dateIso: string, from: Date = new Date()): number {
  const target = new Date(`${dateIso}T00:00:00Z`).getTime()
  const start = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())
  return Math.round((target - start) / 86_400_000)
}
