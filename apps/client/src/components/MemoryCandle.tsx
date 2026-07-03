import { candlesApi, type CandleStatus } from '@pamyat/api'
import { colors, haptics, spacing, Text, typography } from '@pamyat/ui'
import { plural } from '@pamyat/utils'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform, Pressable, StyleSheet, View } from 'react-native'
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg'
import Animated, {
  Easing,
  FadeIn,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'

// Контур фирменного пламени (viewBox 0 0 100 140, кончик сверху)
const FLAME = 'M50,6 C64,38 79,50 79,80 C79,106 66,122 50,124 C34,122 21,106 21,80 C21,50 36,38 50,6 Z'
const CORE = 'M50,44 C60,62 67,70 67,90 C67,105 59,115 50,116 C41,115 33,105 33,90 C33,70 40,62 50,44 Z'

/** Блок «Свеча памяти»: зажечь виртуальную свечу с живым пламенем. */
export function MemoryCandle({ graveId }: { graveId: string }) {
  const { t } = useTranslation()
  const [status, setStatus] = useState<CandleStatus | null>(null)
  const [lighting, setLighting] = useState(false)
  // Локальный флаг мгновенного зажигания — анимация не ждёт сеть
  const [justLit, setJustLit] = useState(false)

  useEffect(() => {
    let alive = true
    candlesApi
      .status(graveId)
      .then(s => {
        if (alive) setStatus(s)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [graveId])

  const lit = justLit || (status?.litToday ?? false)

  const onLight = async () => {
    if (lit || lighting) return
    setLighting(true)
    haptics.light()
    setJustLit(true) // пламя вспыхивает сразу, не дожидаясь ответа
    try {
      const next = await candlesApi.light(graveId)
      setStatus(next)
      setTimeout(() => haptics.success(), 500)
    } catch {
      setJustLit(false) // не получилось — гасим обратно
    } finally {
      setLighting(false)
    }
  }

  const countLabel = status
    ? `${status.count} ${plural(status.count, 'свеча', 'свечи', 'свечей')}`
    : ''

  return (
    <LinearGradient
      colors={[colors.moss, colors.forest]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.card}
    >
      <Text variant="headingLg" color="cream" center>
        {t('candle.title')}
      </Text>

      <View style={styles.candleWrap}>
        <Candle lit={lit} />
      </View>

      {lit ? (
        <Animated.View entering={Platform.OS === 'web' ? undefined : FadeIn.duration(600)}>
          <Text style={styles.litText} center>
            {t('candle.lit')}
          </Text>
        </Animated.View>
      ) : (
        <Pressable style={styles.lightBtn} onPress={onLight} disabled={lighting}>
          <Text style={styles.lightBtnText}>{t('candle.light')}</Text>
        </Pressable>
      )}

      {status ? (
        <Text style={styles.count} center>
          {t('candle.today', { value: countLabel })}
        </Text>
      ) : null}
    </LinearGradient>
  )
}

function Candle({ lit }: { lit: boolean }) {
  // Разгорание: 0 = потухшая, 1 = горит
  const ignite = useSharedValue(lit ? 1 : 0)
  // Живое колыхание
  const flicker = useSharedValue(0)
  const sway = useSharedValue(0)

  useEffect(() => {
    if (lit) {
      // Пламя вырастает из фитиля с лёгким «перелётом»
      ignite.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.back(1.6)) })
      flicker.value = withDelay(
        700,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 460, easing: Easing.inOut(Easing.sin) }),
            withTiming(0, { duration: 540, easing: Easing.inOut(Easing.sin) })
          ),
          -1,
          true
        )
      )
      sway.value = withDelay(
        700,
        withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) }), -1, true)
      )
    } else {
      ignite.value = withTiming(0, { duration: 300 })
      flicker.value = 0
      sway.value = 0
    }
  }, [lit, ignite, flicker, sway])

  const glowStyle = useAnimatedStyle(() => ({
    opacity: ignite.value * (0.55 + flicker.value * 0.25),
    transform: [{ scale: 0.5 + ignite.value * 0.5 + flicker.value * 0.06 }],
  }))

  const flameStyle = useAnimatedStyle(() => {
    const scaleY = ignite.value * (0.9 + flicker.value * 0.16)
    return {
      opacity: ignite.value,
      transform: [
        // Масштаб считается от центра, поэтому компенсируем сдвигом:
        // основание пламени всегда стоит на фитиле, рост — только вверх
        { translateY: (1 - ignite.value) * 12 - (scaleY - 1) * 21 },
        { rotate: `${(sway.value - 0.5) * 4}deg` },
        { scaleY },
        { scaleX: ignite.value * (1 - flicker.value * 0.06) },
      ],
    }
  })

  return (
    <View style={styles.candle}>
      <View style={styles.flameSlot}>
        {/* Мягкое свечение */}
        <Animated.View style={[styles.glow, glowStyle]} pointerEvents="none">
          <Svg width={96} height={96}>
            <Defs>
              <RadialGradient id="candleGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor="#F3DFA6" stopOpacity={0.95} />
                <Stop offset="0.5" stopColor="#D9B36B" stopOpacity={0.45} />
                <Stop offset="1" stopColor="#D9B36B" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect x={0} y={0} width={96} height={96} fill="url(#candleGlow)" />
          </Svg>
        </Animated.View>

        {/* Угольки-искры */}
        {lit ? (
          <>
            <Ember delay={900} x={-9} duration={1900} />
            <Ember delay={1600} x={7} duration={2300} />
            <Ember delay={2400} x={-2} duration={2100} />
          </>
        ) : null}

        {/* Пламя */}
        <Animated.View style={[styles.flame, flameStyle]}>
          <Svg width={30} height={42} viewBox="0 0 100 140">
            <Defs>
              <SvgGradient id="candleFire" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#F6C86B" />
                <Stop offset="0.6" stopColor="#E8A33D" />
                <Stop offset="1" stopColor="#C67B22" />
              </SvgGradient>
              <SvgGradient id="candleCore" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#FFF7E4" />
                <Stop offset="1" stopColor="#FFE9A8" />
              </SvgGradient>
            </Defs>
            <Path d={FLAME} fill="url(#candleFire)" />
            <Path d={CORE} fill="url(#candleCore)" />
          </Svg>
        </Animated.View>

        {!lit ? <View style={styles.smoke} /> : null}
      </View>
      <View style={styles.wick} />
      {/* Тело свечи с восковым бликом */}
      <View style={styles.body}>
        <Svg width={26} height={68} style={StyleSheet.absoluteFill}>
          <Defs>
            <SvgGradient id="wax" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#EFE9DB" />
              <Stop offset="0.35" stopColor="#FFFDF8" />
              <Stop offset="1" stopColor="#E7DFCC" />
            </SvgGradient>
          </Defs>
          <Rect x={0} y={0} width={26} height={68} rx={5} fill="url(#wax)" />
          <Circle cx={13} cy={3} r={9} fill="#FFFDF8" opacity={0.8} />
        </Svg>
      </View>
    </View>
  )
}

/** Одна искра: всплывает от пламени, покачиваясь, и тает. */
function Ember({ delay, x, duration }: { delay: number; x: number; duration: number }) {
  const p = useSharedValue(0)
  useEffect(() => {
    p.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: Easing.out(Easing.quad) }), -1, false)
    )
  }, [p, delay, duration])
  const style = useEmberStyle(p, x)
  return <Animated.View style={[styles.ember, style]} pointerEvents="none" />
}

function useEmberStyle(p: SharedValue<number>, x: number) {
  return useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.12, 0.75, 1], [0, 0.9, 0.45, 0]),
    transform: [
      { translateY: -p.value * 52 },
      { translateX: x + Math.sin(p.value * Math.PI * 2) * 3 },
      { scale: interpolate(p.value, [0, 1], [1, 0.4]) },
    ],
  }))
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, padding: spacing.lg, alignItems: 'center' },
  candleWrap: { height: 128, justifyContent: 'flex-end', alignItems: 'center', marginVertical: spacing.md },
  candle: { alignItems: 'center' },
  flameSlot: { height: 50, width: 96, alignItems: 'center', justifyContent: 'flex-end' },
  glow: { position: 'absolute', bottom: -34, width: 96, height: 96 },
  flame: { position: 'absolute', bottom: -8, zIndex: 1 },
  ember: {
    position: 'absolute',
    bottom: 14,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F6C86B',
  },
  smoke: { width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(250,247,242,0.4)', marginBottom: 4 },
  wick: { width: 2, height: 7, backgroundColor: colors.ink },
  body: { width: 26, height: 68, borderTopLeftRadius: 5, borderTopRightRadius: 5, overflow: 'hidden' },
  litText: { ...typography.bodyMd, color: colors.sageXL, marginTop: spacing.xs },
  lightBtn: {
    backgroundColor: colors.cream,
    borderRadius: 999,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  lightBtnText: { ...typography.label, color: colors.forest, letterSpacing: 0.5 },
  count: { ...typography.caption, color: 'rgba(250,247,242,0.6)', marginTop: spacing.md },
})
