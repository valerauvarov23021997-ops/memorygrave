import {
  DMSans_300Light,
  DMSans_400Regular,
  DMSans_500Medium,
} from '@expo-google-fonts/dm-sans'
import {
  PlayfairDisplay_300Light,
  PlayfairDisplay_400Regular,
  PlayfairDisplay_500Medium,
  useFonts,
} from '@expo-google-fonts/playfair-display'
import { QueryClientProvider } from '@tanstack/react-query'
import { colors, ToastProvider } from '@pamyat/ui'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import '../src/lib/i18n'
import { queryClient } from '../src/lib/queryClient'

void SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlayfairDisplay_300Light,
    PlayfairDisplay_400Regular,
    PlayfairDisplay_500Medium,
    DMSans_300Light,
    DMSans_400Regular,
    DMSans_500Medium,
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
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          </Stack>
        </ToastProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}
