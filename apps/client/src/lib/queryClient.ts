import { onlineManager, QueryClient } from '@tanstack/react-query'
import * as Network from 'expo-network'
import { Platform } from 'react-native'

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

// При смене сети (Wi-Fi ↔ LTE) старые соединения мертвы. Сообщаем
// react-query о статусе сети: на паузе запросы не штормят, после
// восстановления аккуратно продолжаются.
if (Platform.OS !== 'web') {
  try {
    Network.addNetworkStateListener(state => {
      onlineManager.setOnline(state.isConnected === true)
    })
  } catch {
    // на старых версиях слушателя может не быть — просто работаем без него
  }
}
