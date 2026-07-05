/**
 * API-слой приложения. Каждый метод сам решает: мок или сеть.
 * UI и стор работают только с этими функциями, не с axios напрямую.
 */
import client, { unwrap } from './client'
import { config, mockDelay } from './config'
import * as sb from './supabase/api'
import {
  authTokensMock,
  cemeteriesMock,
  citiesMock,
  executorOrdersMock,
  executorProfileMock,
  gravesMock,
  membersMock,
  memoriesMock,
  notificationsMock,
  ordersMock,
  paymentMethodsMock,
  plansMock,
  remindersMock,
  reportsMock,
  servicesMock,
  userProfileMock,
} from './mocks'
import type {
  ApiResponse,
  AppNotification,
  AuthTokens,
  Cemetery,
  City,
  ExecutorOrder,
  ExecutorProfile,
  Grave,
  Member,
  Memory,
  Order,
  OrderStatus,
  PaymentMethod,
  PhotoReport,
  PlanInfo,
  RecurringPeriod,
  Reminder,
  ReminderType,
  Service,
  ServiceCategory,
  Subscription,
  SubscriptionPlan,
  UserProfile,
} from './types'

const USE_MOCKS = config.useMocks
// Активен ли Supabase-бэкенд (см. config.backend)
const SUPA = config.backend === 'supabase'

// ─── Авторизация ──────────────────────────────────────────────

export interface SendCodeResult {
  success: boolean
  expiresIn: number
}

export const authApi = {
  sendCode(phone: string): Promise<SendCodeResult> {
    if (SUPA) return sb.authApi.sendCode(phone)
    if (USE_MOCKS) return mockDelay({ success: true, expiresIn: 60 })
    return unwrap<SendCodeResult>(client.post('/auth/send-code', { phone }))
  },
  verifyCode(phone: string, code: string): Promise<AuthTokens> {
    if (SUPA) return sb.authApi.verifyCode(phone, code)
    if (USE_MOCKS) return mockDelay(authTokensMock)
    return unwrap<AuthTokens>(client.post('/auth/verify-code', { phone, code }))
  },
  logout(): Promise<{ success: boolean }> {
    if (SUPA) return sb.authApi.logout()
    if (USE_MOCKS) return mockDelay({ success: true })
    return unwrap(client.post('/auth/logout'))
  },
  deleteAccount(): Promise<{ success: boolean }> {
    if (SUPA) return sb.authApi.deleteAccount()
    if (USE_MOCKS) return mockDelay({ success: true })
    return unwrap(client.delete('/auth/account'))
  },
  registerPushToken(token: string, platform: 'ios' | 'android'): Promise<{ success: boolean }> {
    if (SUPA) return sb.authApi.registerPushToken(token, platform)
    if (USE_MOCKS) return mockDelay({ success: true })
    return unwrap(client.post('/user/push-token', { token, platform }))
  },
}

// ─── Захоронения ──────────────────────────────────────────────

export interface GraveSearchParams {
  q?: string
  city?: string
  cemeteryId?: string
  page?: number
  limit?: number
}

export interface CreateGraveInput {
  fullName: string
  birthDate: string | null
  deathDate: string | null
  cemeteryId: string
  plot: string | null
  photos: string[]
  biography: string | null
}

export const gravesApi = {
  search(params: GraveSearchParams): Promise<Grave[]> {
    if (SUPA) return sb.gravesApi.search(params)
    if (USE_MOCKS) {
      const q = params.q?.toLowerCase().trim() ?? ''
      const result = gravesMock.filter(g => {
        if (params.cemeteryId && g.cemeteryId !== params.cemeteryId) return false
        if (params.city && g.city !== params.city) return false
        if (q && !g.fullName.toLowerCase().includes(q)) return false
        return true
      })
      return mockDelay(result)
    }
    return unwrap<Grave[]>(client.get('/graves/search', { params }))
  },
  getById(id: string): Promise<Grave> {
    if (SUPA) return sb.gravesApi.getById(id)
    if (USE_MOCKS) {
      const grave = gravesMock.find(g => g.id === id)
      if (!grave) return Promise.reject(new Error('Захоронение не найдено'))
      return mockDelay(grave)
    }
    return unwrap<Grave>(client.get(`/graves/${id}`))
  },
  create(input: CreateGraveInput): Promise<Grave> {
    if (SUPA) return sb.gravesApi.create(input)
    if (USE_MOCKS) {
      const cemetery = cemeteriesMock.find(c => c.id === input.cemeteryId)
      const grave: Grave = {
        id: `grave-new-${Date.now()}`,
        fullName: input.fullName,
        birthDate: input.birthDate,
        deathDate: input.deathDate,
        cemeteryId: input.cemeteryId,
        cemeteryName: cemetery?.name ?? '',
        city: cemetery?.cityName ?? '',
        plot: input.plot,
        biography: input.biography,
        photos: input.photos,
        coordinates: null,
        status: 'moderation',
        isSaved: false,
        lastOrder: null,
      }
      return mockDelay(grave)
    }
    return unwrap<Grave>(client.post('/graves', input))
  },
  getOrders(graveId: string, limit = 10): Promise<Order[]> {
    if (SUPA) return sb.gravesApi.getOrders(graveId, limit)
    if (USE_MOCKS) {
      return mockDelay(ordersMock.filter(o => o.graveId === graveId).slice(0, limit))
    }
    return unwrap<Order[]>(client.get(`/graves/${graveId}/orders`, { params: { limit } }))
  },
  cities(): Promise<City[]> {
    if (SUPA) return sb.gravesApi.cities()
    if (USE_MOCKS) return mockDelay(citiesMock)
    return unwrap<City[]>(client.get('/cities'))
  },
  cemeteries(cityId?: string): Promise<Cemetery[]> {
    if (SUPA) return sb.gravesApi.cemeteries(cityId)
    if (USE_MOCKS) {
      return mockDelay(cityId ? cemeteriesMock.filter(c => c.cityId === cityId) : cemeteriesMock)
    }
    return unwrap<Cemetery[]>(client.get('/cemeteries', { params: { cityId } }))
  },
  saved(): Promise<Grave[]> {
    if (SUPA) return sb.gravesApi.saved()
    if (USE_MOCKS) return mockDelay(gravesMock.filter(g => g.isSaved))
    return unwrap<Grave[]>(client.get('/user/saved-graves'))
  },
  save(graveId: string): Promise<{ success: boolean }> {
    if (SUPA) return sb.gravesApi.save(graveId)
    if (USE_MOCKS) return mockDelay({ success: true })
    return unwrap(client.post('/user/saved-graves', { graveId }))
  },
  unsave(graveId: string): Promise<{ success: boolean }> {
    if (SUPA) return sb.gravesApi.unsave(graveId)
    if (USE_MOCKS) return mockDelay({ success: true })
    return unwrap(client.delete(`/user/saved-graves/${graveId}`))
  },
}

// ─── Услуги ───────────────────────────────────────────────────

export const servicesApi = {
  list(category?: ServiceCategory): Promise<Service[]> {
    if (SUPA) return sb.servicesApi.list(category)
    if (USE_MOCKS) {
      return mockDelay(category ? servicesMock.filter(s => s.category === category) : servicesMock)
    }
    return unwrap<Service[]>(client.get('/services', { params: { category } }))
  },
  getById(id: string): Promise<Service> {
    if (SUPA) return sb.servicesApi.getById(id)
    if (USE_MOCKS) {
      const svc = servicesMock.find(s => s.id === id)
      if (!svc) return Promise.reject(new Error('Услуга не найдена'))
      return mockDelay(svc)
    }
    return unwrap<Service>(client.get(`/services/${id}`))
  },
}

// ─── Заказы ───────────────────────────────────────────────────

export interface CreateOrderInput {
  graveId: string
  serviceId: string
  date: string
  notes: string | null
  isRecurring: boolean
  recurringPeriod: RecurringPeriod
}

export const ordersApi = {
  create(input: CreateOrderInput): Promise<Order> {
    if (SUPA) return sb.ordersApi.create(input)
    if (USE_MOCKS) {
      const grave = gravesMock.find(g => g.id === input.graveId)
      const service = servicesMock.find(s => s.id === input.serviceId)
      const order: Order = {
        id: `order-new-${Date.now()}`,
        graveId: input.graveId,
        graveName: grave?.fullName ?? '',
        cemeteryName: grave?.cemeteryName ?? '',
        serviceId: input.serviceId,
        serviceName: service?.name ?? '',
        serviceIcon: service?.icon ?? 'Broom',
        status: 'pending',
        date: input.date,
        amount: service?.fixedPrice ? (service?.priceFrom ?? null) : null,
        notes: input.notes,
        isRecurring: input.isRecurring,
        recurringPeriod: input.recurringPeriod,
        executor: null,
        rating: null,
        createdAt: new Date().toISOString(),
      }
      return mockDelay(order)
    }
    return unwrap<Order>(client.post('/orders', input))
  },
  list(status?: OrderStatus | 'active' | 'completed', page = 1, limit = 20): Promise<Order[]> {
    if (SUPA) return sb.ordersApi.list(status, page, limit)
    if (USE_MOCKS) {
      let result = ordersMock
      if (status === 'active') {
        result = ordersMock.filter(o =>
          ['pending', 'assigned', 'on_the_way', 'working'].includes(o.status)
        )
      } else if (status === 'completed') {
        result = ordersMock.filter(o => ['completed', 'cancelled', 'refund'].includes(o.status))
      } else if (status) {
        result = ordersMock.filter(o => o.status === status)
      }
      return mockDelay(result)
    }
    return unwrap<Order[]>(client.get('/orders', { params: { status, page, limit } }))
  },
  getById(id: string): Promise<Order> {
    if (SUPA) return sb.ordersApi.getById(id)
    if (USE_MOCKS) {
      const order = ordersMock.find(o => o.id === id)
      if (!order) return Promise.reject(new Error('Заказ не найден'))
      return mockDelay(order)
    }
    return unwrap<Order>(client.get(`/orders/${id}`))
  },
  cancel(id: string): Promise<{ success: boolean }> {
    if (SUPA) return sb.ordersApi.cancel(id)
    if (USE_MOCKS) return mockDelay({ success: true })
    return unwrap(client.delete(`/orders/${id}`))
  },
  review(id: string, rating: number, comment?: string): Promise<{ success: boolean }> {
    if (SUPA) return sb.ordersApi.review(id, rating, comment)
    if (USE_MOCKS) return mockDelay({ success: true })
    return unwrap(client.post(`/orders/${id}/review`, { rating, comment }))
  },
  report(id: string): Promise<PhotoReport> {
    if (SUPA) return sb.ordersApi.report(id)
    if (USE_MOCKS) return mockDelay(reportsMock[id] ?? { photosBefore: [], photosAfter: [] })
    return unwrap<PhotoReport>(client.get(`/orders/${id}/report`))
  },
}

// ─── Оплата ───────────────────────────────────────────────────

export interface PaymentIntent {
  paymentId: string
  confirmationUrl: string
}

export const paymentsApi = {
  create(orderId: string, methodId: string): Promise<PaymentIntent> {
    if (USE_MOCKS || SUPA) {
      return mockDelay({ paymentId: `pay-${Date.now()}`, confirmationUrl: 'https://yookassa.ru/mock' })
    }
    return unwrap<PaymentIntent>(client.post('/payments/create', { orderId, methodId }))
  },
  status(paymentId: string): Promise<{ status: string; amount: number }> {
    if (USE_MOCKS || SUPA) return mockDelay({ status: 'succeeded', amount: 800 })
    return unwrap(client.get(`/payments/${paymentId}/status`))
  },
  methods(): Promise<PaymentMethod[]> {
    if (USE_MOCKS || SUPA) return mockDelay(paymentMethodsMock)
    return unwrap<PaymentMethod[]>(client.get('/user/payment-methods'))
  },
}

// ─── Напоминания ──────────────────────────────────────────────

export interface CreateReminderInput {
  graveId: string
  type: ReminderType
  date: string
  label: string
  autoOrder: string[]
}

export const remindersApi = {
  list(graveId?: string): Promise<Reminder[]> {
    if (SUPA) return sb.remindersApi.list(graveId)
    if (USE_MOCKS) {
      return mockDelay(graveId ? remindersMock.filter(r => r.graveId === graveId) : remindersMock)
    }
    return unwrap<Reminder[]>(client.get('/reminders', { params: { graveId } }))
  },
  create(input: CreateReminderInput): Promise<Reminder> {
    if (SUPA) return sb.remindersApi.create(input)
    if (USE_MOCKS) {
      const grave = gravesMock.find(g => g.id === input.graveId)
      const reminder: Reminder = {
        id: `rem-new-${Date.now()}`,
        graveId: input.graveId,
        graveName: grave?.fullName ?? '',
        cemeteryName: grave?.cemeteryName ?? '',
        type: input.type,
        date: input.date,
        label: input.label,
        isEnabled: true,
        autoOrder: input.autoOrder,
      }
      remindersMock.push(reminder)
      return mockDelay(reminder)
    }
    return unwrap<Reminder>(client.post('/reminders', input))
  },
  update(id: string, patch: { isEnabled?: boolean; autoOrder?: string[] }): Promise<Reminder> {
    if (SUPA) return sb.remindersApi.update(id, patch)
    if (USE_MOCKS) {
      const reminder = remindersMock.find(r => r.id === id)
      if (!reminder) return Promise.reject(new Error('Напоминание не найдено'))
      Object.assign(reminder, patch)
      return mockDelay({ ...reminder })
    }
    return unwrap<Reminder>(client.put(`/reminders/${id}`, patch))
  },
  remove(id: string): Promise<{ success: boolean }> {
    if (SUPA) return sb.remindersApi.remove(id)
    if (USE_MOCKS) return mockDelay({ success: true })
    return unwrap(client.delete(`/reminders/${id}`))
  },
}

// ─── Свеча памяти ─────────────────────────────────────────────

export interface CandleStatus {
  /** Всего зажжённых свечей у этого захоронения. */
  count: number
  /** Зажигал ли текущий пользователь свечу сегодня. */
  litToday: boolean
}

// Мок-хранилище зажжённых свечей в рамках сессии.
const candleState: Record<string, CandleStatus> = {}

// Детерминированный «стартовый» счётчик — чтобы у разных людей были
// разные, но стабильные числа, без реального бэкенда.
function baseCandleCount(graveId: string): number {
  let hash = 0
  for (let i = 0; i < graveId.length; i++) hash = (hash * 31 + graveId.charCodeAt(i)) % 400
  return 12 + hash
}

export const candlesApi = {
  status(graveId: string): Promise<CandleStatus> {
    if (SUPA) return sb.candlesApi.status(graveId)
    if (USE_MOCKS) {
      const state = candleState[graveId] ?? { count: baseCandleCount(graveId), litToday: false }
      candleState[graveId] = state
      return mockDelay(state)
    }
    return unwrap<CandleStatus>(client.get(`/graves/${graveId}/candles`))
  },
  light(graveId: string): Promise<CandleStatus> {
    if (SUPA) return sb.candlesApi.light(graveId)
    if (USE_MOCKS) {
      const prev = candleState[graveId] ?? { count: baseCandleCount(graveId), litToday: false }
      const next: CandleStatus = { count: prev.count + (prev.litToday ? 0 : 1), litToday: true }
      candleState[graveId] = next
      return mockDelay(next)
    }
    return unwrap<CandleStatus>(client.post(`/graves/${graveId}/candles`))
  },
}

// ─── Книга воспоминаний ───────────────────────────────────────

// Мок-хранилище воспоминаний (переживает добавления в рамках сессии).
const memoriesStore: Memory[] = [...memoriesMock]

export interface CreateMemoryInput {
  graveId: string
  authorName: string
  text: string
  photos?: string[]
}

export const memoriesApi = {
  list(graveId: string): Promise<Memory[]> {
    if (SUPA) return sb.memoriesApi.list(graveId)
    if (USE_MOCKS) {
      const list = memoriesStore
        .filter(m => m.graveId === graveId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      return mockDelay(list)
    }
    return unwrap<Memory[]>(client.get(`/graves/${graveId}/memories`))
  },
  add(input: CreateMemoryInput): Promise<Memory> {
    if (SUPA) return sb.memoriesApi.add(input)
    if (USE_MOCKS) {
      const memory: Memory = {
        id: `mem-new-${Date.now()}`,
        graveId: input.graveId,
        authorName: input.authorName,
        text: input.text,
        createdAt: new Date().toISOString(),
        photos: input.photos ?? [],
      }
      memoriesStore.unshift(memory)
      return mockDelay(memory)
    }
    return unwrap<Memory>(client.post(`/graves/${input.graveId}/memories`, input))
  },
}

// ─── Совместный доступ ────────────────────────────────────────

export const membersApi = {
  list(graveId: string): Promise<Member[]> {
    if (SUPA) return sb.membersApi.list(graveId)
    if (USE_MOCKS) return mockDelay(membersMock)
    return unwrap<Member[]>(client.get(`/graves/${graveId}/members`))
  },
  inviteLink(graveId: string): Promise<{ url: string }> {
    if (SUPA) return sb.membersApi.inviteLink(graveId)
    if (USE_MOCKS) return mockDelay({ url: `pamyat://grave/${graveId}` })
    return unwrap<{ url: string }>(client.post(`/graves/${graveId}/invite`))
  },
}

// ─── Профиль ──────────────────────────────────────────────────

// Мутируемая копия профиля — чтобы правки имени/аватара сохранялись в сессии.
let userProfileState: UserProfile = { ...userProfileMock }

export const profileApi = {
  get(): Promise<UserProfile> {
    if (SUPA) return sb.profileApi.get()
    if (USE_MOCKS) return mockDelay(userProfileState)
    return unwrap<UserProfile>(client.get('/user/profile'))
  },
  update(patch: { name?: string; avatarUrl?: string }): Promise<UserProfile> {
    if (SUPA) return sb.profileApi.update(patch)
    if (USE_MOCKS) {
      userProfileState = { ...userProfileState, ...patch }
      return mockDelay(userProfileState)
    }
    return unwrap<UserProfile>(client.put('/user/profile', patch))
  },
  subscription(): Promise<Subscription> {
    if (SUPA) return sb.profileApi.subscription()
    if (USE_MOCKS) return mockDelay(userProfileState.subscription)
    return unwrap<Subscription>(client.get('/user/subscription'))
  },
  plans(): Promise<PlanInfo[]> {
    if (SUPA) return sb.profileApi.plans()
    if (USE_MOCKS) return mockDelay(plansMock)
    // TODO: согласовать с бэкендом
    return unwrap<PlanInfo[]>(client.get('/subscriptions/plans'))
  },
  changePlan(plan: SubscriptionPlan): Promise<Subscription> {
    if (SUPA) return sb.profileApi.changePlan(plan)
    if (USE_MOCKS) {
      const info = plansMock.find(p => p.id === plan)
      const paid = (info?.price ?? 0) > 0
      const until = new Date()
      until.setMonth(until.getMonth() + 1)
      userProfileState = {
        ...userProfileState,
        subscription: {
          plan,
          planName: info?.name ?? plan,
          validUntil: paid ? until.toISOString().slice(0, 10) : null,
          gravesLimit: plan === 'premium' ? 99 : plan === 'standard' ? 3 : 1,
        },
      }
      return mockDelay(userProfileState.subscription)
    }
    // TODO: согласовать с бэкендом
    return unwrap<Subscription>(client.post('/subscriptions/change', { plan }))
  },
  restoreSubscription(): Promise<{ success: boolean }> {
    if (SUPA) return sb.profileApi.restoreSubscription()
    if (USE_MOCKS) return mockDelay({ success: true })
    return unwrap(client.post('/subscriptions/restore'))
  },
}

// ─── Исполнитель ──────────────────────────────────────────────

export const executorApi = {
  orders(status?: OrderStatus): Promise<ExecutorOrder[]> {
    if (USE_MOCKS || SUPA) {
      return mockDelay(status ? executorOrdersMock.filter(o => o.status === status) : executorOrdersMock)
    }
    return unwrap<ExecutorOrder[]>(client.get('/executor/orders', { params: { status } }))
  },
  getById(id: string): Promise<ExecutorOrder> {
    if (USE_MOCKS || SUPA) {
      const order = executorOrdersMock.find(o => o.id === id)
      if (!order) return Promise.reject(new Error('Заказ не найден'))
      return mockDelay(order)
    }
    return unwrap<ExecutorOrder>(client.get(`/executor/orders/${id}`))
  },
  profile(): Promise<ExecutorProfile> {
    if (USE_MOCKS || SUPA) return mockDelay(executorProfileMock)
    return unwrap<ExecutorProfile>(client.get('/executor/profile'))
  },
  accept(id: string): Promise<{ success: boolean }> {
    if (USE_MOCKS || SUPA) return mockDelay({ success: true })
    return unwrap(client.post(`/executor/orders/${id}/accept`))
  },
  reject(id: string, reason: string): Promise<{ success: boolean }> {
    if (USE_MOCKS || SUPA) return mockDelay({ success: true })
    return unwrap(client.post(`/executor/orders/${id}/reject`, { reason }))
  },
  arrive(id: string): Promise<{ success: boolean }> {
    if (USE_MOCKS || SUPA) return mockDelay({ success: true })
    return unwrap(client.post(`/executor/orders/${id}/arrive`))
  },
  uploadBefore(id: string, urls: string[]): Promise<{ success: boolean }> {
    if (USE_MOCKS || SUPA) return mockDelay({ success: true })
    return unwrap(client.post(`/executor/orders/${id}/photos/before`, { urls }))
  },
  uploadAfter(id: string, urls: string[]): Promise<{ success: boolean }> {
    if (USE_MOCKS || SUPA) return mockDelay({ success: true })
    return unwrap(client.post(`/executor/orders/${id}/photos/after`, { urls }))
  },
  complete(id: string): Promise<{ success: boolean }> {
    if (USE_MOCKS || SUPA) return mockDelay({ success: true })
    return unwrap(client.post(`/executor/orders/${id}/complete`))
  },
  setOnline(isOnline: boolean): Promise<{ success: boolean }> {
    if (USE_MOCKS || SUPA) return mockDelay({ success: true })
    return unwrap(client.put('/executor/profile', { isOnline }))
  },
}

// ─── Уведомления ──────────────────────────────────────────────

export const notificationsApi = {
  list(): Promise<AppNotification[]> {
    if (SUPA) return sb.notificationsApi.list()
    if (USE_MOCKS) return mockDelay([...notificationsMock])
    // TODO: согласовать с бэкендом
    return unwrap<AppNotification[]>(client.get('/notifications'))
  },
  markAllRead(): Promise<{ success: boolean }> {
    if (SUPA) return sb.notificationsApi.markAllRead()
    if (USE_MOCKS) {
      notificationsMock.forEach(n => {
        n.isRead = true
      })
      return mockDelay({ success: true })
    }
    // TODO: согласовать с бэкендом
    return unwrap(client.post('/notifications/read-all'))
  },
}

export type { ApiResponse }
