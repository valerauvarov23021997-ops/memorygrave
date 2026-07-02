import { FlameLogo } from '@pamyat/ui'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg'
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'

const LETTERS = 'Память'.split('')

/**
 * Анимированный сплэш: свеча разгорается, слово «Память» прорисовывается
 * по буквам, с тактильной отдачей. Играет поверх нативного сплэша, пока
 * приложение готовится, затем плавно исчезает.
 */
export function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const flame = useSharedValue(0) // разгорание пламени
  const flicker = useSharedValue(0) // колыхание
  const letters = useSharedValue(0) // прорисовка слова
  const tagline = useSharedValue(0) // подпись
  const fade = useSharedValue(1) // общий фейд-аут

  useEffect(() => {
    // Пламя разгорается
    flame.value = withDelay(180, withTiming(1, { duration: 720, easing: Easing.out(Easing.back(1.4)) }))
    // Лёгкое колыхание огонька
    flicker.value = withDelay(
      900,
      withRepeat(withSequence(withTiming(1, { duration: 140 }), withTiming(0, { duration: 180 })), -1, true)
    )
    // Слово прорисовывается
    letters.value = withDelay(760, withTiming(1, { duration: 820, easing: Easing.out(Easing.cubic) }))
    // Подпись
    tagline.value = withDelay(1500, withTiming(1, { duration: 500 }))
    // Финальный фейд-аут → onFinish
    fade.value = withDelay(
      2050,
      withTiming(0, { duration: 460, easing: Easing.in(Easing.cubic) }, finished => {
        if (finished) runOnJS(onFinish)()
      })
    )

    // Тактильная отдача: удар в момент зажигания и мягкий успех в конце
    const t1 = setTimeout(() => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 340)
    const t2 = setTimeout(() => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 1560)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [flame, flicker, letters, tagline, fade, onFinish])

  const rootStyle = useAnimatedStyle(() => ({ opacity: fade.value }))

  const glowStyle = useAnimatedStyle(() => ({
    opacity: flame.value * (0.28 + flicker.value * 0.12),
    transform: [{ scale: 0.6 + flame.value * 0.7 + flicker.value * 0.06 }],
  }))

  const flameStyle = useAnimatedStyle(() => ({
    opacity: flame.value,
    transform: [
      { scale: interpolate(flame.value, [0, 1], [0.35, 1]) * (1 + flicker.value * 0.03) },
      { rotate: `${(flicker.value - 0.5) * 2}deg` },
    ],
  }))

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: tagline.value,
    transform: [{ translateY: (1 - tagline.value) * 8 }],
  }))

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, rootStyle]} pointerEvents="none">
      <LinearGradient
        colors={['#24401E', '#1C3318', '#12200E']}
        locations={[0, 0.5, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.center}>
        <View style={styles.flameBox}>
          <Animated.View style={[styles.glow, glowStyle]}>
            <Svg width={260} height={260}>
              <Defs>
                <RadialGradient id="bloom" cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor="#F0D89A" stopOpacity={0.9} />
                  <Stop offset="0.45" stopColor="#D9B36B" stopOpacity={0.5} />
                  <Stop offset="1" stopColor="#D9B36B" stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Circle cx={130} cy={130} r={130} fill="url(#bloom)" />
            </Svg>
          </Animated.View>
          <Animated.View style={flameStyle}>
            <FlameLogo size={132} withRing={false} />
          </Animated.View>
        </View>

        <View style={styles.word}>
          {LETTERS.map((ch, i) => (
            <Letter key={i} char={ch} index={i} progress={letters} />
          ))}
        </View>

        <Animated.Text style={[styles.tagline, taglineStyle]}>Сервис заботы о близких</Animated.Text>
      </View>
    </Animated.View>
  )
}

/** Одна буква слова — проявляется со сдвигом вверх со своей задержкой. */
function Letter({ char, index, progress }: { char: string; index: number; progress: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const start = index * 0.12
    const p = interpolate(progress.value, [start, start + 0.4], [0, 1], 'clamp')
    return { opacity: p, transform: [{ translateY: (1 - p) * 14 }] }
  })
  return <Animated.Text style={[styles.letter, style]}>{char}</Animated.Text>
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center' },
  flameBox: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center' },
  glow: {
    position: 'absolute',
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  word: { flexDirection: 'row', marginTop: 8 },
  letter: {
    fontFamily: 'PlayfairDisplay_500Medium',
    fontSize: 46,
    color: '#FAF7F2',
    letterSpacing: 1,
  },
  tagline: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: 'rgba(250,247,242,0.6)',
    marginTop: 16,
    letterSpacing: 0.5,
  },
})
