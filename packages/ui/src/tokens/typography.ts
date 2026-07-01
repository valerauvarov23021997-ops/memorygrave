import type { TextStyle } from 'react-native'

/**
 * Типографика: Playfair Display (заголовки, имена людей) + DM Sans (остальное).
 * Никаких fontWeight 700+ — для этой ниши выглядит грубо.
 */
export const typography = {
  // Playfair Display (пакет не содержит вес 300 Light — используем 400 Regular)
  displayLg: { fontFamily: 'PlayfairDisplay_400Regular', fontSize: 34, lineHeight: 42 },
  displayMd: { fontFamily: 'PlayfairDisplay_500Medium', fontSize: 22, lineHeight: 28 },
  headingLg: { fontFamily: 'PlayfairDisplay_500Medium', fontSize: 18, lineHeight: 24 },
  priceDisplay: { fontFamily: 'PlayfairDisplay_400Regular', fontSize: 28, lineHeight: 34 },

  // DM Sans (пакет не содержит вес 300 Light — используем 400 Regular)
  headingMd: { fontFamily: 'DMSans_500Medium', fontSize: 15, lineHeight: 22 },
  bodyLg: { fontFamily: 'DMSans_400Regular', fontSize: 16, lineHeight: 26 },
  bodyMd: { fontFamily: 'DMSans_400Regular', fontSize: 14, lineHeight: 22 },
  bodySm: { fontFamily: 'DMSans_400Regular', fontSize: 13, lineHeight: 20 },
  caption: { fontFamily: 'DMSans_400Regular', fontSize: 11, lineHeight: 16 },
  micro: { fontFamily: 'DMSans_400Regular', fontSize: 10, lineHeight: 14 },
  label: { fontFamily: 'DMSans_500Medium', fontSize: 13, lineHeight: 18 },
  buttonLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 1.0,
    textTransform: 'uppercase',
  },
  sectionLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
} as const satisfies Record<string, TextStyle>

export type TypographyToken = keyof typeof typography

/** Семейства шрифтов для загрузки через expo-font (useFonts). */
export const fontFamilies = [
  'PlayfairDisplay_400Regular',
  'PlayfairDisplay_500Medium',
  'DMSans_400Regular',
  'DMSans_500Medium',
] as const
