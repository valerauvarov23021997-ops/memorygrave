/**
 * Push-уведомления (задача 11). Регистрация токена и обработка нажатий.
 * Без реальных ключей FCM работает как заглушка — просто запрашивает права.
 */
import { authApi } from '@pamyat/api'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
})

/** Запрашивает разрешение и регистрирует push-токен на бэкенде. */
export async function registerForPushNotifications(): Promise<string | null> {
  const { status: existing } = await Notifications.getPermissionsAsync()
  let status = existing
  if (status !== 'granted') {
    status = (await Notifications.requestPermissionsAsync()).status
  }
  if (status !== 'granted') return null

  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data
    const platform = Platform.OS === 'ios' ? 'ios' : 'android'
    await authApi.registerPushToken(token, platform)
    return token
  } catch {
    // Без валидного projectId/FCM токен получить нельзя — не критично для мок-режима.
    return null
  }
}
