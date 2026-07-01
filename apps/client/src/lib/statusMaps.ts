import type { GraveStatus, OrderStatus } from '@pamyat/api'
import type { TFunction } from 'i18next'

type BadgeVariant = 'success' | 'warning' | 'info' | 'neutral' | 'error'

/** Бейдж статуса оцифровки захоронения. */
export function graveStatusBadge(
  status: GraveStatus,
  t: TFunction
): { label: string; variant: BadgeVariant } {
  switch (status) {
    case 'digitized':
      return { label: t('search.statusDigitized'), variant: 'success' }
    case 'moderation':
      return { label: t('search.statusModeration'), variant: 'warning' }
    case 'not_digitized':
    default:
      return { label: t('search.statusNotDigitized'), variant: 'neutral' }
  }
}

/** Бейдж статуса заказа. */
export function orderStatusBadge(
  status: OrderStatus,
  t: TFunction
): { label: string; variant: BadgeVariant } {
  switch (status) {
    case 'pending':
      return { label: t('orders.statusPending'), variant: 'warning' }
    case 'assigned':
      return { label: t('orders.statusAssigned'), variant: 'success' }
    case 'on_the_way':
      return { label: t('orders.statusOnTheWay'), variant: 'success' }
    case 'working':
      return { label: t('orders.statusWorking'), variant: 'info' }
    case 'completed':
      return { label: t('orders.statusCompleted'), variant: 'success' }
    case 'cancelled':
      return { label: t('orders.statusCancelled'), variant: 'neutral' }
    case 'refund':
    default:
      return { label: t('orders.statusRefund'), variant: 'neutral' }
  }
}

/** Порядок шагов таймлайна и индекс текущего для статуса заказа. */
export const ORDER_TIMELINE: OrderStatus[] = ['pending', 'assigned', 'on_the_way', 'working', 'completed']

export function timelineIndex(status: OrderStatus): number {
  const map: Record<OrderStatus, number> = {
    pending: 0,
    assigned: 1,
    on_the_way: 2,
    working: 3,
    completed: 4,
    cancelled: -1,
    refund: -1,
  }
  return map[status]
}
