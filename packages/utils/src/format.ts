/**
 * Утилиты форматирования. Всё под русскую локаль.
 * Даты храним в ISO (YYYY-MM-DD), показываем в DD.MM.YYYY.
 */

const MONTHS_RU = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
]

/** Форматирует сумму в рублях: 15000 → «15 000 ₽». */
export function formatPrice(amount: number): string {
  return `${amount.toLocaleString('ru-RU')} ₽`
}

/** ISO-дату (2003-11-14) → «14.11.2003». Пустой ввод → пустая строка. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${day}.${month}.${d.getFullYear()}`
}

/** ISO-дату → «2 мая» (день + месяц прописью). */
export function formatDayMonth(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getDate()} ${MONTHS_RU[d.getMonth()]}`
}

/** Диапазон жизни: «02.05.1941 — 14.11.2003 · 62 года». */
export function formatLifespan(birth?: string | null, death?: string | null): string {
  const b = formatDate(birth)
  const d = formatDate(death)
  const years = ageInYears(birth, death)
  const range = [b, d].filter(Boolean).join(' — ')
  if (years === null) return range
  return `${range} · ${pluralYears(years)}`
}

/** Полных лет между двумя датами. null если данных не хватает. */
export function ageInYears(birth?: string | null, death?: string | null): number | null {
  if (!birth || !death) return null
  const b = new Date(birth)
  const d = new Date(death)
  if (Number.isNaN(b.getTime()) || Number.isNaN(d.getTime())) return null
  let age = d.getFullYear() - b.getFullYear()
  const monthDiff = d.getMonth() - b.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && d.getDate() < b.getDate())) age--
  return age
}

/** Русское склонение «год/года/лет». */
export function pluralYears(n: number): string {
  return `${n} ${plural(n, 'год', 'года', 'лет')}`
}

/** Русское склонение «день/дня/дней». */
export function pluralDays(n: number): string {
  return `${n} ${plural(n, 'день', 'дня', 'дней')}`
}

/** Русское склонение «заказ/заказа/заказов». */
export function pluralOrders(n: number): string {
  return `${n} ${plural(n, 'заказ', 'заказа', 'заказов')}`
}

/** Русское склонение «результат/результата/результатов». */
export function pluralResults(n: number): string {
  return `${n} ${plural(n, 'результат', 'результата', 'результатов')}`
}

/** Выбор формы слова по числу (одна/несколько/много). */
export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
  return many
}

/** Сколько дней осталось до следующей годовщины даты (по дню и месяцу). */
export function daysUntilAnnual(iso: string, from: Date = new Date()): number {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 0
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  let next = new Date(today.getFullYear(), d.getMonth(), d.getDate())
  if (next < today) next = new Date(today.getFullYear() + 1, d.getMonth(), d.getDate())
  const ms = next.getTime() - today.getTime()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

/** Инициалы из ФИО: «Иванов Иван Петрович» → «ИИ». */
export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return (parts[0]![0] ?? '?').toUpperCase()
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase()
}
