import { nameMatchRank, normalizeName, queryWords, rankByName } from '../nameSearch'

describe('normalizeName', () => {
  it('нижний регистр и ё → е', () => {
    expect(normalizeName('  Фёдоров ')).toBe('федоров')
  })
})

describe('queryWords', () => {
  it('режет по пробелам и знакам препинания', () => {
    expect(queryWords('Иванов,  Пётр')).toEqual(['иванов', 'петр'])
  })
  it('пустой запрос — пустой список', () => {
    expect(queryWords('   ')).toEqual([])
  })
})

describe('nameMatchRank', () => {
  it('совпадение по фамилии — 2', () => {
    expect(nameMatchRank('Иванов Никита Владимирович', ['иванов'])).toBe(2)
  })
  it('совпадение по отчеству — 1', () => {
    expect(nameMatchRank('Костин Владислав Иванович', ['иванов'])).toBe(1)
  })
  it('середина слова не считается', () => {
    expect(nameMatchRank('Иванова Галина Андреевна', ['ван'])).toBe(0)
  })
  it('все слова, порядок любой', () => {
    expect(nameMatchRank('Куликова Тамара Николаевна', ['тамара', 'кулик'])).toBe(2)
    expect(nameMatchRank('Куликова Тамара Николаевна', ['тамара', 'петр'])).toBe(0)
  })
  it('«е» в запросе находит «ё» в имени', () => {
    expect(nameMatchRank('Фёдоров Михаил Егорович', ['федоров'])).toBe(2)
  })
})

describe('rankByName', () => {
  it('фамилии — первыми, остальные — после, лишние отброшены', () => {
    const names = ['Костин Владислав Иванович', 'Петров Сергей', 'Иванова Галина Андреевна', 'Иванов Никита']
    expect(rankByName(names, n => n, 'иванов')).toEqual([
      'Иванова Галина Андреевна',
      'Иванов Никита',
      'Костин Владислав Иванович',
    ])
  })
})
