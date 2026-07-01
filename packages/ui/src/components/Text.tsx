import React from 'react'
import { Text as RNText, type TextProps as RNTextProps, StyleSheet } from 'react-native'

import { colors, type ColorToken } from '../tokens/colors'
import { typography, type TypographyToken } from '../tokens/typography'

interface TextProps extends RNTextProps {
  variant?: TypographyToken
  color?: ColorToken
  center?: boolean
}

/**
 * Типографический Text: применяет токен стиля и цвет.
 * Избавляет экраны от ручного связывания typography + colors.
 */
export function Text({
  variant = 'bodyMd',
  color = 'ink',
  center = false,
  style,
  ...rest
}: TextProps) {
  return (
    <RNText
      style={[typography[variant], { color: colors[color] }, center && styles.center, style]}
      {...rest}
    />
  )
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
})
