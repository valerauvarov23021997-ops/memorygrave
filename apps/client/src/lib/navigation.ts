import { router } from 'expo-router'

/**
 * «Назад», а если экран открыт по ссылке (уведомление, QR-код, deeplink)
 * и истории нет — на главную. Простой router.back() в этом случае
 * молча ничего не делал: стресс-обход нашёл 15 таких «мёртвых» кнопок.
 */
export function goBack(): void {
  if (router.canGoBack()) router.back()
  else router.replace('/(tabs)')
}
