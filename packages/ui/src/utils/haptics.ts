import * as Haptics from 'expo-haptics'

/**
 * Тактильная отдача. Обёрнута в try/catch и no-op на платформах без
 * поддержки (web), чтобы вызовы можно было ставить где угодно без страха.
 */
export const haptics = {
  /** Лёгкое касание — нажатия кнопок, чипов. */
  light() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
  },
  /** Среднее — переключатели, выбор даты. */
  medium() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
  },
  /** Выбор — звёзды рейтинга, шаги. */
  selection() {
    void Haptics.selectionAsync().catch(() => {})
  },
  /** Успех — заказ оформлен, оплата прошла. */
  success() {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
  },
  /** Ошибка — неверный код, ошибка оплаты. */
  error() {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {})
  },
}
