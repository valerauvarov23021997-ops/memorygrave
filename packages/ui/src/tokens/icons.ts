/**
 * Маппинг семантических имён на иконки Phosphor (outline).
 * Одна библиотека на весь проект — не смешивать с Feather.
 */
export const icons = {
  // Bottom Tab
  search: 'MagnifyingGlass',
  saved: 'Heart',
  orders: 'ShoppingBag',
  profile: 'User',
  // Услуги
  cleaning: 'Broom',
  flowers: 'Flower',
  candles: 'Flame',
  headstone: 'Square',
  bench: 'Armchair',
  fence: 'Fence',
  // Действия
  mapPin: 'MapPin',
  camera: 'Camera',
  checkCircle: 'CheckCircle',
  bell: 'Bell',
  lock: 'Lock',
  share: 'Upload',
  edit: 'PencilSimple',
  support: 'ChatCircleText',
  settings: 'Gear',
  cake: 'Cake',
  candle: 'Candle',
  back: 'CaretLeft',
  close: 'X',
  plus: 'Plus',
  chevronRight: 'CaretRight',
} as const

export type IconName = keyof typeof icons
/** Имена, которыми оперирует phosphor-react-native. */
export type PhosphorIconName = (typeof icons)[IconName]
