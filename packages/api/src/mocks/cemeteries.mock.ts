import type { Cemetery, City } from '../types'

export const citiesMock: City[] = [
  { id: 'msk', name: 'Москва' },
  { id: 'spb', name: 'Санкт-Петербург' },
  { id: 'ekb', name: 'Екатеринбург' },
  { id: 'nsk', name: 'Новосибирск' },
]

export const cemeteriesMock: Cemetery[] = [
  { id: 'novodevichye', name: 'Новодевичье кладбище', cityId: 'msk', cityName: 'Москва' },
  { id: 'vostryakovskoye', name: 'Востряковское кладбище', cityId: 'msk', cityName: 'Москва' },
  { id: 'khovanskoye', name: 'Хованское кладбище', cityId: 'msk', cityName: 'Москва' },
  { id: 'troyekurovskoye', name: 'Троекуровское кладбище', cityId: 'msk', cityName: 'Москва' },
  { id: 'vagankovskoye', name: 'Ваганьковское кладбище', cityId: 'msk', cityName: 'Москва' },
  { id: 'serafimovskoye', name: 'Серафимовское кладбище', cityId: 'spb', cityName: 'Санкт-Петербург' },
  { id: 'smolenskoye', name: 'Смоленское кладбище', cityId: 'spb', cityName: 'Санкт-Петербург' },
  { id: 'shirokorechenskoye', name: 'Широкореченское кладбище', cityId: 'ekb', cityName: 'Екатеринбург' },
]
