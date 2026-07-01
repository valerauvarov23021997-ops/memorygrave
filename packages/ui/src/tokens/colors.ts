/**
 * Цветовые токены «Warm Minimal».
 * ЕДИНСТВЕННЫЙ источник цветов. Хардкод HEX в компонентах запрещён.
 */
export const colors = {
  // Основные
  forest: '#1C3318', // Primary: CTA-кнопки, активные иконки, заголовки
  moss: '#2E5028', // Secondary: hover, фоны заголовков секций
  sage: '#5A8A52', // Accent: иконки, бейджи, переключатели, активные чипы
  sageL: '#8EBD86', // Вторичный акцент, текст на тёмном фоне
  sageXL: '#C4DEC0', // Бледный: фон success-карточек, аватары
  cream: '#FAF7F2', // Основной фон всех экранов
  parchment: '#F0EBE0', // Поля ввода, карточки, вторичные поверхности
  linen: '#EDE7D9', // Разделители, рамки карточек, фон чипов
  stone: '#C8BEA8', // Плейсхолдеры, неактивные иконки
  gold: '#B8935A', // ТОЛЬКО звёзды рейтинга и премиум-акценты
  ink: '#1A1A14', // Основной текст
  muted: '#6B6B5E', // Вторичный текст, описания, подписи
  light: '#9A9A8E', // Третичный: даты, метаданные, плейсхолдеры
  // Семантические
  successBg: '#EAF3DE',
  success: '#27500A',
  warningBg: '#FFF8E8',
  warning: '#854F0B',
  errorBg: '#FCEBEB',
  error: '#9B1C1C',
  infoBg: '#E6F1FB',
  info: '#185FA5',
  white: '#FFFFFF',
} as const

export type ColorToken = keyof typeof colors
