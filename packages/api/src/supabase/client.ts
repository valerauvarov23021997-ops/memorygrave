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

// В российских сетях соединения к Cloudflare (за ним Supabase) иногда
// «замерзают» без ошибки. Жёсткий таймаут превращает зависание в ошибку,
// которую react-query тут же ретраит — вместо вечного скелетона.
const REQUEST_TIMEOUT_MS = 8000

const timeoutFetch: typeof fetch = (input, init) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  // если снаружи передали свой signal — пробрасываем его отмену в наш контроллер
  if (init?.signal) {
    if (init.signal.aborted) controller.abort()
    else init.signal.addEventListener('abort', () => controller.abort(), { once: true })
  }
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer))
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
      global: { fetch: timeoutFetch },
    })
  }
  return instance
}

/**
 * id текущего пользователя; бросает, если сессии нет.
 * getSession читает локально (без сетевого запроса) — важно для скорости.
 */
export async function requireUserId(): Promise<string> {
  const { data } = await getSupabase().auth.getSession()
  const uid = data.session?.user.id
  if (!uid) throw new Error('Требуется вход в аккаунт')
  return uid
}
