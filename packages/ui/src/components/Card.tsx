import React from 'react'
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native'

import { colors } from '../tokens/colors'
import { radii, spacing } from '../tokens/spacing'

type CardVariant = 'default' | 'surface' | 'featured' | 'success' | 'warning'
type Padding = 'sm' | 'md' | 'lg'

interface CardProps {
  children: React.ReactNode
  variant?: CardVariant
  padding?: Padding
  onPress?: () => void
  style?: ViewStyle
}

const paddingValues: Record<Padding, number> = {
  sm: spacing.sm,
  md: spacing.md,
  lg: spacing.lg,
}

export function Card({ children, variant = 'default', padding = 'md', onPress, style }: CardProps) {
  const composed: ViewStyle[] = [
    styles.base,
    variantStyles[variant],
    { padding: paddingValues[padding] },
    style,
  ].filter(Boolean) as ViewStyle[]

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={composed}>
        {children}
      </Pressable>
    )
  }
  return <View style={composed}>{children}</View>
}

const styles = StyleSheet.create({
  base: { borderRadius: radii.lg },
})

const variantStyles: Record<CardVariant, ViewStyle> = {
  default: { backgroundColor: colors.white, borderWidth: 0.5, borderColor: colors.linen },
  surface: { backgroundColor: colors.parchment },
  featured: { backgroundColor: colors.forest, borderWidth: 1, borderColor: colors.forest },
  success: { backgroundColor: colors.successBg, borderWidth: 0.5, borderColor: colors.sageL },
  warning: { backgroundColor: colors.warningBg, borderWidth: 0.5, borderColor: '#D4A060' },
}
