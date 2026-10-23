import { Manrope_400Regular, Manrope_500Medium } from '@expo-google-fonts/manrope'
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_500Medium,
  useFonts,
} from '@expo-google-fonts/playfair-display'
import { colors, ToastProvider } from '@pamyat/ui'
import { QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import '../src/lib/storage'
import '../src/lib/i18n'
import { queryClient } from '../src/lib/queryClient'
import { Sentry } from '../src/lib/sentry'

void SplashScreen.preventAutoHideAsync()

function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_500Medium,
    Manrope_400Regular,
    Manrope_500Medium,
  })

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync()
  }, [fontsLoaded, fontError])

  if (!fontsLoaded && !fontError) return null

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.cream },
              animation: 'slide_from_right',
            }}
          />
        </ToastProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}

// Sentry.wrap ловит падения рендера
export default Sentry.wrap(RootLayout)
