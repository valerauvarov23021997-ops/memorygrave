import { Manrope_400Regular, Manrope_500Medium } from '@expo-google-fonts/manrope'
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
import { useEffect, useState } from 'react'
import { Platform, StyleSheet } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { AnimatedSplash } from '../src/components/AnimatedSplash'
import '../src/lib/i18n'
import { queryClient } from '../src/lib/queryClient'

void SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_500Medium,
    Manrope_400Regular,
    Manrope_500Medium,
  })
  // Пока анимированный сплэш не доиграл — держим его поверх приложения.
  // В e2e-сборках (EXPO_PUBLIC_E2E=1) сплэш пропускаем: обходчик перезагружает
  // экраны сотни раз, и 4 секунды заставки на каждый растягивали прогон на час.
  const [splashDone, setSplashDone] = useState(process.env.EXPO_PUBLIC_E2E === '1')

  useEffect(() => {
    // Прячем нативный сплэш, как только готовы шрифты — дальше играет наш.
    if (fontsLoaded || fontError) void SplashScreen.hideAsync()
  }, [fontsLoaded, fontError])

  // Нажатие на уведомление о памятной дате открывает страницу человека.
  useEffect(() => {
    if (Platform.OS === 'web') return // в вебе нативных уведомлений нет
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
    return () => {
      sub.remove()
    }
  }, [])

  if (!fontsLoaded && !fontError) return null

  return (
    // корень для жестов (масштаб карты кладбища)
    <GestureHandlerRootView style={rootStyles.root}>
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
              {!splashDone ? (
                <AnimatedSplash
                  onFinish={() => {
                    setSplashDone(true)
                  }}
                />
              ) : null}
            </ToastProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

const rootStyles = StyleSheet.create({ root: { flex: 1 } })
