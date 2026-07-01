import {
  ageInYears,
  daysUntilAnnual,
  formatDate,
  formatLifespan,
  formatPrice,
  initials,
  plural,
} from '../format'

describe('formatPrice', () => {
  it('форматирует рубли с разделителем тысяч', () => {
    expect(formatPrice(15000)).toBe('15 000 ₽')
    expect(formatPrice(800)).toBe('800 ₽')
  })
})

describe('formatDate', () => {
  it('ISO → DD.MM.YYYY', () => {
    expect(formatDate('2003-11-14')).toBe('14.11.2003')
  })
  it('пустой ввод → пустая строка', () => {
    expect(formatDate(null)).toBe('')
    expect(formatDate(undefined)).toBe('')
    expect(formatDate('не дата')).toBe('')
  })
})

describe('ageInYears', () => {
  it('считает полные годы', () => {
    expect(ageInYears('1941-05-02', '2003-11-14')).toBe(62)
  })
  it('учитывает недоживший до дня рождения год', () => {
    expect(ageInYears('1941-12-31', '2003-01-01')).toBe(61)
  })
  it('null при неполных данных', () => {
    expect(ageInYears('1941-05-02', null)).toBeNull()
  })
})

describe('formatLifespan', () => {
  it('собирает диапазон с возрастом', () => {
    expect(formatLifespan('1941-05-02', '2003-11-14')).toBe('02.05.1941 — 14.11.2003 · 62 года')
  })
})

describe('plural', () => {
  it('склоняет по-русски', () => {
    expect(plural(1, 'год', 'года', 'лет')).toBe('год')
    expect(plural(2, 'год', 'года', 'лет')).toBe('года')
    expect(plural(5, 'год', 'года', 'лет')).toBe('лет')
    expect(plural(11, 'год', 'года', 'лет')).toBe('лет')
    expect(plural(21, 'год', 'года', 'лет')).toBe('год')
  })
})

describe('daysUntilAnnual', () => {
  it('считает дни до следующей годовщины', () => {
    const from = new Date(2025, 0, 1) // 1 января 2025
    expect(daysUntilAnnual('1990-01-11', from)).toBe(10)
  })
  it('переносит на следующий год если дата уже прошла', () => {
    const from = new Date(2025, 5, 1) // 1 июня 2025
    expect(daysUntilAnnual('1990-05-02', from)).toBeGreaterThan(300)
  })
})

describe('initials', () => {
  it('берёт две первые буквы ФИО', () => {
    expect(initials('Иванов Иван Петрович')).toBe('ИИ')
    expect(initials('Мария')).toBe('М')
  })
})
