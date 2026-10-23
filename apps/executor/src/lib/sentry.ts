import { config } from '@pamyat/api'
import * as Sentry from '@sentry/react-native'

/**
 * Отчёты об ошибках — тот же проект Sentry, что у клиента; приложения
 * различаются тегом app. Нет DSN в .env — Sentry выключен.
 */
const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN ?? ''

Sentry.init({
  dsn,
  enabled: dsn.length > 0,
  environment: config.backend,
  // адреса могил и телефоны заказчиков не отправляем
  sendDefaultPii: false,
  tracesSampleRate: 0.2,
  initialScope: { tags: { app: 'executor' } },
})

/** Сообщить об ошибке, которую мы поймали сами (try/catch, ошибки запросов). */
export function reportError(error: unknown, context?: Record<string, string>): void {
  Sentry.captureException(error, context ? { tags: context } : undefined)
}

export { Sentry }
