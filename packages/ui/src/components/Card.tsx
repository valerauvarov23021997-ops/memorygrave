import React from 'react'
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'

import { colors } from '../tokens/colors'
import { shadows, type ShadowToken } from '../tokens/shadows'
import { radii, spacing } from '../tokens/spacing'
import { haptics } from '../utils/haptics'

type CardVariant = 'default' | 'surface' | 'featured' | 'success' | 'warning'
type Padding = 'sm' | 'md' | 'lg'

interface CardProps {
  children: React.ReactNode
  variant?: CardVariant
  padding?: Padding
  onPress?: () => void
  style?: ViewStyle
  /** Переопределить тень; по умолчанию зависит от варианта. */
  shadow?: ShadowToken
}

const paddingValues: Record<Padding, number> = {
  sm: spacing.sm,
  md: spacing.md,
  lg: spacing.lg,
}

// Тень по варианту: приподнятые белые карточки светятся мягко,
// «поверхности» (parchment) остаются плоскими.
const defaultShadow: Record<CardVariant, ShadowToken> = {
  default: 'sm',
  surface: 'none',
  featured: 'md',
  success: 'none',
  warning: 'none',
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function Card({ children, variant = 'default', padding = 'md', onPress, style, shadow }: CardProps) {
  const scale = useSharedValue(1)
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  const composed: ViewStyle[] = [
    styles.base,
    variantStyles[variant],
    shadows[shadow ?? defaultShadow[variant]],
    { padding: paddingValues[padding] },
    style,
  ].filter(Boolean) as ViewStyle[]

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={() => {
          haptics.light()
          onPress()
        }}
        onPressIn={() => {
          scale.value = withSpring(0.98, { duration: 90 })
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { duration: 90 })
        }}
        style={[composed, animatedStyle]}
      >
        {children}
      </AnimatedPressable>
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
