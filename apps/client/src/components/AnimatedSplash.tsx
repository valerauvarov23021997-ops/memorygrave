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
} from 'react-native-reanimated'

const AnimatedRect = Animated.createAnimatedComponent(Rect)

// Контур пламени (viewBox 0 0 100 140, кончик сверху, низ ≈124)
const FLAME = 'M50,6 C64,38 79,50 79,80 C79,106 66,122 50,124 C34,122 21,106 21,80 C21,50 36,38 50,6 Z'
// Светлое ядро пламени — как в иконке приложения
const CORE = 'M50,44 C60,62 67,70 67,90 C67,105 59,115 50,116 C41,115 33,105 33,90 C33,70 40,62 50,44 Z'

const GOLD = '#C2A05A'

/**
 * Премиальный минималистичный запуск: на светлом фоне огонёк тихо наливается
 * золотом снизу вверх в мягком тёплом свечении, слово «Память» проявляется
 * с оседающей разрядкой, под ним раскрывается волосяная линия и трекинговый
 * подзаголовок. Деликатная тактильная отдача.
 */
export function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const fill = useSharedValue(0) // наполнение пламени
  const breathe = useSharedValue(0) // тихое дыхание свечения
  const word = useSharedValue(0) // проявление слова
  const rule = useSharedValue(0) // линия-разделитель
  const tag = useSharedValue(0) // подзаголовок
  const fade = useSharedValue(1) // уход

  useEffect(() => {
    const soft = Easing.inOut(Easing.ease)
    fill.value = withDelay(450, withTiming(1, { duration: 1400, easing: soft }))
    breathe.value = withDelay(
      1950,
      withRepeat(withSequence(withTiming(1, { duration: 1500, easing: soft }), withTiming(0, { duration: 1500, easing: soft })), -1, true)
    )
    word.value = withDelay(1500, withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) }))
    rule.value = withDelay(2200, withTiming(1, { duration: 550, easing: soft }))
    tag.value = withDelay(2550, withTiming(1, { duration: 750, easing: soft }))
    fade.value = withDelay(
      3500,
      withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) }, finished => {
        if (finished) runOnJS(onFinish)()
      })
    )

    const t1 = setTimeout(() => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 1800)
    const t2 = setTimeout(() => void Haptics.selectionAsync(), 2650)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [fill, breathe, word, rule, tag, fade, onFinish])

  const rootStyle = useAnimatedStyle(() => ({ opacity: fade.value }))

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
            <Svg width={280} height={280}>
              <Defs>
                <RadialGradient id="bloom" cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor="#F1DBA0" stopOpacity={0.82} />
                  <Stop offset="0.5" stopColor="#DEBE76" stopOpacity={0.35} />
                  <Stop offset="1" stopColor="#DEBE76" stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Rect x={0} y={0} width={280} height={280} fill="url(#bloom)" />
            </Svg>
          </Animated.View>

          {/* Пламя-логотип наливается снизу вверх: внешний золотой слой + светлое ядро */}
          <Svg width={116} height={162} viewBox="0 0 100 140">
            <Defs>
              {/* Градиенты в точности как в иконке приложения */}
              <SvgGradient id="fire" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#D9B36B" />
                <Stop offset="0.55" stopColor="#B8935A" />
                <Stop offset="1" stopColor="#9A6E2E" />
              </SvgGradient>
              <SvgGradient id="fireCore" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#FFF7E4" />
                <Stop offset="1" stopColor="#FCEAC0" />
              </SvgGradient>
              <ClipPath id="flameClip">
                <Path d={FLAME} />
              </ClipPath>
              <ClipPath id="coreClip">
                <Path d={CORE} />
              </ClipPath>
            </Defs>
            <Path d={FLAME} fill="#F4ECDB" stroke="#E0D2B4" strokeWidth={0.9} />
            <AnimatedRect x={0} width={100} fill="url(#fire)" clipPath="url(#flameClip)" animatedProps={fillProps} />
            <AnimatedRect x={0} width={100} fill="url(#fireCore)" clipPath="url(#coreClip)" animatedProps={fillProps} />
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
  glow: { position: 'absolute', width: 280, height: 280, alignItems: 'center', justifyContent: 'center' },
  word: {
    fontFamily: 'PlayfairDisplay_500Medium',
    fontSize: 44,
    color: '#1C3318',
    marginTop: 34,
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
