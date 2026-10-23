import { formatPhoneMask, isPhoneComplete, normalizePhoneDigits, toE164 } from '../phone'

describe('normalizePhoneDigits', () => {
  it('отбрасывает ведущую 7 или 8', () => {
    expect(normalizePhoneDigits('79123456789')).toBe('9123456789')
    expect(normalizePhoneDigits('89123456789')).toBe('9123456789')
    expect(normalizePhoneDigits('9123456789')).toBe('9123456789')
  })
})

describe('formatPhoneMask', () => {
  it('форматирует полный номер', () => {
    expect(formatPhoneMask('9123456789')).toBe('+7 (912) 345-67-89')
  })
  it('форматирует частичный ввод', () => {
    expect(formatPhoneMask('912')).toBe('+7 (912)')
    expect(formatPhoneMask('91234')).toBe('+7 (912) 34')
  })
})

describe('toE164', () => {
  it('собирает E.164', () => {
    expect(toE164('9123456789')).toBe('+79123456789')
  })
})

describe('isPhoneComplete', () => {
  it('true только при 10 цифрах', () => {
    expect(isPhoneComplete('9123456789')).toBe(true)
    expect(isPhoneComplete('912345')).toBe(false)
  })
})
