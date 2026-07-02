import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
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
} from 'react-native-reanimated'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)
const AnimatedRect = Animated.createAnimatedComponent(Rect)

// Контур пламени (viewBox 0 0 100 140, кончик сверху, низ ≈124)
const FLAME = 'M50,6 C64,38 79,50 79,80 C79,106 66,122 50,124 C34,122 21,106 21,80 C21,50 36,38 50,6 Z'
const RING_R = 66
const RING_C = 2 * Math.PI * RING_R

const GOLD = '#C2A05A'

/**
 * Премиальный минималистичный запуск: на светлом фоне тонкое золотое кольцо
 * прорисовывается вокруг огонька, пламя тихо наливается снизу вверх, слово
 * «Память» проявляется с оседающей разрядкой, под ним раскрывается волосяная
 * линия и трекинговый подзаголовок. Мягкая тактильная отдача.
 */
export function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const ring = useSharedValue(0) // прорисовка кольца
  const fill = useSharedValue(0) // наполнение пламени
  const breathe = useSharedValue(0) // тихое дыхание свечения
  const word = useSharedValue(0) // проявление слова
  const rule = useSharedValue(0) // линия-разделитель
  const tag = useSharedValue(0) // подзаголовок
  const fade = useSharedValue(1) // уход

  useEffect(() => {
    const soft = Easing.inOut(Easing.ease)
    ring.value = withDelay(300, withTiming(1, { duration: 1150, easing: soft }))
    fill.value = withDelay(850, withTiming(1, { duration: 1300, easing: soft }))
    breathe.value = withDelay(
      2200,
      withRepeat(withSequence(withTiming(1, { duration: 1500, easing: soft }), withTiming(0, { duration: 1500, easing: soft })), -1, true)
    )
    word.value = withDelay(1900, withTiming(1, { duration: 950, easing: Easing.out(Easing.cubic) }))
    rule.value = withDelay(2550, withTiming(1, { duration: 550, easing: soft }))
    tag.value = withDelay(2900, withTiming(1, { duration: 750, easing: soft }))
    fade.value = withDelay(
      3800,
      withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) }, finished => {
        if (finished) runOnJS(onFinish)()
      })
    )

    const t1 = setTimeout(() => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 1900)
    const t2 = setTimeout(() => void Haptics.selectionAsync(), 3000)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [ring, fill, breathe, word, rule, tag, fade, onFinish])

  const rootStyle = useAnimatedStyle(() => ({ opacity: fade.value }))

  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: RING_C * (1 - ring.value) }))
  const innerRingProps = useAnimatedProps(() => ({ opacity: interpolate(ring.value, [0.4, 1], [0, 0.3], 'clamp') }))
  const fillProps = useAnimatedProps(() => {
    const h = fill.value * 120
    return { y: 124 - h, height: h }
  })

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(fill.value, [0, 1], [0, 0.5]) + breathe.value * 0.1,
    transform: [{ scale: 0.75 + fill.value * 0.35 + breathe.value * 0.04 }],
  }))

  const wordStyle = useAnimatedStyle(() => ({
    opacity: word.value,
    letterSpacing: interpolate(word.value, [0, 1], [18, 2]),
    transform: [{ translateY: (1 - word.value) * 10 }],
  }))
  const ruleStyle = useAnimatedStyle(() => ({ opacity: rule.value, width: rule.value * 44 }))
  const tagStyle = useAnimatedStyle(() => ({ opacity: tag.value, transform: [{ translateY: (1 - tag.value) * 6 }] }))

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, rootStyle]} pointerEvents="none">
      <LinearGradient
        colors={['#FCFAF5', '#F5EFE3', '#EEE6D6']}
        locations={[0, 0.55, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* мягкая виньетка для глубины */}
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="vignette" cx="50%" cy="44%" r="75%">
            <Stop offset="0.55" stopColor="#000000" stopOpacity={0} />
            <Stop offset="1" stopColor="#5A5240" stopOpacity={0.08} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill="url(#vignette)" />
      </Svg>

      <View style={styles.center}>
        <View style={styles.emblem}>
          <Animated.View style={[styles.glow, glowStyle]}>
            <Svg width={260} height={260}>
              <Defs>
                <RadialGradient id="bloom" cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor="#F1DBA0" stopOpacity={0.8} />
                  <Stop offset="0.5" stopColor="#DEBE76" stopOpacity={0.35} />
                  <Stop offset="1" stopColor="#DEBE76" stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Rect x={0} y={0} width={260} height={260} fill="url(#bloom)" />
            </Svg>
          </Animated.View>

          {/* Кольцо прорисовывается */}
          <Svg width={180} height={180} style={styles.ring}>
            <AnimatedCircle
              cx={90}
              cy={90}
              r={RING_R + 12}
              fill="none"
              stroke="#D8C9A8"
              strokeWidth={0.75}
              animatedProps={innerRingProps}
            />
            <G rotation={-90} origin="90, 90">
              <AnimatedCircle
                cx={90}
                cy={90}
                r={RING_R}
                fill="none"
                stroke={GOLD}
                strokeWidth={1.25}
                strokeLinecap="round"
                strokeDasharray={`${RING_C}, ${RING_C}`}
                animatedProps={ringProps}
              />
            </G>
          </Svg>

          {/* Пламя наливается снизу вверх */}
          <Svg width={92} height={128} viewBox="0 0 100 140" style={styles.flame}>
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
            <Path d={FLAME} fill="#F4ECDB" stroke="#E0D2B4" strokeWidth={1} />
            <AnimatedRect x={0} width={100} fill="url(#fire)" clipPath="url(#flameClip)" animatedProps={fillProps} />
          </Svg>
        </View>

        <Animated.Text style={[styles.word, wordStyle]}>Память</Animated.Text>
        <Animated.View style={[styles.rule, ruleStyle]} />
        <Animated.Text style={[styles.tag, tagStyle]}>ЗАБОТА О БЛИЗКИХ</Animated.Text>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center' },
  emblem: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 260, height: 260, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute' },
  flame: { position: 'absolute' },
  word: {
    fontFamily: 'PlayfairDisplay_500Medium',
    fontSize: 44,
    color: '#1C3318',
    marginTop: 30,
    paddingLeft: 18, // компенсация разрядки для оптического центрирования
  },
  rule: { height: 1, backgroundColor: GOLD, marginTop: 20, borderRadius: 1 },
  tag: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    color: '#A39A86',
    marginTop: 18,
    letterSpacing: 4,
  },
})
