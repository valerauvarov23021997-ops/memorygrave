import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect } from 'react'
import { StyleSheet, View, type DimensionValue } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'

import { radii } from '../tokens/spacing'
import { useColors } from '../theme/ThemeProvider'

interface SkeletonProps {
  width: DimensionValue
  height: number
  radius?: number
}

/** Shimmer-заглушка вместо спиннера. Цикл parchment → linen → parchment. */
export function Skeleton({ width, height, radius = radii.md }: SkeletonProps) {
  const c = useColors()
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 1500, easing: Easing.linear }), -1, false)
  }, [progress])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (progress.value - 0.5) * 200 }],
  }))

  return (
    <View style={[styles.container, { width, height, borderRadius: radius, backgroundColor: c.parchment }]}>
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <LinearGradient
          colors={[c.parchment, c.linen, c.parchment]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
})
