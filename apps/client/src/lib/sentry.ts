import { config } from '@pamyat/api'
import * as Sentry from '@sentry/react-native'

/**
 * Отчёты об ошибках. DSN — публичный адрес проекта Sentry (он и так
 * попадает в приложение), поэтому живёт в .env рядом с ключом Supabase.
 * Нет DSN — Sentry выключен, приложение работает как раньше.
 */
const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN ?? ''

Sentry.init({
  dsn,
  enabled: dsn.length > 0,
  // mocks / supabase — чтобы ошибки демо-режима не смешивались с боевыми
  environment: config.backend,
  // ФИО, телефоны и IP не отправляем: приложение о памяти близких
  sendDefaultPii: false,
  // каждый 5-й переход — для замера медленных экранов на мобильной сети
  tracesSampleRate: 0.2,
})

/** Сообщить об ошибке, которую мы поймали сами (try/catch, ошибки запросов). */
export function reportError(error: unknown, context?: Record<string, string>): void {
  Sentry.captureException(error, context ? { tags: context } : undefined)
}

export { Sentry }
