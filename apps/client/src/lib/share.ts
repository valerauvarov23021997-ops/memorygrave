import { Platform, Share } from 'react-native'

type ShareResult = 'shared' | 'copied' | 'cancelled'

interface WebNavigator {
  share?: unknown
  clipboard?: { writeText: (text: string) => Promise<void> }
}

/**
 * «Поделиться»: системное окно, а там, где его нет (браузер на компьютере), —
 * копирование текста в буфер. Раньше в вебе кнопки «Поделиться» молча ничего
 * не делали — их нашёл стресс-обход. 'copied' — экрану стоит показать тост.
 */
export async function shareText(message: string, url?: string): Promise<ShareResult> {
  const nav = (globalThis as { navigator?: WebNavigator }).navigator
  if (Platform.OS === 'web' && !nav?.share) {
    try {
      await nav?.clipboard?.writeText(message)
      return 'copied'
    } catch {
      return 'cancelled'
    }
  }
  try {
    await Share.share(url ? { message, url } : { message })
    return 'shared'
  } catch {
    // пользователь мог закрыть окно шэринга — не ошибка
    return 'cancelled'
  }
}
