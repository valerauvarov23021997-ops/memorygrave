import { Badge, Button, Card, colors, Icon, Skeleton, spacing, StarRating, Text, TopBar, typography, useToast } from '@pamyat/ui'
import { useOrderDraftStore } from '@pamyat/store'
import { formatDate, formatLifespan } from '@pamyat/utils'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

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
        <TopBar onBack={() => router.back()} />
        <View style={styles.loading}>
          <Skeleton width="100%" height={180} radius={0} />
          <View style={styles.loadingBody}>
            <Skeleton width="70%" height={28} />
            <Skeleton width="50%" height={16} />
            <Skeleton width="100%" height={60} />
          </View>
        </View>
      </View>
    )
  }

  const isSaved = saved ?? grave.isSaved
  const badge = graveStatusBadge(grave.status, t)

  const onToggleSave = () => {
    const next = !isSaved
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
      <View style={styles.mapWrap}>
        {grave.coordinates ? (
          <MapView
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            scrollEnabled={false}
            initialRegion={{
              latitude: grave.coordinates.latitude,
              longitude: grave.coordinates.longitude,
              latitudeDelta: 0.008,
              longitudeDelta: 0.008,
            }}
          >
            <Marker coordinate={grave.coordinates} pinColor={colors.forest} />
          </MapView>
        ) : (
          <View style={[styles.map, styles.mapPlaceholder]}>
            <Icon name="mapPin" size={28} color={colors.stone} />
          </View>
        )}
        {grave.plot ? (
          <View style={styles.plotBadge}>
            <Text style={styles.plotText}>{`${grave.plot} · ${grave.cemeteryName}`}</Text>
          </View>
        ) : null}
        <View style={[styles.topBarOverlay, { paddingTop: insets.top }]}>
          <TopBar transparent onBack={() => router.back()} rightElement={<Icon name="share" size={20} color={colors.forest} />} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.nameRow}>
          <Text variant="displayMd" color="forest" style={styles.name}>
            {grave.fullName}
          </Text>
          <Badge label={badge.label} variant={badge.variant} />
        </View>
        <Text variant="bodySm" color="muted" style={styles.lifespan}>
          {formatLifespan(grave.birthDate, grave.deathDate)}
        </Text>

        {grave.biography ? (
          <Pressable onPress={() => setExpanded(e => !e)}>
            <Text variant="bodyMd" color="ink" numberOfLines={expanded ? undefined : 3} style={styles.bio}>
              {grave.biography}
            </Text>
            {!expanded ? (
              <Text variant="bodySm" color="sage">
                {t('grave.readMore')}
              </Text>
            ) : null}
          </Pressable>
        ) : null}

        <View style={styles.actions}>
          <Card variant="surface" padding="md" style={styles.action}>
            <Pressable style={styles.actionInner} onPress={() => showToast(t('grave.photos'), 'info')}>
              <Icon name="camera" size={22} color={colors.sage} />
              <Text variant="bodySm" color="muted" center>
                {t('grave.photosCount', { count: grave.photos.length })}
              </Text>
            </Pressable>
          </Card>
          <Pressable style={styles.actionPress} onPress={onToggleSave}>
            <Card variant={isSaved ? 'featured' : 'surface'} padding="md" style={styles.action}>
              <View style={styles.actionInner}>
                <Icon name="saved" size={22} color={isSaved ? colors.cream : colors.sage} weight={isSaved ? 'fill' : 'regular'} />
                <Text variant="bodySm" center color={isSaved ? 'cream' : 'muted'}>
                  {t('grave.save')}
                </Text>
              </View>
            </Card>
          </Pressable>
          <Card variant="surface" padding="md" style={styles.action}>
            <Pressable style={styles.actionInner} onPress={() => router.push(`/reminders/${grave.id}`)}>
              <Icon name="bell" size={22} color={colors.sage} />
              <Text variant="bodySm" color="muted" center>
                {t('grave.remind')}
              </Text>
            </Pressable>
          </Card>
        </View>

        {grave.lastOrder ? (
          <>
            <Text variant="sectionLabel" color="light" style={styles.sectionLabel}>
              {t('grave.lastOrder').toUpperCase()}
            </Text>
            <Card variant="surface" padding="md" onPress={() => router.push(`/report/${grave.lastOrder?.id}`)}>
              <View style={styles.lastOrderRow}>
                <View>
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
      </ScrollView>

      <View style={[styles.sticky, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button label={t('grave.orderCare')} onPress={onOrder} fullWidth />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  loading: { flex: 1 },
  loadingBody: { padding: spacing.lg, gap: spacing.sm },
  mapWrap: { height: 180 },
  map: { ...StyleSheet.absoluteFillObject },
  mapPlaceholder: { backgroundColor: colors.parchment, alignItems: 'center', justifyContent: 'center' },
  topBarOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  plotBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.lg,
    backgroundColor: 'rgba(26,26,20,0.7)',
    borderRadius: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  plotText: { ...typography.caption, color: colors.white },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  name: { flex: 1 },
  lifespan: { marginTop: spacing.xs },
  bio: { marginTop: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  action: { flex: 1 },
  actionPress: { flex: 1 },
  actionInner: { alignItems: 'center', gap: spacing.xs },
  sectionLabel: { marginTop: spacing.xl, marginBottom: spacing.sm },
  lastOrderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
