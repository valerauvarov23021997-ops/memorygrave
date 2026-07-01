/**
 * Маска российского телефона: «+7 (___) ___-__-__».
 * Работаем с «национальными» 10 цифрами (без ведущей 7).
 */

/** Оставляет только 10 значащих цифр номера (отбрасывает ведущие 7/8). */
export function normalizePhoneDigits(raw: string): string {
  let digits = raw.replace(/\D/g, '')
  if (digits.startsWith('7') || digits.startsWith('8')) digits = digits.slice(1)
  return digits.slice(0, 10)
}

/** 10 цифр → «+7 (912) 345-67-89» (частичный ввод форматируется тоже). */
export function formatPhoneMask(raw: string): string {
  const d = normalizePhoneDigits(raw)
  if (d.length === 0) return ''
  const area = d.slice(0, 3)
  const p1 = d.slice(3, 6)
  const p2 = d.slice(6, 8)
  const p3 = d.slice(8, 10)
  let out = `+7 (${area}`
  if (d.length >= 3) out += ')'
  if (p1) out += ` ${p1}`
  if (p2) out += `-${p2}`
  if (p3) out += `-${p3}`
  return out
}

/** Полный E.164-номер для отправки на бэкенд: «+79123456789». */
export function toE164(raw: string): string {
  const d = normalizePhoneDigits(raw)
  return `+7${d}`
}

/** Готов ли номер к отправке (10 значащих цифр). */
export function isPhoneComplete(raw: string): boolean {
  return normalizePhoneDigits(raw).length === 10
}
