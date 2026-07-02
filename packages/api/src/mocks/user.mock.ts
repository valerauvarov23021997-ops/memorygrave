import type { AuthTokens, PaymentMethod, PlanInfo, UserProfile } from '../types'

const monthAhead = () => {
  const d = new Date()
  d.setMonth(d.getMonth() + 1)
  return d.toISOString().slice(0, 10)
}

export const userProfileMock: UserProfile = {
  id: 'user-1',
  name: 'Валерия Уварова',
  phone: '+7 (912) 345-67-89',
  avatarUrl: null,
  savedGravesCount: 2,
  subscription: {
    plan: 'standard',
    planName: 'Стандарт',
    validUntil: monthAhead(),
    gravesLimit: 3,
  },
}

export const plansMock: PlanInfo[] = [
  {
    id: 'basic',
    name: 'Базовый',
    price: 0,
    periodNote: 'навсегда',
    features: ['Поиск захоронений', 'Разовые заказы и фотоотчёты'],
    featured: false,
  },
  {
    id: 'standard',
    name: 'Стандарт',
    price: 299,
    periodNote: 'в месяц · до 3 захоронений',
    features: ['Всё из базового', 'Напоминания о датах', 'Автозаказ к годовщинам', 'Приоритетные исполнители'],
    featured: true,
  },
  {
    id: 'premium',
    name: 'Премиум',
    price: 699,
    periodNote: 'в месяц · без ограничений',
    features: ['Всё из стандарта', 'Персональный менеджер', 'Скидка 15% на услуги'],
    featured: false,
  },
]

export const paymentMethodsMock: PaymentMethod[] = [
  {
    id: 'pm-1',
    brand: 'МИР',
    last4: '4242',
    expiry: '08/27',
    isDefault: true,
  },
  {
    id: 'pm-2',
    brand: 'Visa',
    last4: '1881',
    expiry: '11/25',
    isDefault: false,
  },
]

export const authTokensMock: AuthTokens = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  user: {
    id: 'user-1',
    phone: '+7 (912) 345-67-89',
    name: 'Валерия Уварова',
  },
}
