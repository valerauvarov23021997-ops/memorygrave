import { dateMaskToIso, formatDateMask, isDateMaskComplete, isoToDateMask } from '../dateMask'

describe('formatDateMask', () => {
  it('подставляет точки по мере ввода', () => {
    expect(formatDateMask('1')).toBe('1')
    expect(formatDateMask('12')).toBe('12')
    expect(formatDateMask('123')).toBe('12.3')
    expect(formatDateMask('1205')).toBe('12.05')
    expect(formatDateMask('120519')).toBe('12.05.19')
    expect(formatDateMask('12051938')).toBe('12.05.1938')
  })

  it('игнорирует нецифровые символы и лишние цифры', () => {
    expect(formatDateMask('12.05.1938')).toBe('12.05.1938')
    expect(formatDateMask('12a05b1938c9')).toBe('12.05.1938')
  })
})

describe('isDateMaskComplete', () => {
  it('распознаёт полную и неполную маску', () => {
    expect(isDateMaskComplete('12.05.1938')).toBe(true)
    expect(isDateMaskComplete('12.05.19')).toBe(false)
  })
})

describe('dateMaskToIso', () => {
  it('конвертирует корректную дату', () => {
    expect(dateMaskToIso('12.05.1938')).toBe('1938-05-12')
    expect(dateMaskToIso('01.01.2020')).toBe('2020-01-01')
  })

  it('отклоняет несуществующие и неполные даты', () => {
    expect(dateMaskToIso('31.02.2020')).toBeNull()
    expect(dateMaskToIso('00.10.2020')).toBeNull()
    expect(dateMaskToIso('15.13.2020')).toBeNull()
    expect(dateMaskToIso('12.05.20')).toBeNull()
    expect(dateMaskToIso('12.05.1700')).toBeNull()
  })
})

describe('isoToDateMask', () => {
  it('конвертирует ISO обратно в маску', () => {
    expect(isoToDateMask('1938-05-12')).toBe('12.05.1938')
    expect(isoToDateMask('bad')).toBe('')
  })
})
