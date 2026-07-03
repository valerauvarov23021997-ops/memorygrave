import { Button, radii, shadows, useColors, useThemedStyles, type ThemeColors, spacing, Text } from '@pamyat/ui'
import { useRouter } from 'expo-router'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dimensions,
  FlatList,
  type ListRenderItemInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  StyleSheet,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { appStorage } from '../src/lib/storage'

const { width } = Dimensions.get('window')

interface Slide {
  icon: string
  iconBg: string
  title: string
  desc: string
}

export default function OnboardingScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const c = useColors()
  const styles = useThemedStyles(makeStyles)
  const listRef = useRef<FlatList<Slide>>(null)
  const [index, setIndex] = useState(0)

  const slides: Slide[] = [
    { icon: '🌿', iconBg: c.successBg, title: t('onboarding.slide1Title'), desc: t('onboarding.slide1Desc') },
    { icon: '🧹', iconBg: c.warningBg, title: t('onboarding.slide2Title'), desc: t('onboarding.slide2Desc') },
    { icon: '📸', iconBg: c.successBg, title: t('onboarding.slide3Title'), desc: t('onboarding.slide3Desc') },
  ]

  const isLast = index === slides.length - 1

  const finish = async () => {
    await appStorage.markOnboardingSeen()
    router.replace('/(auth)/phone')
  }

  const onNext = () => {
    if (isLast) {
      void finish()
      return
    }
    // Индекс двигаем сразу: onMomentumScrollEnd после программного скролла
    // не срабатывает на web и не всегда срабатывает на Android
    const next = index + 1
    setIndex(next)
    listRef.current?.scrollToIndex({ index: next, animated: true })
  }

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width))
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={item => item.title}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        renderItem={({ item }: ListRenderItemInfo<Slide>) => (
          <View style={styles.slide}>
            <View style={[styles.ring, { backgroundColor: item.iconBg }]}>
              <View style={styles.innerDisc}>
                <Text style={styles.emoji}>{item.icon}</Text>
              </View>
            </View>
            <Text variant="displayMd" color="forest" center style={styles.title}>
              {item.title}
            </Text>
            <Text variant="bodyLg" color="muted" center style={styles.desc}>
              {item.desc}
            </Text>
          </View>
        )}
      />

      <View style={styles.progress}>
        {slides.map((s, i) => (
          <View
            key={s.title}
            style={[
              styles.segment,
              { backgroundColor: i < index ? c.sage : i === index ? c.forest : c.linen },
            ]}
          />
        ))}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Button label={isLast ? t('common.start') : t('common.next')} onPress={onNext} fullWidth />
        <Button
          label={isLast ? t('common.haveAccount') : t('common.skip')}
          variant="ghost"
          onPress={finish}
        />
      </View>
    </View>
  )
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: c.cream },
  slide: { width, alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.xxl * 2 },
  ring: {
    width: 152,
    height: 152,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerDisc: {
    width: 108,
    height: 108,
    borderRadius: radii.full,
    backgroundColor: c.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  emoji: { fontSize: 50 },
  title: { marginTop: spacing.xl },
  desc: { marginTop: spacing.md, maxWidth: 300, lineHeight: 24 },
  progress: { flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.xl, marginBottom: spacing.lg },
  segment: { flex: 1, height: 4, borderRadius: radii.full },
  footer: { paddingHorizontal: spacing.lg, gap: spacing.sm },
})
