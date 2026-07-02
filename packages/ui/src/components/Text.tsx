import React from 'react'
import { Text as RNText, type TextProps as RNTextProps, StyleSheet } from 'react-native'

import { type ColorToken } from '../tokens/colors'
import { typography, type TypographyToken } from '../tokens/typography'
import { useColors } from '../theme/ThemeProvider'

interface TextProps extends RNTextProps {
  variant?: TypographyToken
  color?: ColorToken
  center?: boolean
}

/**
 * Типографический Text: применяет токен стиля и цвет из активной темы.
 */
export function Text({
  variant = 'bodyMd',
  color = 'ink',
  center = false,
  style,
  ...rest
}: TextProps) {
  const c = useColors()
  return (
    <RNText
      style={[typography[variant], { color: c[color] }, center && styles.center, style]}
      {...rest}
    />
  )
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
})
