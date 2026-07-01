import { ordersApi } from '@pamyat/api'
import { Avatar, Badge, Button, Card, colors, SectionLabel, Skeleton, spacing, StarRating, Text, TopBar, useToast } from '@pamyat/ui'
import { formatDate, formatPrice, pluralOrders } from '@pamyat/utils'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useOrder } from '../../src/hooks/queries'
import { orderStatusBadge, timelineIndex } from '../../src/lib/statusMaps'

export default function OrderStatusScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const showToast = useToast()
  const qc = useQueryClient()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: order, isLoading } = useOrder(id ?? '')

  const cancel = useMutation({
    mutationFn: () => ordersApi.cancel(id ?? ''),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['orders'] })
      void qc.invalidateQueries({ queryKey: ['order', id] })
      showToast(t('orderStatus.cancelled'), 'success')
      router.back()
    },
  })

  if (isLoading || !order) {
    return (
      <View style={styles.root}>
        <TopBar title={t('orderStatus.title')} onBack={() => router.back()} />
        <View style={styles.loading}>
          <Skeleton width="100%" height={80} radius={10} />
          <Skeleton width="100%" height={200} radius={10} />
        </View>
      </View>
    )
  }

  const badge = orderStatusBadge(order.status, t)
  const currentStep = timelineIndex(order.status)
  const canCancel = order.status === 'pending' || order.status === 'assigned'

  const steps = [
    t('orderStatus.stepPaid'),
    t('orderStatus.stepAssigned'),
    t('orderStatus.stepOnTheWay'),
    t('orderStatus.stepArrived'),
    t('orderStatus.stepDone'),
  ]

  return (
    <View style={styles.root}>
      <TopBar title={t('orderStatus.title')} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card variant="surface" padding="md">
          <View style={styles.headerRow}>
            <Text variant="headingMd" color="ink">
              {order.serviceName}
            </Text>
            <Badge label={badge.label} variant={badge.variant} />
          </View>
          <Text variant="bodySm" color="muted">
            {order.graveName}
          </Text>
          <View style={styles.metaRow}>
            <Text variant="bodySm" color="muted">
              {formatDate(order.date)}
            </Text>
            <Text variant="headingMd" color="forest">
              {order.amount != null ? formatPrice(order.amount) : t('orderForm.priceOnRequest')}
            </Text>
          </View>
        </Card>

        {order.executor ? (
          <Card variant="success" padding="md" style={styles.executor}>
            <View style={styles.executorRow}>
              <Avatar name={order.executor.name} size={28} imageUri={order.executor.avatarUrl} />
              <View style={styles.executorInfo}>
                <Text variant="headingMd" color="ink">
                  {order.executor.name}
                </Text>
                <Text variant="bodySm" color="muted">
                  {pluralOrders(order.executor.ordersCount)}
                </Text>
              </View>
              <StarRating value={Math.round(order.executor.rating)} size={16} />
            </View>
          </Card>
        ) : null}

        {currentStep >= 0 ? (
          <>
            <SectionLabel>{t('orderStatus.title')}</SectionLabel>
            <View style={styles.timeline}>
              {steps.map((label, i) => (
                <TimelineStep
                  key={label}
                  label={label}
                  state={i < currentStep ? 'completed' : i === currentStep ? 'current' : 'future'}
                  isLast={i === steps.length - 1}
                />
              ))}
            </View>
          </>
        ) : null}

        {canCancel ? (
          <Button label={t('orderStatus.cancelOrder')} variant="destructive" onPress={() => cancel.mutate()} fullWidth />
        ) : null}
        <View style={{ height: insets.bottom + spacing.lg }} />
      </ScrollView>
    </View>
  )
}

function TimelineStep({
  label,
  state,
  isLast,
}: {
  label: string
  state: 'completed' | 'current' | 'future'
  isLast: boolean
}) {
  const { t } = useTranslation()
  const pulse = useSharedValue(1)
  useEffect(() => {
    if (state === 'current') pulse.value = withRepeat(withTiming(0.5, { duration: 800 }), -1, true)
  }, [state, pulse])
  const dotStyle = useAnimatedStyle(() => ({ opacity: state === 'current' ? pulse.value : 1 }))

  const dotColor = state === 'completed' ? colors.sage : state === 'current' ? colors.forest : colors.linen

  return (
    <View style={styles.step}>
      <View style={styles.stepLeft}>
        <Animated.View
          style={[
            styles.dot,
            { backgroundColor: dotColor },
            state === 'current' && styles.dotCurrent,
            state === 'future' && styles.dotFuture,
            dotStyle,
          ]}
        />
        {!isLast ? <View style={styles.line} /> : null}
      </View>
      <View style={styles.stepBody}>
        <Text
          variant="bodySm"
          color={state === 'completed' ? 'muted' : state === 'current' ? 'forest' : 'light'}
          style={state === 'current' ? styles.currentLabel : undefined}
        >
          {label}
        </Text>
        {state === 'current' ? (
          <Text variant="bodySm" color="sage">
            {t('orderStatus.now')}
          </Text>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  loading: { padding: spacing.lg, gap: spacing.md },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  executor: { marginTop: spacing.md },
  executorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  executorInfo: { flex: 1 },
  timeline: { marginBottom: spacing.lg },
  step: { flexDirection: 'row', gap: spacing.md },
  stepLeft: { alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  dotCurrent: { borderWidth: 2, borderColor: colors.sageL },
  dotFuture: { borderWidth: 1, borderColor: colors.stone },
  line: { width: 1, flex: 1, backgroundColor: colors.linen, marginVertical: 2 },
  stepBody: { flex: 1, paddingBottom: spacing.lg },
  currentLabel: { fontFamily: 'DMSans_500Medium' },
})
