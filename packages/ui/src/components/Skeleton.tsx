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

import { colors } from '../tokens/colors'
import { radii } from '../tokens/spacing'

interface SkeletonProps {
  width: DimensionValue
  height: number
  radius?: number
}

/** Shimmer-заглушка вместо спиннера. Цикл parchment → linen → parchment. */
export function Skeleton({ width, height, radius = radii.md }: SkeletonProps) {
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 1500, easing: Easing.linear }), -1, false)
  }, [progress])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (progress.value - 0.5) * 200 }],
  }))

  return (
    <View style={[styles.container, { width, height, borderRadius: radius }]}>
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <LinearGradient
          colors={[colors.parchment, colors.linen, colors.parchment]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.parchment, overflow: 'hidden' },
})
