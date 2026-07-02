import React from 'react'
import { ActivityIndicator, Pressable, StyleSheet, type TextStyle, type ViewStyle } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'

import { type ThemeColors } from '../tokens/colors'
import { radii, spacing } from '../tokens/spacing'
import { typography } from '../tokens/typography'
import { useColors } from '../theme/ThemeProvider'
import { Text } from './Text'

type Variant = 'primary' | 'secondary' | 'destructive' | 'ghost'

interface ButtonProps {
  label: string
  onPress: () => void
  variant?: Variant
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

function containerFor(variant: Variant, c: ThemeColors): ViewStyle {
  switch (variant) {
    case 'secondary':
      return { backgroundColor: 'transparent', borderWidth: 1, borderColor: c.forest }
    case 'destructive':
      return { backgroundColor: 'transparent', borderWidth: 1, borderColor: c.error }
    case 'ghost':
      return { backgroundColor: 'transparent' }
    case 'primary':
    default:
      return { backgroundColor: c.forest }
  }
}

function labelColor(variant: Variant, c: ThemeColors): string {
  switch (variant) {
    case 'secondary':
      return c.forest
    case 'destructive':
      return c.error
    case 'ghost':
      return c.muted
    case 'primary':
    default:
      return c.cream
  }
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
}: ButtonProps) {
  const c = useColors()
  const scale = useSharedValue(1)
  const isDisabled = disabled || loading

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  const containerStyle: ViewStyle[] = [
    styles.base,
    containerFor(variant, c),
    variant === 'ghost' && styles.ghost,
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
  ].filter(Boolean) as ViewStyle[]

  const labelStyle: TextStyle = {
    ...typography.buttonLabel,
    color: labelColor(variant, c),
    ...(variant === 'ghost' ? { textDecorationLine: 'underline', textTransform: 'none', letterSpacing: 0 } : {}),
  }

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.96, { duration: 80 })
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { duration: 80 })
      }}
      style={[containerStyle, animatedStyle]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? c.cream : c.forest} />
      ) : (
        <Text style={labelStyle}>{label}</Text>
      )}
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radii.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: { alignSelf: 'stretch' },
  disabled: { opacity: 0.4 },
  ghost: { height: undefined, paddingVertical: spacing.sm },
})
