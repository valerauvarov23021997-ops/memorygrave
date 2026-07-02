import {
  Avatar,
  Badge,
  Button,
  Card,
  colors,
  haptics,
  Icon,
  SectionLabel,
  Skeleton,
  spacing,
  StarRating,
  Text,
  typography,
  useToast,
} from '@pamyat/ui'
import { useOrderDraftStore } from '@pamyat/store'
import { formatDate, formatLifespan } from '@pamyat/utils'
import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps'
import Animated, { FadeIn } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { MemoryCandle } from '../../src/components/MemoryCandle'
import { useGrave, useToggleSaved } from '../../src/hooks/queries'
import { graveStatusBadge } from '../../src/lib/statusMaps'

export default function GraveScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const showToast = useToast()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: grave, isLoading } = useGrave(id ?? '')
  const toggleSaved = useToggleSaved()
  const startOrder = useOrderDraftStore(s => s.startOrder)

  const [saved, setSaved] = useState<boolean | null>(null)
  const [expanded, setExpanded] = useState(false)

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

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Шапка-герой с градиентом и портретом */}
        <LinearGradient
          colors={[colors.forest, colors.moss]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 52 }]}
        >
          <Animated.View entering={FadeIn.duration(500)} style={styles.heroContent}>
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
          <RoundButton icon="share" onPress={() => showToast(t('grave.share'), 'info')} />
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
            <View style={styles.mapCard}>
              <MapView
                style={styles.map}
                provider={PROVIDER_DEFAULT}
                scrollEnabled={false}
                pointerEvents="none"
                initialRegion={{
                  latitude: grave.coordinates.latitude,
                  longitude: grave.coordinates.longitude,
                  latitudeDelta: 0.008,
                  longitudeDelta: 0.008,
                }}
              >
                <Marker coordinate={grave.coordinates} pinColor={colors.forest} />
              </MapView>
              {grave.plot ? (
                <View style={styles.plotBadge}>
                  <Icon name="mapPin" size={14} color={colors.white} />
                  <Text style={styles.plotText}>{`${grave.plot} · ${grave.cemeteryName}`}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          <View style={styles.actions}>
            <ActionTile icon="camera" label={t('grave.photosCount', { count: grave.photos.length })} onPress={() => showToast(t('grave.photos'), 'info')} />
            <ActionTile
              icon="saved"
              label={t('grave.save')}
              active={isSaved}
              onPress={onToggleSave}
            />
            <ActionTile icon="bell" label={t('grave.remind')} onPress={() => router.push(`/reminders/${grave.id}`)} />
          </View>

          <View style={styles.candleWrap}>
            <MemoryCandle graveId={grave.id} />
          </View>

          {grave.lastOrder ? (
            <>
              <SectionLabel>{t('grave.lastOrder')}</SectionLabel>
              <Card padding="md" onPress={() => router.push(`/report/${grave.lastOrder?.id}`)}>
                <View style={styles.lastOrderRow}>
                  <View style={styles.lastOrderInfo}>
                    <Text variant="headingMd" color="ink">
                      {grave.lastOrder.serviceName}
                    </Text>
                    <Text variant="bodySm" color="muted">
                      {formatDate(grave.lastOrder.date)}
                    </Text>
                  </View>
                  {grave.lastOrder.rating != null ? <StarRating value={grave.lastOrder.rating} size={18} /> : null}
                </View>
              </Card>
            </>
          ) : null}

          <View style={{ height: 96 }} />
        </View>
      </ScrollView>

      <View style={[styles.sticky, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button label={t('grave.orderCare')} onPress={onOrder} fullWidth />
      </View>
    </View>
  )
}

function RoundButton({ icon, onPress }: { icon: string; onPress: () => void }) {
  return (
    <Pressable style={styles.roundBtn} onPress={onPress} hitSlop={8}>
      <Icon name={icon} size={20} color={colors.white} />
    </Pressable>
  )
}

function ActionTile({
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
  return (
    <Card variant={active ? 'featured' : 'default'} padding="md" onPress={onPress} style={styles.tile}>
      <View style={styles.tileInner}>
        <Icon name={icon} size={24} color={active ? colors.cream : colors.sage} weight={active ? 'fill' : 'regular'} />
        <Text variant="bodySm" center color={active ? 'cream' : 'muted'}>
          {label}
        </Text>
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  scroll: { paddingBottom: 0 },
  hero: {
    paddingBottom: spacing.xl,
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
  heroSkeleton: { alignItems: 'center', backgroundColor: colors.forest, paddingBottom: spacing.xl, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
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
  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  bioCard: { marginBottom: spacing.lg },
  readMore: { marginTop: spacing.sm },
  mapCard: {
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    borderWidth: 0.5,
    borderColor: colors.linen,
  },
  map: { ...StyleSheet.absoluteFillObject },
  plotBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(26,26,20,0.72)',
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  plotText: { ...typography.caption, color: colors.white },
  actions: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  candleWrap: { marginBottom: spacing.lg },
  tile: { flex: 1 },
  tileInner: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  lastOrderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastOrderInfo: { flex: 1 },
  sticky: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.cream,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.linen,
  },
})
