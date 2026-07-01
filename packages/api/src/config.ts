/**
 * Конфигурация окружения. В Expo публичные переменные читаются из
 * process.env с префиксом EXPO_PUBLIC_. Значения задаются в .env.
 */

export const config = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.pamyat.app/v1',
  // Пока бэкенда нет — моки включены по умолчанию.
  // Отключить: EXPO_PUBLIC_USE_MOCKS=false в .env
  useMocks: process.env.EXPO_PUBLIC_USE_MOCKS !== 'false',
  timeout: 10_000,
} as const

/** Имитация сетевой задержки для мок-режима (300–600 мс). */
export function mockDelay<T>(value: T): Promise<T> {
  const ms = 300 + Math.round(Math.random() * 300)
  return new Promise(resolve => setTimeout(() => resolve(value), ms))
}
