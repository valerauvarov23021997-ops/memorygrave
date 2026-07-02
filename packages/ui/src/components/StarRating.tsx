import * as Phosphor from 'phosphor-react-native'
import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated'

import { MIN_TOUCH_TARGET } from '../tokens/spacing'
import { haptics } from '../utils/haptics'
import { useColors } from '../theme/ThemeProvider'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  size?: number
}

const AnimatedStar = Animated.createAnimatedComponent(Phosphor.Star)

export function StarRating({ value, onChange, size = 24 }: StarRatingProps) {
  const readonly = !onChange
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map(index => (
        <Star
          key={index}
          index={index}
          filled={index <= value}
          size={size}
          readonly={readonly}
          onPress={() => onChange?.(index)}
        />
      ))}
    </View>
  )
}

function Star({
  index,
  filled,
  size,
  readonly,
  onPress,
}: {
  index: number
  filled: boolean
  size: number
  readonly: boolean
  onPress: () => void
}) {
  const c = useColors()
  const scale = useSharedValue(1)
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  const handlePress = () => {
    haptics.selection()
    scale.value = withSequence(withSpring(1.3, { duration: 75 }), withSpring(1, { duration: 75 }))
    onPress()
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Оценка ${index}`}
      disabled={readonly}
      onPress={handlePress}
      hitSlop={8}
      style={styles.star}
    >
      <AnimatedStar
        size={size}
        weight={filled ? 'fill' : 'regular'}
        color={filled ? c.gold : c.stone}
        style={animatedStyle}
      />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4 },
  star: { minHeight: MIN_TOUCH_TARGET, minWidth: MIN_TOUCH_TARGET, alignItems: 'center', justifyContent: 'center' },
})
