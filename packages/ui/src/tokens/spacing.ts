export const spacing = {
  xs: 4, // между inline-элементами
  sm: 8, // gap внутри секции
  md: 12, // padding компактной карточки
  lg: 16, // горизонтальный отступ экрана (от края до контента)
  xl: 24, // gap между секциями
  xxl: 32,
} as const

export const radii = {
  sm: 8,
  md: 12, // поля ввода, компактные элементы
  lg: 16, // карточки по умолчанию
  xl: 24, // BottomSheet, крупные поверхности
  full: 999, // круглые (badge, avatar)
} as const

/** Минимальный touch target для ВСЕХ нажимаемых элементов. */
export const MIN_TOUCH_TARGET = 44

export const iconSizes = {
  inline: 20, // в строках, карточках
  nav: 22, // Bottom Tab
  deco: 28, // декоративные в хедерах
} as const

export type SpacingToken = keyof typeof spacing
export type RadiusToken = keyof typeof radii
