import type { Cemetery, City } from '../types'

export const citiesMock: City[] = [
  { id: 'msk', name: 'Москва' },
  { id: 'spb', name: 'Санкт-Петербург' },
  { id: 'ekb', name: 'Екатеринбург' },
  { id: 'nsk', name: 'Новосибирск' },
  { id: 'lenobl', name: 'Ленинградская область' },
]

export const cemeteriesMock: Cemetery[] = [
  { id: 'novodevichye', name: 'Новодевичье кладбище', cityId: 'msk', cityName: 'Москва', hasMap: false },
  { id: 'vostryakovskoye', name: 'Востряковское кладбище', cityId: 'msk', cityName: 'Москва', hasMap: false },
  { id: 'khovanskoye', name: 'Хованское кладбище', cityId: 'msk', cityName: 'Москва', hasMap: false },
  { id: 'troyekurovskoye', name: 'Троекуровское кладбище', cityId: 'msk', cityName: 'Москва', hasMap: false },
  { id: 'vagankovskoye', name: 'Ваганьковское кладбище', cityId: 'msk', cityName: 'Москва', hasMap: false },
  { id: 'serafimovskoye', name: 'Серафимовское кладбище', cityId: 'spb', cityName: 'Санкт-Петербург', hasMap: false },
  { id: 'smolenskoye', name: 'Смоленское кладбище', cityId: 'spb', cityName: 'Санкт-Петербург', hasMap: false },
  { id: 'shirokorechenskoye', name: 'Широкореченское кладбище', cityId: 'ekb', cityName: 'Екатеринбург', hasMap: false },
  // единственное реально оцифрованное кладбище — съёмка геодезиста
  { id: 'daymische', name: 'Кладбище д. Даймище', cityId: 'lenobl', cityName: 'Ленинградская область', hasMap: true },
]
