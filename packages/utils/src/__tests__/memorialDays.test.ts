import { daysUntilIso, memorialDaysForYear, nextMemorialDay, orthodoxEaster } from '../memorialDays'

const iso = (d: Date) => d.toISOString().slice(0, 10)

describe('orthodoxEaster', () => {
  it('совпадает с известными датами православной Пасхи', () => {
    expect(iso(orthodoxEaster(2024))).toBe('2024-05-05')
    expect(iso(orthodoxEaster(2025))).toBe('2025-04-20')
    expect(iso(orthodoxEaster(2026))).toBe('2026-04-12')
    expect(iso(orthodoxEaster(2027))).toBe('2027-05-02')
  })
})

describe('memorialDaysForYear', () => {
  it('считает Радоницу (9-й день после Пасхи)', () => {
    const days = memorialDaysForYear(2026)
    expect(days.find(d => d.name === 'Радоница')?.date).toBe('2026-04-21')
  })

  it('считает Троицкую субботу (48-й день после Пасхи)', () => {
    const days = memorialDaysForYear(2025)
    expect(days.find(d => d.name.startsWith('Троицкая'))?.date).toBe('2025-06-07')
  })

  it('считает Дмитриевскую субботу (суббота перед 8 ноября)', () => {
    // 8 ноября 2026 — воскресенье → суббота 7 ноября
    const days2026 = memorialDaysForYear(2026)
    expect(days2026.find(d => d.name.startsWith('Дмитриевская'))?.date).toBe('2026-11-07')
    // 8 ноября 2025 — суббота → предыдущая суббота 1 ноября
    const days2025 = memorialDaysForYear(2025)
    expect(days2025.find(d => d.name.startsWith('Дмитриевская'))?.date).toBe('2025-11-01')
  })

  it('возвращает 4 даты по возрастанию', () => {
    const days = memorialDaysForYear(2026)
    expect(days).toHaveLength(4)
    expect([...days.map(d => d.date)].sort()).toEqual(days.map(d => d.date))
  })
})

describe('nextMemorialDay', () => {
  it('находит ближайший день, включая сегодня', () => {
    expect(nextMemorialDay(new Date('2026-04-21T10:00:00')).date).toBe('2026-04-21')
    expect(nextMemorialDay(new Date('2026-04-22T10:00:00')).date).toBe('2026-05-30')
  })

  it('переходит через границу года', () => {
    const next = nextMemorialDay(new Date('2026-12-01T10:00:00'))
    expect(next.date.startsWith('2027')).toBe(true)
  })
})

describe('daysUntilIso', () => {
  it('считает дни до даты', () => {
    expect(daysUntilIso('2026-07-05', new Date('2026-07-02T23:00:00'))).toBe(3)
    expect(daysUntilIso('2026-07-02', new Date('2026-07-02T01:00:00'))).toBe(0)
  })
})
