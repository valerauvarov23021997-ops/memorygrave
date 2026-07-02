import { candlesApi, type CandleStatus } from '@pamyat/api'
import { colors, haptics, spacing, Text, typography } from '@pamyat/ui'
import { plural } from '@pamyat/utils'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, View } from 'react-native'
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'

/** Блок «Свеча памяти»: зажечь виртуальную свечу с живым пламенем. */
export function MemoryCandle({ graveId }: { graveId: string }) {
  const { t } = useTranslation()
  const [status, setStatus] = useState<CandleStatus | null>(null)
  const [lighting, setLighting] = useState(false)

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

  const lit = status?.litToday ?? false

  const onLight = async () => {
    if (lit || lighting) return
    setLighting(true)
    try {
      const next = await candlesApi.light(graveId)
      haptics.success()
      setStatus(next)
    } catch {
      // тихо игнорируем — не критично
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
        <Animated.View entering={FadeIn.duration(400)}>
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
  const flicker = useSharedValue(1)
  const sway = useSharedValue(0.5)

  useEffect(() => {
    if (lit) {
      flicker.value = withRepeat(withTiming(0.6, { duration: 520, easing: Easing.inOut(Easing.sin) }), -1, true)
      sway.value = withRepeat(withTiming(1, { duration: 950, easing: Easing.inOut(Easing.sin) }), -1, true)
    } else {
      flicker.value = 1
    }
  }, [lit, flicker, sway])

  const flameStyle = useAnimatedStyle(() => ({
    opacity: 0.75 + flicker.value * 0.25,
    transform: [
      { translateX: (sway.value - 0.5) * 5 },
      { scaleY: 0.82 + flicker.value * 0.3 },
      { scaleX: 0.95 + flicker.value * 0.1 },
    ],
  }))

  const glowStyle = useAnimatedStyle(() => ({ opacity: 0.3 + flicker.value * 0.3 }))

  return (
    <View style={styles.candle}>
      <View style={styles.flameSlot}>
        {lit ? (
          <>
            <Animated.View style={[styles.glow, glowStyle]} />
            <Animated.View style={[styles.flame, flameStyle]}>
              <View style={styles.flameCore} />
            </Animated.View>
          </>
        ) : (
          <View style={styles.smoke} />
        )}
      </View>
      <View style={styles.wick} />
      <View style={styles.body} />
    </View>
  )
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, padding: spacing.lg, alignItems: 'center' },
  candleWrap: { height: 120, justifyContent: 'flex-end', alignItems: 'center', marginVertical: spacing.md },
  candle: { alignItems: 'center' },
  flameSlot: { height: 44, alignItems: 'center', justifyContent: 'flex-end' },
  glow: {
    position: 'absolute',
    bottom: -6,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.gold,
  },
  flame: {
    width: 18,
    height: 32,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    borderBottomLeftRadius: 9,
    borderBottomRightRadius: 9,
    backgroundColor: '#E8A33D',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  flameCore: {
    width: 8,
    height: 16,
    borderRadius: 4,
    marginBottom: 3,
    backgroundColor: '#FFE9A8',
  },
  smoke: { width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(250,247,242,0.4)' },
  wick: { width: 2, height: 7, backgroundColor: colors.ink },
  body: {
    width: 24,
    height: 66,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    backgroundColor: colors.cream,
  },
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
