import type { RecurringPeriod } from '@pamyat/api'
import { create } from 'zustand'

/**
 * Черновик заказа — переносит выбор пользователя между экранами
 * каталог → форма → оплата, не гоняя его через параметры навигации.
 */
interface OrderDraftState {
  graveId: string | null
  graveName: string | null
  cemeteryName: string | null
  serviceId: string | null
  serviceName: string | null
  serviceIcon: string | null
  priceFrom: number | null
  fixedPrice: boolean
  date: string | null
  recurringPeriod: RecurringPeriod
  notes: string
  startOrder: (grave: { id: string; name: string; cemetery: string }) => void
  selectService: (service: {
    id: string
    name: string
    icon: string
    priceFrom: number
    fixedPrice: boolean
  }) => void
  setDate: (date: string) => void
  setRecurring: (period: RecurringPeriod) => void
  setNotes: (notes: string) => void
  reset: () => void
}

const initial = {
  graveId: null,
  graveName: null,
  cemeteryName: null,
  serviceId: null,
  serviceName: null,
  serviceIcon: null,
  priceFrom: null,
  fixedPrice: false,
  date: null,
  recurringPeriod: 'once' as RecurringPeriod,
  notes: '',
}

export const useOrderDraftStore = create<OrderDraftState>(set => ({
  ...initial,
  startOrder: grave =>
    set({ graveId: grave.id, graveName: grave.name, cemeteryName: grave.cemetery }),
  selectService: service =>
    set({
      serviceId: service.id,
      serviceName: service.name,
      serviceIcon: service.icon,
      priceFrom: service.priceFrom,
      fixedPrice: service.fixedPrice,
    }),
  setDate: date => set({ date }),
  setRecurring: recurringPeriod => set({ recurringPeriod }),
  setNotes: notes => set({ notes }),
  reset: () => set(initial),
}))
