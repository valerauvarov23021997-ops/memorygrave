import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // сеть до бэкенда нестабильная: зависший запрос обрывается таймаутом
      // и быстро повторяется — до двух раз, без длинных экспоненциальных пауз
      retry: 2,
      retryDelay: 400,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})
