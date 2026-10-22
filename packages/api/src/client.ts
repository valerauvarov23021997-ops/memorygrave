import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

import { config } from './config'
import type { ApiResponse } from './types'

// В Expo Go оба приложения делят одно хранилище SecureStore: без
// приставки исполнитель подхватывал вход клиента. Клиент приставку не
// задаёт — иначе у всех клиентов слетел бы вход.
let storagePrefix = ''

/** Вызывать до первого запроса — разделяет сохранённый вход между приложениями. */
export function setStoragePrefix(prefix: string): void {
  storagePrefix = prefix
}

export function storageKey(key: string): string {
  return storagePrefix + key
}

const ACCESS_KEY = 'accessToken'
const REFRESH_KEY = 'refreshToken'

// SecureStore недоступен в вебе — для web-отладки используем localStorage.
const isWeb = Platform.OS === 'web'
const webStorage = {
  get: (k: string) => (typeof localStorage === 'undefined' ? null : localStorage.getItem(k)),
  set: (k: string, v: string) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(k, v)
  },
  del: (k: string) => {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(k)
  },
}

export const tokenStorage = {
  async getAccess() {
    if (isWeb) return webStorage.get(storageKey(ACCESS_KEY))
    return await SecureStore.getItemAsync(storageKey(ACCESS_KEY))
  },
  async getRefresh() {
    if (isWeb) return webStorage.get(storageKey(REFRESH_KEY))
    return await SecureStore.getItemAsync(storageKey(REFRESH_KEY))
  },
  async setTokens(access: string, refresh: string) {
    if (isWeb) {
      webStorage.set(storageKey(ACCESS_KEY), access)
      webStorage.set(storageKey(REFRESH_KEY), refresh)
      return
    }
    await SecureStore.setItemAsync(storageKey(ACCESS_KEY), access)
    await SecureStore.setItemAsync(storageKey(REFRESH_KEY), refresh)
  },
  async clear() {
    if (isWeb) {
      webStorage.del(storageKey(ACCESS_KEY))
      webStorage.del(storageKey(REFRESH_KEY))
      return
    }
    await SecureStore.deleteItemAsync(storageKey(ACCESS_KEY))
    await SecureStore.deleteItemAsync(storageKey(REFRESH_KEY))
  },
}

const client = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: config.timeout,
})

client.interceptors.request.use(async (cfg: InternalAxiosRequestConfig) => {
  const token = await tokenStorage.getAccess()
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

/** Флаг, чтобы не зациклить обновление токена при повторном 401. */
type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean }

client.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined
    if (error.response?.status === 401 && original && !original._retried) {
      original._retried = true
      const refresh = await tokenStorage.getRefresh()
      if (refresh) {
        try {
          const { data } = await axios.post<
            ApiResponse<{ accessToken: string; refreshToken: string }>
          >(`${config.apiBaseUrl}/auth/refresh`, { refreshToken: refresh })
          await tokenStorage.setTokens(data.data.accessToken, data.data.refreshToken)
          original.headers.Authorization = `Bearer ${data.data.accessToken}`
          return await client.request(original)
        } catch {
          await tokenStorage.clear()
        }
      }
    }
    return await Promise.reject(error)
  }
)

/** Разворачивает { data, error, meta } и бросает ошибку из поля error. */
export async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const res = await promise
  if (res.data.error) throw new Error(res.data.error)
  return res.data.data
}

export default client
