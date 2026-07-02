import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Svg, {
  ClipPath,
  Defs,
  LinearGradient as SvgGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg'
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'

const LETTERS = 'Память'.split('')
const AnimatedRect = Animated.createAnimatedComponent(Rect)

// Контур пламени (viewBox 0 0 100 140, кончик сверху, низ ≈124)
const FLAME = 'M50,6 C64,38 79,50 79,80 C79,106 66,122 50,124 C34,122 21,106 21,80 C21,50 36,38 50,6 Z'

/**
 * Нежный анимированный запуск: на светлом фоне пламя тихо наливается
 * золотом снизу вверх, тёплое свечение мягко расходится, слово «Память»
 * плавно проявляется. Лёгкая тактильная отдача. Затем спокойно уступает
 * место приложению.
 */
export function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const fill = useSharedValue(0) // наполнение пламени снизу вверх
  const breathe = useSharedValue(0) // тихое «дыхание» свечения
  const letters = useSharedValue(0) // проявление слова
  const tagline = useSharedValue(0) // подпись
  const fade = useSharedValue(1) // мягкий уход

  useEffect(() => {
    const soft = Easing.inOut(Easing.ease)
    // Пламя медленно наливается снизу вверх
    fill.value = withDelay(400, withTiming(1, { duration: 1700, easing: soft }))
    // Едва заметное дыхание свечения
    breathe.value = withDelay(
      1900,
      withRepeat(withSequence(withTiming(1, { duration: 1400, easing: soft }), withTiming(0, { duration: 1400, easing: soft })), -1, true)
    )
    // Слово проявляется мягко и небыстро
    letters.value = withDelay(1200, withTiming(1, { duration: 1500, easing: Easing.out(Easing.ease) }))
    // Подпись
    tagline.value = withDelay(2600, withTiming(1, { duration: 800, easing: soft }))
    // Спокойный уход
    fade.value = withDelay(
      3500,
      withTiming(0, { duration: 750, easing: Easing.inOut(Easing.ease) }, finished => {
        if (finished) runOnJS(onFinish)()
      })
    )

    // Мягкая тактильная отдача: когда огонёк наполнился и когда слово готово
    const t1 = setTimeout(() => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 1500)
    const t2 = setTimeout(() => void Haptics.selectionAsync(), 2900)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [fill, breathe, letters, tagline, fade, onFinish])

  const rootStyle = useAnimatedStyle(() => ({ opacity: fade.value }))

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(fill.value, [0, 1], [0, 0.55]) + breathe.value * 0.12,
    transform: [{ scale: 0.7 + fill.value * 0.4 + breathe.value * 0.05 }],
  }))

  // Прямоугольник-заливка поднимается снизу вверх внутри контура пламени
  const fillProps = useAnimatedProps(() => {
    const h = fill.value * 120
    return { y: 124 - h, height: h }
  })

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: tagline.value,
    transform: [{ translateY: (1 - tagline.value) * 8 }],
  }))

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, rootStyle]} pointerEvents="none">
      <LinearGradient
        colors={['#FDFBF6', '#F5EFE3', '#EFE7D7']}
        locations={[0, 0.55, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.center}>
        <View style={styles.flameBox}>
          <Animated.View style={[styles.glow, glowStyle]}>
            <Svg width={280} height={280}>
              <Defs>
                <RadialGradient id="bloom" cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor="#F3DFA6" stopOpacity={0.85} />
                  <Stop offset="0.5" stopColor="#E4C67E" stopOpacity={0.4} />
                  <Stop offset="1" stopColor="#E4C67E" stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Rect x={0} y={0} width={280} height={280} fill="url(#bloom)" />
            </Svg>
          </Animated.View>

          <Svg width={150} height={210} viewBox="0 0 100 140">
            <Defs>
              <SvgGradient id="fire" x1="0" y1="1" x2="0" y2="0">
                <Stop offset="0" stopColor="#B8935A" />
                <Stop offset="0.55" stopColor="#D9B36B" />
                <Stop offset="1" stopColor="#F6E6BE" />
              </SvgGradient>
              <ClipPath id="flameClip">
                <Path d={FLAME} />
              </ClipPath>
            </Defs>
            {/* Пустой контур свечи — тёплый и светлый */}
            <Path d={FLAME} fill="#F3EAD8" stroke="#D9C39A" strokeWidth={1.4} />
            {/* Наливающийся снизу вверх огонь */}
            <AnimatedRect x={0} width={100} fill="url(#fire)" clipPath="url(#flameClip)" animatedProps={fillProps} />
          </Svg>
        </View>

        <View style={styles.word}>
          {LETTERS.map((ch, i) => (
            <Letter key={i} char={ch} index={i} progress={letters} />
          ))}
        </View>

        <Animated.Text style={[styles.tagline, taglineStyle]}>Светлая память рядом</Animated.Text>
      </View>
    </Animated.View>
  )
}

/** Одна буква слова — мягко проявляется со сдвигом вверх со своей задержкой. */
function Letter({ char, index, progress }: { char: string; index: number; progress: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const start = index * 0.13
    const p = interpolate(progress.value, [start, start + 0.5], [0, 1], 'clamp')
    return { opacity: p, transform: [{ translateY: (1 - p) * 12 }] }
  })
  return <Animated.Text style={[styles.letter, style]}>{char}</Animated.Text>
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center' },
  flameBox: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center' },
  glow: {
    position: 'absolute',
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  word: { flexDirection: 'row', marginTop: 18 },
  letter: {
    fontFamily: 'PlayfairDisplay_500Medium',
    fontSize: 48,
    color: '#1C3318',
    letterSpacing: 1,
  },
  tagline: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: '#8A8575',
    marginTop: 16,
    letterSpacing: 0.5,
  },
})
