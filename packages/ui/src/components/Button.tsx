import React from 'react'
import { ActivityIndicator, Pressable, StyleSheet, type ViewStyle } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'

import { colors } from '../tokens/colors'
import { radii, spacing } from '../tokens/spacing'
import { typography } from '../tokens/typography'
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

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
}: ButtonProps) {
  const scale = useSharedValue(1)
  const isDisabled = disabled || loading

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  const containerStyle: ViewStyle[] = [
    styles.base,
    variantStyles[variant],
    variant === 'ghost' && styles.ghost,
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
  ].filter(Boolean) as ViewStyle[]

  const spinnerColor = variant === 'primary' ? colors.cream : colors.forest

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
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <Text style={[typography.buttonLabel, labelStyles[variant], variant === 'ghost' && styles.ghostLabel]}>
          {label}
        </Text>
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
  ghostLabel: { textDecorationLine: 'underline', textTransform: 'none', letterSpacing: 0 },
})

const variantStyles: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: colors.forest },
  secondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.forest },
  destructive: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.error },
  ghost: { backgroundColor: 'transparent' },
}

const labelStyles = StyleSheet.create({
  primary: { color: colors.cream },
  secondary: { color: colors.forest },
  destructive: { color: colors.error },
  ghost: { color: colors.muted },
})
