import type { ViewStyle } from 'react-native'

import { colors } from './colors'

/**
 * Мягкие тёплые тени для глубины. Тень окрашена в лесной тон, а не чёрная —
 * так глубина остаётся деликатной и «дорогой», в духе Warm Minimal.
 * iOS — shadow*, Android — elevation.
 */
export const shadows = {
  none: {},
  sm: {
    shadowColor: colors.forest,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: colors.forest,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 5,
  },
  lg: {
    shadowColor: colors.forest,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 10,
  },
} as const satisfies Record<string, ViewStyle>

export type ShadowToken = keyof typeof shadows
