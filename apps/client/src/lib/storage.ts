import AsyncStorage from '@react-native-async-storage/async-storage'

const ONBOARDING_KEY = 'onboarding_seen'

/** Локальные флаги приложения, не требующие безопасного хранилища. */
export const appStorage = {
  async isOnboardingSeen(): Promise<boolean> {
    return (await AsyncStorage.getItem(ONBOARDING_KEY)) === 'true'
  },
  async markOnboardingSeen(): Promise<void> {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true')
  },
}
