import { Button, colors, spacing, Text, typography } from '@pamyat/ui'
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
  const listRef = useRef<FlatList<Slide>>(null)
  const [index, setIndex] = useState(0)

  const slides: Slide[] = [
    { icon: '🌿', iconBg: colors.successBg, title: t('onboarding.slide1Title'), desc: t('onboarding.slide1Desc') },
    { icon: '🧹', iconBg: colors.warningBg, title: t('onboarding.slide2Title'), desc: t('onboarding.slide2Desc') },
    { icon: '📸', iconBg: colors.successBg, title: t('onboarding.slide3Title'), desc: t('onboarding.slide3Desc') },
  ]

  const isLast = index === slides.length - 1

  const finish = async () => {
    await appStorage.markOnboardingSeen()
    router.replace('/(auth)/phone')
  }

  const onNext = () => {
    if (isLast) void finish()
    else listRef.current?.scrollToIndex({ index: index + 1, animated: true })
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
            <View style={[styles.illustration, { backgroundColor: item.iconBg }]}>
              <Text style={styles.emoji}>{item.icon}</Text>
            </View>
            <Text variant="displayMd" color="forest" center style={styles.title}>
              {item.title}
            </Text>
            <Text variant="bodyMd" color="muted" center style={styles.desc}>
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
              { backgroundColor: i < index ? colors.sage : i === index ? colors.forest : colors.linen },
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  slide: { width, alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.xxl * 2 },
  illustration: { width: 90, height: 90, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 44 },
  title: { marginTop: spacing.xl },
  desc: { marginTop: spacing.md, maxWidth: 300, ...typography.bodyMd, lineHeight: 22 },
  progress: { flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.xl, marginBottom: spacing.lg },
  segment: { flex: 1, height: 3, borderRadius: 2 },
  footer: { paddingHorizontal: spacing.lg, gap: spacing.sm },
})
