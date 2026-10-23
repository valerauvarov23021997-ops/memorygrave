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
  // в Phosphor нет «Fence» — пустая иконка в каталоге; решётка ближе всего к оградке
  fence: 'GridFour',
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
  // в Phosphor нет «Candle» — был пустой круг в «Ближайшей дате»
  candle: 'Flame',
  back: 'CaretLeft',
  close: 'X',
  plus: 'Plus',
  chevronRight: 'CaretRight',
} as const

/**
 * Имена из базы (services.icon), которых нет в Phosphor, → существующие.
 * Услуги приходят строкой с сервера, поэтому чиним и на стороне приложения.
 */
export const iconAliases: Record<string, string> = {
  Fence: 'GridFour',
  Candle: 'Flame',
}

export type IconName = keyof typeof icons
/** Имена, которыми оперирует phosphor-react-native. */
export type PhosphorIconName = (typeof icons)[IconName]
