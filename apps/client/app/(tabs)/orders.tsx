import type { Order } from '@pamyat/api'
import { AnimatedListItem, Badge, Card, EmptyState, spacing, Text, useColors, useThemedStyles, type ThemeColors } from '@pamyat/ui'
import { formatDate, formatPrice } from '@pamyat/utils'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { OrderCardSkeleton } from '../../src/components/GraveResultSkeleton'
import { useOrders } from '../../src/hooks/queries'
import { orderStatusBadge } from '../../src/lib/statusMaps'

type Filter = 'all' | 'active' | 'completed'

export default function OrdersScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const c = useColors()
  const styles = useThemedStyles(makeStyles)
  const [filter, setFilter] = useState<Filter>('all')
  const { data, isLoading, refetch, isRefetching } = useOrders(filter === 'all' ? undefined : filter)

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: t('orders.all') },
    { key: 'active', label: t('orders.active') },
    { key: 'completed', label: t('orders.completed') },
  ]

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text variant="displayMd" color="forest">
          {t('orders.title')}
        </Text>
      </View>

      <View style={styles.chips}>
        {filters.map(f => (
          <Pressable
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[styles.chip, filter === f.key ? styles.chipActive : styles.chipInactive]}
          >
            <Text
              variant="bodySm"
              style={{ color: filter === f.key ? c.cream : c.muted, fontFamily: 'DMSans_500Medium' }}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.list}>
          {Array.from({ length: 4 }).map((_, i) => (
            <OrderCardSkeleton key={i} />
          ))}
        </View>
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState
          icon="orders"
          title={t('orders.empty')}
          actionLabel={t('orders.findGrave')}
          onAction={() => router.push('/(tabs)')}
        />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={o => o.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={c.gold} colors={[c.gold]} />
          }
          renderItem={({ item, index }) => (
            <AnimatedListItem index={index}>
              <OrderCard order={item} onPress={() => router.push(`/order/${item.id}`)} />
            </AnimatedListItem>
          )}
        />
      )}
    </View>
  )
}

function OrderCard({ order, onPress }: { order: Order; onPress: () => void }) {
  const { t } = useTranslation()
  const styles = useThemedStyles(makeStyles)
  const badge = orderStatusBadge(order.status, t)
  return (
    <Card onPress={onPress} padding="md" style={styles.card}>
      <View style={styles.cardRow}>
        <View style={styles.cardInfo}>
          <View style={styles.titleRow}>
            <Text variant="headingMd" color="ink">
              {order.serviceName}
            </Text>
            <Badge label={badge.label} variant={badge.variant} />
          </View>
          <Text variant="bodySm" color="light">
            {order.cemeteryName}
          </Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <Text variant="bodySm" color="muted">
          {formatDate(order.date)}
        </Text>
        <Text variant="headingMd" color="forest">
          {order.amount != null ? formatPrice(order.amount) : t('orderForm.priceOnRequest')}
        </Text>
      </View>
    </Card>
  )
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: c.cream },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  chips: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  chip: { height: 36, paddingHorizontal: spacing.md, borderRadius: 999, justifyContent: 'center' },
  chipActive: { backgroundColor: c.forest },
  chipInactive: { backgroundColor: c.parchment, borderWidth: 0.5, borderColor: c.linen },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 120 },
  card: { marginBottom: spacing.sm },
  cardRow: { flexDirection: 'row' },
  cardInfo: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, marginBottom: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.xl },
  emptyText: { maxWidth: 220 },
})
