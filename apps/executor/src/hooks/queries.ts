import { executorApi, type OrderStatus } from '@pamyat/api'
import { useQuery } from '@tanstack/react-query'

export const executorKeys = {
  orders: (status?: string) => ['executor-orders', status ?? 'all'] as const,
  order: (id: string) => ['executor-order', id] as const,
  profile: ['executor-profile'] as const,
}

export function useExecutorOrders(status?: OrderStatus) {
  return useQuery({
    queryKey: executorKeys.orders(status),
    queryFn: () => executorApi.orders(status),
    refetchInterval: 30_000,
  })
}

export function useExecutorOrder(id: string) {
  return useQuery({ queryKey: executorKeys.order(id), queryFn: () => executorApi.getById(id) })
}

export function useExecutorProfile() {
  return useQuery({ queryKey: executorKeys.profile, queryFn: () => executorApi.profile() })
}
