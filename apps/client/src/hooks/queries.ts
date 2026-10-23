/** React Query хуки поверх api-слоя. Экраны не трогают api напрямую. */
import {
  gravesApi,
  ordersApi,
  paymentsApi,
  profileApi,
  remindersApi,
  servicesApi,
  type GraveSearchParams,
  type OrderStatus,
  type ServiceCategory,
} from '@pamyat/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const queryKeys = {
  graves: (params: GraveSearchParams) => ['graves', params] as const,
  grave: (id: string) => ['grave', id] as const,
  saved: ['saved-graves'] as const,
  services: (category?: ServiceCategory) => ['services', category ?? 'all'] as const,
  orders: (status?: string) => ['orders', status ?? 'all'] as const,
  order: (id: string) => ['order', id] as const,
  report: (id: string) => ['report', id] as const,
  reminders: (graveId?: string) => ['reminders', graveId ?? 'all'] as const,
  profile: ['profile'] as const,
  paymentMethods: ['payment-methods'] as const,
  cemeteries: (cityId?: string) => ['cemeteries', cityId ?? 'all'] as const,
}

export function useGraveSearch(params: GraveSearchParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.graves(params),
    queryFn: () => gravesApi.search(params),
    enabled,
  })
}

export function useGrave(id: string) {
  return useQuery({ queryKey: queryKeys.grave(id), queryFn: () => gravesApi.getById(id) })
}

export function useSavedGraves() {
  return useQuery({ queryKey: queryKeys.saved, queryFn: () => gravesApi.saved() })
}

export function useCemeteries(cityId?: string) {
  return useQuery({ queryKey: queryKeys.cemeteries(cityId), queryFn: () => gravesApi.cemeteries(cityId) })
}

export function useCities() {
  return useQuery({ queryKey: ['cities'], queryFn: () => gravesApi.cities() })
}

export function useToggleSaved() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ graveId, next }: { graveId: string; next: boolean }) =>
      next ? gravesApi.save(graveId) : gravesApi.unsave(graveId),
    onSuccess: (_res, { graveId }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.grave(graveId) })
      void qc.invalidateQueries({ queryKey: queryKeys.saved })
    },
  })
}

export function useServices(category?: ServiceCategory) {
  return useQuery({ queryKey: queryKeys.services(category), queryFn: () => servicesApi.list(category) })
}

export function useOrders(status?: OrderStatus | 'active' | 'completed') {
  return useQuery({ queryKey: queryKeys.orders(status), queryFn: () => ordersApi.list(status) })
}

export function useOrder(id: string) {
  return useQuery({ queryKey: queryKeys.order(id), queryFn: () => ordersApi.getById(id) })
}

export function useReport(orderId: string) {
  return useQuery({ queryKey: queryKeys.report(orderId), queryFn: () => ordersApi.report(orderId) })
}

export function useReminders(graveId?: string) {
  return useQuery({ queryKey: queryKeys.reminders(graveId), queryFn: () => remindersApi.list(graveId) })
}

export function useProfile() {
  return useQuery({ queryKey: queryKeys.profile, queryFn: () => profileApi.get() })
}

export function usePaymentMethods() {
  return useQuery({ queryKey: queryKeys.paymentMethods, queryFn: () => paymentsApi.methods() })
}
