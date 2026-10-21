import type { BurialPlace, PlacePerson } from '@pamyat/api'

import { lifeYears, normalize, searchPlaces } from '../cemeterySearch'

function person(fullName: string, extra: Partial<PlacePerson> = {}): PlacePerson {
  return {
    graveId: `dg-${fullName}`,
    fullName,
    birthDate: null,
    deathDate: null,
    birthYear: null,
    deathYear: null,
    ...extra,
  }
}

function place(n: number, people: PlacePerson[] = []): BurialPlace {
  return { id: `dm-${n}`, number: n, coordinates: { latitude: 59.3, longitude: 29.8 }, people }
}

const plan: BurialPlace[] = [
  place(100, [person('Куликова Тамара Николаевна', { birthDate: '1932-08-04', deathDate: '2019-04-28' })]),
  place(176, [person('Тюканов Виктор Дмитриевич'), person('Тюканова Надежда Емельяновна')]),
  place(170, [person('Фёдоров Михаил Егорович', { birthYear: 1927, deathYear: 2016 })]),
  place(28),
]

describe('normalize', () => {
  it('приводит к нижнему регистру и заменяет ё на е', () => {
    expect(normalize('  Фёдоров ')).toBe('федоров')
  })
})

describe('searchPlaces', () => {
  it('пустой запрос — нет поиска', () => {
    expect(searchPlaces(plan, '   ')).toBeNull()
  })

  it('цифры ищут по номеру места', () => {
    const r = searchPlaces(plan, '28')
    expect(r?.byName).toBe(false)
    expect(r?.places.map(p => p.number)).toEqual([28])
  })

  it('фамилия без учёта регистра', () => {
    const r = searchPlaces(plan, 'куликова')
    expect(r?.byName).toBe(true)
    expect(r?.people.map(x => x.person.fullName)).toEqual(['Куликова Тамара Николаевна'])
  })

  it('«е» в запросе находит «ё» в имени', () => {
    expect(searchPlaces(plan, 'федоров')?.places.map(p => p.number)).toEqual([170])
  })

  it('все слова запроса, в любом порядке', () => {
    expect(searchPlaces(plan, 'тамара куликова')?.people).toHaveLength(1)
    expect(searchPlaces(plan, 'куликова виктор')?.people).toHaveLength(0)
  })

  it('двое на одном месте — двое людей, одно место', () => {
    const r = searchPlaces(plan, 'тюканов')
    expect(r?.people).toHaveLength(2)
    expect(r?.places.map(p => p.number)).toEqual([176])
  })

  it('ничего не нашлось — пустой результат, а не null', () => {
    expect(searchPlaces(plan, 'петров')?.places).toEqual([])
  })
})

describe('lifeYears', () => {
  it('годы из полных дат', () => {
    expect(lifeYears(person('x', { birthDate: '1932-08-04', deathDate: '2019-04-28' }))).toBe('1932–2019')
  })
  it('только годы с памятника', () => {
    expect(lifeYears(person('x', { birthYear: 1927, deathYear: 2016 }))).toBe('1927–2016')
  })
  it('неизвестный год — знак вопроса', () => {
    expect(lifeYears(person('x', { deathYear: 2016 }))).toBe('?–2016')
  })
  it('нет дат — пустая строка', () => {
    expect(lifeYears(person('x'))).toBe('')
  })
})
