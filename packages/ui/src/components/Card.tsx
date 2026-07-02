import React from 'react'
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'

import { type ThemeColors } from '../tokens/colors'
import { shadowFor, type ShadowToken } from '../tokens/shadows'
import { radii, spacing } from '../tokens/spacing'
import { useColors } from '../theme/ThemeProvider'

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

const defaultShadow: Record<CardVariant, ShadowToken> = {
  default: 'sm',
  surface: 'none',
  featured: 'md',
  success: 'none',
  warning: 'none',
}

function variantStyle(variant: CardVariant, c: ThemeColors): ViewStyle {
  switch (variant) {
    case 'surface':
      return { backgroundColor: c.parchment }
    case 'featured':
      return { backgroundColor: c.forest, borderWidth: 1, borderColor: c.forest }
    case 'success':
      return { backgroundColor: c.successBg, borderWidth: 0.5, borderColor: c.sageL }
    case 'warning':
      return { backgroundColor: c.warningBg, borderWidth: 0.5, borderColor: c.gold }
    case 'default':
    default:
      return { backgroundColor: c.white, borderWidth: 0.5, borderColor: c.linen }
  }
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function Card({ children, variant = 'default', padding = 'md', onPress, style, shadow }: CardProps) {
  const c = useColors()
  const scale = useSharedValue(1)
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  const composed: ViewStyle[] = [
    styles.base,
    variantStyle(variant, c),
    shadowFor(shadow ?? defaultShadow[variant], c),
    { padding: paddingValues[padding] },
    style,
  ].filter(Boolean) as ViewStyle[]

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
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
