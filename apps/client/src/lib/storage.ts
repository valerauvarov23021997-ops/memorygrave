import type { ThemeMode } from '@pamyat/ui'
import AsyncStorage from '@react-native-async-storage/async-storage'

const ONBOARDING_KEY = 'onboarding_seen'
const THEME_KEY = 'theme_mode'

/** Локальные флаги приложения, не требующие безопасного хранилища. */
export const appStorage = {
  async isOnboardingSeen(): Promise<boolean> {
    return (await AsyncStorage.getItem(ONBOARDING_KEY)) === 'true'
  },
  async markOnboardingSeen(): Promise<void> {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true')
  },
  async getThemeMode(): Promise<ThemeMode | null> {
    const value = await AsyncStorage.getItem(THEME_KEY)
    if (value === 'light' || value === 'dark' || value === 'system') return value
    return null
  },
  async setThemeMode(mode: ThemeMode): Promise<void> {
    await AsyncStorage.setItem(THEME_KEY, mode)
  },
}
