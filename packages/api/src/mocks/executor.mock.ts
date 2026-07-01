import type { ExecutorOrder, ExecutorProfile } from '../types'

const CLEANING_STEPS = ['Убрать мусор и листву', 'Протереть памятник', 'Покосить траву', 'Помыть ограду']
const FLOWERS_STEPS = ['Убрать увядшие цветы', 'Возложить свежие цветы']

export const executorOrdersMock: ExecutorOrder[] = [
  {
    id: 'eo-1',
    serviceName: 'Уборка могилы',
    serviceIcon: 'Broom',
    graveName: 'Соколова Мария Ивановна',
    cemeteryName: 'Новодевичье кладбище',
    plot: 'уч. 14, ряд 3',
    address: 'Москва, Лужнецкий пр., 2',
    coordinates: { latitude: 55.724, longitude: 37.5567 },
    distanceKm: 3.4,
    amount: 800,
    reward: 560,
    executionSteps: CLEANING_STEPS,
    status: 'assigned',
    date: '2025-07-05',
    notes: null,
  },
  {
    id: 'eo-2',
    serviceName: 'Цветы и венки',
    serviceIcon: 'Flower',
    graveName: 'Соколов Пётр Андреевич',
    cemeteryName: 'Новодевичье кладбище',
    plot: 'уч. 14, ряд 3',
    address: 'Москва, Лужнецкий пр., 2',
    coordinates: { latitude: 55.7239, longitude: 37.5566 },
    distanceKm: 3.4,
    amount: 500,
    reward: 350,
    executionSteps: FLOWERS_STEPS,
    status: 'on_the_way',
    date: '2025-07-02',
    notes: 'Красные гвоздики, чётное количество',
  },
  {
    id: 'eo-3',
    serviceName: 'Уборка могилы',
    serviceIcon: 'Broom',
    graveName: 'Кузнецов Николай Сергеевич',
    cemeteryName: 'Троекуровское кладбище',
    plot: 'уч. 7, ряд 12',
    address: 'Москва, Рябиновая ул., 24',
    coordinates: { latitude: 55.6812, longitude: 37.4123 },
    distanceKm: 8.1,
    amount: 800,
    reward: 560,
    executionSteps: CLEANING_STEPS,
    status: 'assigned',
    date: '2025-07-06',
    notes: 'Убрать сухие венки',
  },
]

export const executorProfileMock: ExecutorProfile = {
  id: 'exec-1',
  name: 'Сергей Морозов',
  rating: 4.9,
  isOnline: true,
  totalOrders: 214,
  monthEarnings: 48600,
  cities: ['Москва'],
  services: ['Уборка могилы', 'Цветы и венки', 'Свечи и лампадки'],
}
