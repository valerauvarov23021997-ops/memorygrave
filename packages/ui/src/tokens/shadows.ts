import type { ViewStyle } from 'react-native'

import { colors, type ThemeColors } from './colors'

/**
 * Мягкие тёплые тени для глубины. Тень окрашена в лесной тон темы.
 * iOS — shadow*, Android — elevation.
 */
export type ShadowToken = 'none' | 'sm' | 'md' | 'lg'

const geometry: Record<ShadowToken, ViewStyle> = {
  none: {},
  sm: { shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 2 },
  md: { shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.14, shadowRadius: 16, elevation: 5 },
  lg: { shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.18, shadowRadius: 28, elevation: 10 },
}

/** Тень под текущую палитру. */
export function shadowFor(token: ShadowToken, c: ThemeColors): ViewStyle {
  if (token === 'none') return {}
  return { shadowColor: c.forest, ...geometry[token] }
}

/** Статичные тени (светлая тема) — для стилей вне темы. */
export const shadows: Record<ShadowToken, ViewStyle> = {
  none: {},
  sm: shadowFor('sm', colors),
  md: shadowFor('md', colors),
  lg: shadowFor('lg', colors),
}
