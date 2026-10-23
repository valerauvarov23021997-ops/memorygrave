import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'

import { reportError } from './sentry'

export const queryClient = new QueryClient({
  // Ошибки запросов к базе — в Sentry с ключом запроса: видно, какой экран падает
  queryCache: new QueryCache({
    onError: (error, query) => {
      reportError(error, { query: JSON.stringify(query.queryKey).slice(0, 120) })
    },
  }),
  mutationCache: new MutationCache({
    onError: error => {
      reportError(error, { kind: 'mutation' })
    },
  }),
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
})
