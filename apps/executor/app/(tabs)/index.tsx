import type { ExecutorOrder } from '@pamyat/api'
import { executorApi } from '@pamyat/api'
import { Button, Card, colors, Icon, SectionLabel, Skeleton, spacing, Text, typography, useToast } from '@pamyat/ui'
import { formatDate, formatPrice } from '@pamyat/utils'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Alert, FlatList, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { executorKeys, useExecutorOrders } from '../../src/hooks/queries'

export default function ActiveOrdersScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const showToast = useToast()
  const qc = useQueryClient()
  const { data, isLoading } = useExecutorOrders()

  const accept = useMutation({
    mutationFn: (id: string) => executorApi.accept(id),
    onSuccess: (_r, id) => {
      void qc.invalidateQueries({ queryKey: executorKeys.orders() })
      showToast(t('active.accepted'), 'success')
      router.push(`/execution/${id}`)
    },
  })

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => executorApi.reject(id, reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: executorKeys.orders() })
      showToast(t('active.rejected'), 'info')
    },
  })

  const onReject = (id: string) => {
    Alert.prompt?.(t('active.rejectReason'), undefined, reason => reject.mutate({ id, reason: reason ?? '' }))
    // Android без Alert.prompt — отклоняем без причины.
    if (!Alert.prompt) reject.mutate({ id, reason: '' })
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text variant="displayMd" color="forest">
          {t('active.title')}
        </Text>
      </View>
      {isLoading ? (
        <View style={styles.list}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={150} radius={10} />
          ))}
        </View>
      ) : (data?.length ?? 0) === 0 ? (
        <View style={styles.empty}>
          <Icon name="orders" size={48} color={colors.stone} />
          <Text variant="bodyMd" color="muted" center style={styles.emptyText}>
            {t('active.empty')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={o => o.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onAccept={() => accept.mutate(item.id)}
              onReject={() => onReject(item.id)}
              onOpen={() => router.push(`/execution/${item.id}`)}
            />
          )}
        />
      )}
    </View>
  )
}

function OrderCard({
  order,
  onAccept,
  onReject,
  onOpen,
}: {
  order: ExecutorOrder
  onAccept: () => void
  onReject: () => void
  onOpen: () => void
}) {
  const { t } = useTranslation()
  const inProgress = order.status !== 'assigned'
  return (
    <Card padding="md" style={styles.card}>
      <View style={styles.cardHead}>
        <Icon name={order.serviceIcon} size={22} color={colors.sage} />
        <View style={styles.cardInfo}>
          <Text variant="headingMd" color="ink">
            {order.serviceName}
          </Text>
          <Text variant="bodySm" color="muted">
            {`${order.cemeteryName} · ${t('active.distanceKm', { km: order.distanceKm })}`}
          </Text>
        </View>
      </View>
      <Text variant="bodySm" color="light" style={styles.address}>
        {`${order.address}${order.plot ? ` · ${order.plot}` : ''}`}
      </Text>
      <Text variant="bodySm" color="muted">
        {formatDate(order.date)}
      </Text>

      <SectionLabel>{t('active.reward')}</SectionLabel>
      <Text style={styles.reward}>{formatPrice(order.reward)}</Text>

      {inProgress ? (
        <Button label={t('execution.title')} onPress={onOpen} fullWidth />
      ) : (
        <View style={styles.actions}>
          <View style={styles.actionCol}>
            <Button label={t('active.reject')} variant="destructive" onPress={onReject} fullWidth />
          </View>
          <View style={styles.actionCol}>
            <Button label={t('active.accept')} onPress={onAccept} fullWidth />
          </View>
        </View>
      )}
    </Card>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  card: { gap: spacing.xs },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardInfo: { flex: 1 },
  address: { marginTop: spacing.xs },
  reward: { ...typography.priceDisplay, color: colors.forest, marginBottom: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm },
  actionCol: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.xl },
  emptyText: { maxWidth: 220 },
})
