/** Валидация форм. Возвращают null если ок, иначе текст ошибки (ru). */

/** Телефон должен содержать ровно 11 цифр (нормализованный, с 7 в начале). */
export function validatePhone(digits: string): string | null {
  const clean = digits.replace(/\D/g, '')
  if (clean.length !== 11) return 'Введите корректный номер телефона'
  return null
}

/** SMS-код — ровно 6 цифр. */
export function validateSmsCode(code: string): string | null {
  if (!/^\d{6}$/.test(code)) return 'Код состоит из 6 цифр'
  return null
}

/** Обязательное непустое поле. */
export function validateRequired(value: string, field = 'Поле'): string | null {
  if (!value || value.trim().length === 0) return `${field} обязательно для заполнения`
  return null
}

/** ФИО: минимум два слова. */
export function validateFullName(value: string): string | null {
  const parts = value.trim().split(/\s+/).filter(Boolean)
  if (parts.length < 2) return 'Укажите фамилию и имя'
  return null
}

/** Email (простой RFC-совместимый паттерн). Пустой ввод допустим. */
export function validateEmail(value: string): string | null {
  if (!value) return null
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Некорректный email'
  return null
}
