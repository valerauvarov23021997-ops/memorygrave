/**
 * Доменные типы приложения «Память».
 * Единый источник правды для клиента, стора и моков.
 */

/** Обёртка ответа REST API (см. docs/API.md). */
export interface ApiResponse<T> {
  data: T
  error: string | null
  meta?: { total: number; page: number; limit: number }
}

/** Статус оцифровки захоронения в реестре. */
export type GraveStatus = 'digitized' | 'moderation' | 'not_digitized'

export interface Coordinates {
  latitude: number
  longitude: number
}

export interface City {
  id: string
  name: string
}

export interface Cemetery {
  id: string
  name: string
  cityId: string
  cityName: string
}

export interface Grave {
  id: string
  fullName: string
  birthDate: string | null
  deathDate: string | null
  cemeteryId: string
  cemeteryName: string
  city: string
  plot: string | null
  biography: string | null
  photos: string[]
  coordinates: Coordinates | null
  status: GraveStatus
  isSaved: boolean
  lastOrder?: OrderSummary | null
}

/** Краткая сводка последнего заказа для карточки могилы. */
export interface OrderSummary {
  id: string
  serviceName: string
  date: string
  rating: number | null
}

export type ServiceCategory = 'quick' | 'major'

export interface Service {
  id: string
  name: string
  description: string
  icon: string
  category: ServiceCategory
  priceFrom: number
  /** Точная цена известна (quick) либо уточняется (major). */
  fixedPrice: boolean
  photos: string[]
}

export type OrderStatus =
  | 'pending'
  | 'assigned'
  | 'on_the_way'
  | 'working'
  | 'completed'
  | 'cancelled'
  | 'refund'

export type RecurringPeriod = 'once' | 'monthly' | 'quarterly'

export interface Executor {
  id: string
  name: string
  ordersCount: number
  rating: number
  avatarUrl: string | null
}

export interface Order {
  id: string
  graveId: string
  graveName: string
  cemeteryName: string
  serviceId: string
  serviceName: string
  serviceIcon: string
  status: OrderStatus
  date: string
  amount: number | null
  notes: string | null
  isRecurring: boolean
  recurringPeriod: RecurringPeriod
  executor: Executor | null
  rating: number | null
  createdAt: string
}

export interface PhotoReport {
  photosBefore: string[]
  photosAfter: string[]
}

/** Запись в книге воспоминаний о человеке. */
export interface Memory {
  id: string
  graveId: string
  authorName: string
  text: string
  createdAt: string
  photos: string[]
}

/** Участник совместного доступа к странице памяти. */
export type MemberRole = 'owner' | 'editor' | 'viewer'

export interface Member {
  id: string
  name: string
  role: MemberRole
  avatarUrl: string | null
}

export type ReminderType = 'birthday' | 'anniversary' | 'custom'

export interface Reminder {
  id: string
  graveId: string
  graveName: string
  cemeteryName: string
  type: ReminderType
  date: string
  label: string
  isEnabled: boolean
  autoOrder: string[]
}

export interface PaymentMethod {
  id: string
  brand: string
  last4: string
  expiry: string
  isDefault: boolean
}

export type SubscriptionPlan = 'basic' | 'standard' | 'premium'

export interface Subscription {
  plan: SubscriptionPlan
  planName: string
  validUntil: string | null
  gravesLimit: number
}

export interface UserProfile {
  id: string
  name: string
  phone: string
  avatarUrl: string | null
  savedGravesCount: number
  subscription: Subscription
}

export interface AuthUser {
  id: string
  phone: string
  name: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

/** Заказ в приложении исполнителя. */
export interface ExecutorOrder {
  id: string
  serviceName: string
  serviceIcon: string
  graveName: string
  cemeteryName: string
  plot: string | null
  address: string
  coordinates: Coordinates | null
  distanceKm: number
  amount: number
  /** Вознаграждение исполнителя в рублях. */
  reward: number
  /** Чек-лист выполнения для данной услуги. */
  executionSteps: string[]
  status: OrderStatus
  date: string
  notes: string | null
}

/** Тип уведомления в центре уведомлений. */
export type NotificationType = 'order' | 'date' | 'candle' | 'system'

/** Запись в центре уведомлений. */
export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  body: string
  createdAt: string
  isRead: boolean
  /** Куда ведёт нажатие: id заказа или захоронения. */
  orderId?: string
  graveId?: string
}

/** Профиль исполнителя со статистикой. */
export interface ExecutorProfile {
  id: string
  name: string
  rating: number
  isOnline: boolean
  totalOrders: number
  monthEarnings: number
  cities: string[]
  services: string[]
}
