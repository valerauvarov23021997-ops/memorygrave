import {
  Avatar,
  Badge,
  Button,
  Card,
  FlameLoader,
  FullscreenGallery,
  GroupedRow,
  GroupedSection,
  haptics,
  Icon,
  SectionLabel,
  Skeleton,
  spacing,
  StarRating,
  Text,
  typography,
  useColors,
  useThemedStyles,
  useToast,
  type ThemeColors,
} from '@pamyat/ui'
import { useOrderDraftStore } from '@pamyat/store'
import { formatDate, formatLifespan } from '@pamyat/utils'
import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, type NativeScrollEvent, type NativeSyntheticEvent, Platform, Pressable, Share, StyleSheet, View } from 'react-native'
import Animated, {
  FadeIn,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { MapPreview } from '../../src/components/MapPreview'
import { MemoryBook } from '../../src/components/MemoryBook'
import { MemoryCandle } from '../../src/components/MemoryCandle'
import { useGrave, useToggleSaved } from '../../src/hooks/queries'
import { graveStatusBadge } from '../../src/lib/statusMaps'

export default function GraveScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const showToast = useToast()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: grave, isLoading, refetch, isRefetching } = useGrave(id ?? '')
  const toggleSaved = useToggleSaved()
  const startOrder = useOrderDraftStore(s => s.startOrder)

  const [saved, setSaved] = useState<boolean | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const c = useColors()
  const styles = useThemedStyles(makeStyles)

  // Оттягивание страницы вниз: огонёк проявляется по мере жеста
  const pullY = useSharedValue(0)
  const onScroll = useAnimatedScrollHandler(e => {
    pullY.value = e.contentOffset.y
  })
  const pullFlameStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pullY.value, [-24, -64], [0, 1], 'clamp'),
    transform: [{ scale: interpolate(pullY.value, [-24, -80], [0.5, 1], 'clamp') }],
  }))
  const onScrollEndDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (e.nativeEvent.contentOffset.y < -70 && !isRefetching) {
      haptics.light()
      void refetch()
    }
  }

  if (isLoading || !grave) {
    return (
      <View style={styles.root}>
        <View style={[styles.heroSkeleton, { paddingTop: insets.top + spacing.xl }]}>
          <Skeleton width={96} height={96} radius={48} />
          <View style={{ height: spacing.md }} />
          <Skeleton width={220} height={30} radius={8} />
        </View>
        <View style={styles.loadingBody}>
          <Skeleton width="100%" height={80} radius={12} />
          <Skeleton width="100%" height={160} radius={12} />
        </View>
      </View>
    )
  }

  const isSaved = saved ?? grave.isSaved
  const badge = graveStatusBadge(grave.status, t)

  const onToggleSave = () => {
    const next = !isSaved
    haptics.success()
    setSaved(next)
    toggleSaved.mutate({ graveId: grave.id, next })
    showToast(next ? t('grave.savedToast') : t('grave.unsavedToast'), 'success')
  }

  const onOrder = () => {
    startOrder({ id: grave.id, name: grave.fullName, cemetery: grave.cemeteryName })
    router.push('/order/catalog')
  }

  const onRoute = () => {
    if (!grave.coordinates) return
    const { latitude, longitude } = grave.coordinates
    void Linking.openURL(`https://yandex.ru/maps/?ll=${longitude},${latitude}&z=17&pt=${longitude},${latitude},pm2rdm`)
  }

  const onShare = async () => {
    try {
      await Share.share({
        message: t('grave.shareMessage', { name: grave.fullName, url: `pamyat://grave/${grave.id}` }),
      })
    } catch {
      // пользователь мог закрыть окно шэринга — не ошибка
    }
  }

  return (
    <View style={styles.root}>
      <Animated.ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onScrollEndDrag={onScrollEndDrag}
      >
        {/* Зелёный «хвост» — при оттягивании вниз сверху остаётся фирменный фон */}
        <View style={styles.bleed} pointerEvents="none" />
        {/* Шапка-герой с градиентом и портретом */}
        <LinearGradient
          colors={[c.forest, c.moss]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 52 }]}
        >
          <Animated.View entering={Platform.OS === 'web' ? undefined : FadeIn.duration(500)} style={styles.heroContent}>
            <View style={styles.portraitRing}>
              <Avatar name={grave.fullName} size={96} imageUri={grave.photos[0]} />
            </View>
            <Text variant="displayMd" color="cream" center style={styles.heroName}>
              {grave.fullName}
            </Text>
            <Text style={styles.heroDates}>{formatLifespan(grave.birthDate, grave.deathDate)}</Text>
            <View style={styles.heroBadge}>
              <Badge label={badge.label} variant={badge.variant} />
            </View>
          </Animated.View>
        </LinearGradient>

        {/* Плавающие кнопки поверх шапки */}
        <View style={[styles.topActions, { top: insets.top + spacing.xs }]}>
          <RoundButton icon="back" onPress={() => router.back()} />
          <RoundButton icon="share" onPress={() => void onShare()} />
        </View>

        {/* Круглые действия поверх нижнего края героя — как в Apple Wallet */}
        <View style={styles.roundActions}>
          <RoundAction
            icon="camera"
            label={t('grave.actPhoto')}
            onPress={() => (grave.photos.length ? setGalleryOpen(true) : showToast(t('grave.photos'), 'info'))}
          />
          <RoundAction
            icon="saved"
            label={isSaved ? t('grave.actSaved') : t('grave.actSave')}
            active={isSaved}
            onPress={onToggleSave}
          />
          <RoundAction icon="bell" label={t('grave.actDates')} onPress={() => router.push(`/reminders/${grave.id}`)} />
          {grave.coordinates ? (
            <RoundAction icon="mapPin" label={t('grave.actRoute')} onPress={onRoute} />
          ) : null}
        </View>

        <View style={styles.body}>
          {grave.biography ? (
            <Card variant="surface" padding="lg" style={styles.bioCard}>
              <Pressable onPress={() => setExpanded(e => !e)}>
                <Text variant="bodyLg" color="ink" numberOfLines={expanded ? undefined : 4}>
                  {grave.biography}
                </Text>
                {!expanded ? (
                  <Text variant="bodySm" color="sage" style={styles.readMore}>
                    {t('grave.readMore')}
                  </Text>
                ) : null}
              </Pressable>
            </Card>
          ) : null}

          {grave.coordinates ? (
            <View style={styles.mapWrap}>
              <MapPreview
                coordinates={grave.coordinates}
                label={[grave.plot, grave.cemeteryName].filter(Boolean).join(' · ')}
              />
            </View>
          ) : null}

          <View style={styles.candleWrap}>
            <MemoryCandle graveId={grave.id} />
          </View>

          <MemoryBook graveId={grave.id} />

          <SectionLabel>{t('grave.more')}</SectionLabel>
          <GroupedSection style={styles.moreCard}>
            <GroupedRow icon="saved" title={t('invite.title')} onPress={() => router.push(`/invite/${grave.id}`)} position="first" />
            <GroupedRow icon="QrCode" title={t('qr.title')} onPress={() => router.push(`/qr/${grave.id}`)} position={grave.lastOrder ? 'middle' : 'last'} />
            {grave.lastOrder ? (
              <GroupedRow
                icon="camera"
                title={grave.lastOrder.serviceName}
                subtitle={formatDate(grave.lastOrder.date)}
                right={grave.lastOrder.rating != null ? <StarRating value={grave.lastOrder.rating} size={16} /> : undefined}
                onPress={() => router.push(`/report/${grave.lastOrder?.id}`)}
                position="last"
              />
            ) : null}
          </GroupedSection>

          <View style={{ height: 96 }} />
        </View>
      </Animated.ScrollView>

      {/* Огонёк обновления: растёт при оттягивании, горит пока обновляемся */}
      {isRefetching ? (
        <View style={[styles.pullFlame, { top: insets.top + 52 }]} pointerEvents="none">
          <FlameLoader size={26} />
        </View>
      ) : (
        <Animated.View style={[styles.pullFlame, { top: insets.top + 52 }, pullFlameStyle]} pointerEvents="none">
          <FlameLoader size={26} />
        </Animated.View>
      )}

      <View style={[styles.sticky, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button label={t('grave.orderCare')} onPress={onOrder} fullWidth />
      </View>

      <FullscreenGallery visible={galleryOpen} photos={grave.photos} onClose={() => setGalleryOpen(false)} />
    </View>
  )
}

function RoundButton({ icon, onPress }: { icon: string; onPress: () => void }) {
  const styles = useThemedStyles(makeStyles)
  return (
    <Pressable style={styles.roundBtn} onPress={onPress} hitSlop={8}>
      <Icon name={icon} size={20} color="#FFFFFF" />
    </Pressable>
  )
}

function RoundAction({
  icon,
  label,
  active,
  onPress,
}: {
  icon: string
  label: string
  active?: boolean
  onPress: () => void
}) {
  const c = useColors()
  const styles = useThemedStyles(makeStyles)
  return (
    <Pressable style={styles.roundAction} onPress={onPress}>
      <View style={[styles.roundCircle, active ? styles.roundCircleActive : null]}>
        <Icon name={icon} size={22} color={active ? c.cream : c.forest} weight={active ? 'fill' : 'regular'} />
      </View>
      <Text variant="caption" color={active ? 'forest' : 'muted'} center>
        {label}
      </Text>
    </Pressable>
  )
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: c.cream },
  scroll: { paddingBottom: 0 },
  bleed: { position: 'absolute', top: -600, left: 0, right: 0, height: 600, backgroundColor: c.forest },
  pullFlame: { position: 'absolute', alignSelf: 'center', zIndex: 5 },
  hero: {
    paddingBottom: spacing.xl + 30,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    alignItems: 'center',
  },
  heroContent: { alignItems: 'center', paddingHorizontal: spacing.lg },
  portraitRing: {
    padding: 4,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(250,247,242,0.35)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroName: { marginTop: spacing.md },
  heroDates: { ...typography.bodySm, color: 'rgba(250,247,242,0.75)', marginTop: spacing.xs, textAlign: 'center' },
  heroBadge: { marginTop: spacing.md },
  heroSkeleton: { alignItems: 'center', backgroundColor: c.forest, paddingBottom: spacing.xl, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  loadingBody: { padding: spacing.lg, gap: spacing.md },
  topActions: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roundBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: -34,
    paddingHorizontal: spacing.lg,
  },
  roundAction: { alignItems: 'center', gap: 6, width: 64 },
  roundCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: c.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: c.forest,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 4,
  },
  roundCircleActive: { backgroundColor: c.forest },
  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  bioCard: { marginBottom: spacing.lg },
  readMore: { marginTop: spacing.sm },
  mapWrap: { marginBottom: spacing.lg },
  candleWrap: { marginBottom: spacing.lg },
  moreCard: { marginBottom: spacing.lg },
  sticky: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: c.cream,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.linen,
  },
})
