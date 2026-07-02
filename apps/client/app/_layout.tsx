import { DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans'
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_500Medium,
  useFonts,
} from '@expo-google-fonts/playfair-display'
import {
  ThemeProvider,
  ToastProvider,
  useColors,
  useTheme,
  type ThemeMode,
} from '@pamyat/ui'
import { QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import '../src/lib/i18n'
import { queryClient } from '../src/lib/queryClient'
import { appStorage } from '../src/lib/storage'

void SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_500Medium,
    DMSans_400Regular,
    DMSans_500Medium,
  })

  const [themeReady, setThemeReady] = useState(false)
  const [initialMode, setInitialMode] = useState<ThemeMode>('system')

  useEffect(() => {
    appStorage
      .getThemeMode()
      .then(saved => {
        if (saved) setInitialMode(saved)
      })
      .finally(() => setThemeReady(true))
  }, [])

  useEffect(() => {
    if ((fontsLoaded || fontError) && themeReady) void SplashScreen.hideAsync()
  }, [fontsLoaded, fontError, themeReady])

  if ((!fontsLoaded && !fontError) || !themeReady) return null

  return (
    <SafeAreaProvider>
      <ThemeProvider initialMode={initialMode} onModeChange={mode => void appStorage.setThemeMode(mode)}>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <ThemedNavigator />
          </ToastProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}

/** Навигатор, читающий тему для StatusBar и фона экранов. */
function ThemedNavigator() {
  const colors = useColors()
  const { isDark } = useTheme()
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
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
    </>
  )
}
