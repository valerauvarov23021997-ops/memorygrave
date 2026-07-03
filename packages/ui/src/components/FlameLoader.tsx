import React, { useEffect, useId } from 'react'
import { StyleSheet, View } from 'react-native'
import Svg, { Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'

// Фирменное пламя (как в логотипе и свече памяти)
const FLAME = 'M50,6 C64,38 79,50 79,80 C79,106 66,122 50,124 C34,122 21,106 21,80 C21,50 36,38 50,6 Z'
const CORE = 'M50,44 C60,62 67,70 67,90 C67,105 59,115 50,116 C41,115 33,105 33,90 C33,70 40,62 50,44 Z'

interface FlameLoaderProps {
  /** Высота огонька, px. */
  size?: number
  /** Тёплое свечение вокруг (для тёмных фонов). */
  glow?: boolean
}

/**
 * Фирменный индикатор загрузки — маленький живой огонёк.
 * Используется вместо системного спиннера в моменты ожидания.
 */
export function FlameLoader({ size = 28, glow = true }: FlameLoaderProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const flicker = useSharedValue(0)

  useEffect(() => {
    flicker.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 420, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    )
  }, [flicker])

  const flameStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${(flicker.value - 0.5) * 5}deg` },
      { scaleY: 0.92 + flicker.value * 0.12 },
      { scaleX: 1 - flicker.value * 0.05 },
    ],
  }))

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.45 + flicker.value * 0.3,
  }))

  const w = size * (100 / 140)
  const glowSize = size * 2.2

  return (
    <View style={[styles.box, { width: glowSize, height: glowSize }]}>
      {glow ? (
        <Animated.View style={[StyleSheet.absoluteFill, glowStyle]} pointerEvents="none">
          <Svg width={glowSize} height={glowSize}>
            <Defs>
              <RadialGradient id={`flg${uid}`} cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor="#F3DFA6" stopOpacity={0.8} />
                <Stop offset="0.55" stopColor="#D9B36B" stopOpacity={0.3} />
                <Stop offset="1" stopColor="#D9B36B" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect x={0} y={0} width={glowSize} height={glowSize} fill={`url(#flg${uid})`} />
          </Svg>
        </Animated.View>
      ) : null}
      <Animated.View style={flameStyle}>
        <Svg width={w} height={size} viewBox="0 0 100 140">
          <Defs>
            <LinearGradient id={`flf${uid}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#D9B36B" />
              <Stop offset="0.55" stopColor="#B8935A" />
              <Stop offset="1" stopColor="#9A6E2E" />
            </LinearGradient>
            <LinearGradient id={`flc${uid}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFF7E4" />
              <Stop offset="1" stopColor="#FCEAC0" />
            </LinearGradient>
          </Defs>
          <Path d={FLAME} fill={`url(#flf${uid})`} />
          <Path d={CORE} fill={`url(#flc${uid})`} />
        </Svg>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
})
