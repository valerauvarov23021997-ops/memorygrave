import { DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans'
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_500Medium,
  useFonts,
} from '@expo-google-fonts/playfair-display'
import { colors, ThemeProvider, ToastProvider } from '@pamyat/ui'
import { QueryClientProvider } from '@tanstack/react-query'
import * as Notifications from 'expo-notifications'
import { router, Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import '../src/lib/i18n'
import { queryClient } from '../src/lib/queryClient'

void SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_500Medium,
    DMSans_400Regular,
    DMSans_500Medium,
  })

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync()
  }, [fontsLoaded, fontError])

  // Нажатие на уведомление о памятной дате открывает страницу человека.
  useEffect(() => {
    const openFromResponse = (response: Notifications.NotificationResponse | null) => {
      const graveId = response?.notification.request.content.data?.graveId
      if (typeof graveId === 'string') {
        router.navigate({ pathname: '/grave/[id]', params: { id: graveId } })
      }
    }
    // Холодный старт: приложение открыли нажатием на уведомление.
    void Notifications.getLastNotificationResponseAsync().then(openFromResponse)
    // Приложение уже запущено.
    const sub = Notifications.addNotificationResponseReceivedListener(openFromResponse)
    return () => sub.remove()
  }, [])

  if (!fontsLoaded && !fontError) return null

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.cream },
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
            </Stack>
          </ToastProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}
