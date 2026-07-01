import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import * as SecureStore from 'expo-secure-store'

import { config } from './config'
import type { ApiResponse } from './types'

const ACCESS_KEY = 'accessToken'
const REFRESH_KEY = 'refreshToken'

export const tokenStorage = {
  async getAccess() {
    return SecureStore.getItemAsync(ACCESS_KEY)
  },
  async getRefresh() {
    return SecureStore.getItemAsync(REFRESH_KEY)
  },
  async setTokens(access: string, refresh: string) {
    await SecureStore.setItemAsync(ACCESS_KEY, access)
    await SecureStore.setItemAsync(REFRESH_KEY, refresh)
  },
  async clear() {
    await SecureStore.deleteItemAsync(ACCESS_KEY)
    await SecureStore.deleteItemAsync(REFRESH_KEY)
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
          const { data } = await axios.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
            `${config.apiBaseUrl}/auth/refresh`,
            { refreshToken: refresh }
          )
          await tokenStorage.setTokens(data.data.accessToken, data.data.refreshToken)
          original.headers.Authorization = `Bearer ${data.data.accessToken}`
          return client.request(original)
        } catch {
          await tokenStorage.clear()
        }
      }
    }
    return Promise.reject(error)
  }
)

/** Разворачивает { data, error, meta } и бросает ошибку из поля error. */
export async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const res = await promise
  if (res.data.error) throw new Error(res.data.error)
  return res.data.data
}

export default client
