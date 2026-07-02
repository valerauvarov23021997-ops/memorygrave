/**
 * Маска ввода дат в формате ДД.ММ.ГГГГ.
 * Пользователь печатает только цифры, точки подставляются сами.
 * Хранение и API — ISO (ГГГГ-ММ-ДД).
 */

/** Приводит произвольный ввод к маске ДД.ММ.ГГГГ (частичной, пока печатают). */
export function formatDateMask(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 8)
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean)
  return parts.join('.')
}

/** Полностью ли заполнена маска. */
export function isDateMaskComplete(masked: string): boolean {
  return /^\d{2}\.\d{2}\.\d{4}$/.test(masked)
}

/**
 * Преобразует ДД.ММ.ГГГГ в ISO ГГГГ-ММ-ДД.
 * Возвращает null, если дата неполная или не существует (например 31.02).
 */
export function dateMaskToIso(masked: string): string | null {
  if (!isDateMaskComplete(masked)) return null
  const parts = masked.split('.').map(Number)
  const dd = parts[0] ?? 0
  const mm = parts[1] ?? 0
  const yyyy = parts[2] ?? 0
  if (yyyy < 1850 || yyyy > 2100 || mm < 1 || mm > 12 || dd < 1 || dd > 31) return null
  const date = new Date(Date.UTC(yyyy, mm - 1, dd))
  // JS «переносит» несуществующие даты (31.02 → 03.03) — отсекаем такие
  if (date.getUTCFullYear() !== yyyy || date.getUTCMonth() !== mm - 1 || date.getUTCDate() !== dd) return null
  return `${String(yyyy).padStart(4, '0')}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`
}

/** Преобразует ISO ГГГГ-ММ-ДД в маску ДД.ММ.ГГГГ (для предзаполнения полей). */
export function isoToDateMask(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!m) return ''
  return `${m[3]}.${m[2]}.${m[1]}`
}
