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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: colors.forest,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  lg: {
    shadowColor: colors.forest,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
} as const satisfies Record<string, ViewStyle>

export type ShadowToken = keyof typeof shadows
