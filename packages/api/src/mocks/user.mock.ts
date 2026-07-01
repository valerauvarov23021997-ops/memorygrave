import type { AuthTokens, PaymentMethod, UserProfile } from '../types'

export const userProfileMock: UserProfile = {
  id: 'user-1',
  name: 'Валерия Уварова',
  phone: '+7 (912) 345-67-89',
  avatarUrl: null,
  savedGravesCount: 2,
  subscription: {
    plan: 'standard',
    planName: 'Стандарт',
    validUntil: '2025-06-15',
    gravesLimit: 3,
  },
}

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
