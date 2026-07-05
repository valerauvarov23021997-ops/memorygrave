import 'react-native-url-polyfill/auto'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

import { config } from '../config'

// Сессию Supabase храним так же, как токены: SecureStore на телефоне,
// localStorage в вебе.
const isWeb = Platform.OS === 'web'

const authStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (isWeb) return typeof localStorage === 'undefined' ? null : localStorage.getItem(key)
    return SecureStore.getItemAsync(key)
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (isWeb) {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, value)
      return
    }
    await SecureStore.setItemAsync(key, value)
  },
  removeItem: async (key: string): Promise<void> => {
    if (isWeb) {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key)
      return
    }
    await SecureStore.deleteItemAsync(key)
  },
}

let instance: SupabaseClient | null = null

/** Ленивая инициализация: клиент создаётся при первом обращении. */
export function getSupabase(): SupabaseClient {
  if (!instance) {
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      throw new Error('Supabase не настроен: задайте EXPO_PUBLIC_SUPABASE_URL и EXPO_PUBLIC_SUPABASE_ANON_KEY')
    }
    instance = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        storage: authStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  }
  return instance
}

/** id текущего пользователя; бросает, если сессии нет. */
export async function requireUserId(): Promise<string> {
  const { data, error } = await getSupabase().auth.getUser()
  if (error || !data.user) throw new Error('Требуется вход в аккаунт')
  return data.user.id
}
