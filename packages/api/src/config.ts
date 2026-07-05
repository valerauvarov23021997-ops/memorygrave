/**
 * Конфигурация окружения. В Expo публичные переменные читаются из
 * process.env с префиксом EXPO_PUBLIC_. Значения задаются в .env.
 */

const useMocks = process.env.EXPO_PUBLIC_USE_MOCKS !== 'false'
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''

/**
 * Какой бэкенд активен:
 *  - mocks    — фикстуры (по умолчанию, пока не выключено в .env)
 *  - supabase — реальная база (EXPO_PUBLIC_USE_MOCKS=false + ключи Supabase)
 *  - rest     — собственный REST по docs/API.md (когда появится)
 */
export type Backend = 'mocks' | 'supabase' | 'rest'

const backend: Backend = useMocks ? 'mocks' : supabaseUrl && supabaseAnonKey ? 'supabase' : 'rest'

export const config = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.pamyat.app/v1',
  useMocks,
  backend,
  supabaseUrl,
  supabaseAnonKey,
  /** Username Telegram-бота кодов входа (без @). Пусто — коды отключены. */
  tgBot: process.env.EXPO_PUBLIC_TG_BOT ?? '',
  timeout: 10_000,
} as const

/** Имитация сетевой задержки для мок-режима (300–600 мс). */
export function mockDelay<T>(value: T): Promise<T> {
  const ms = 300 + Math.round(Math.random() * 300)
  return new Promise(resolve => setTimeout(() => resolve(value), ms))
}
