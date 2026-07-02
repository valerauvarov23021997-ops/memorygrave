import { ordersApi, paymentsApi, type CreateOrderInput } from '@pamyat/api'
import { BottomSheet, Button, Card, useColors, useThemedStyles, type ThemeColors, Divider, haptics, Icon, SectionLabel, Skeleton, spacing, Text, TopBar, useToast } from '@pamyat/ui'
import { useOrderDraftStore } from '@pamyat/store'
import { formatPrice } from '@pamyat/utils'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { usePaymentMethods } from '../../src/hooks/queries'

export default function PaymentScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const c = useColors()
  const styles = useThemedStyles(makeStyles)
  const showToast = useToast()
  const qc = useQueryClient()
  const draft = useOrderDraftStore()
  const { data: methods, isLoading } = usePaymentMethods()

  const amount = draft.priceFrom ?? 0
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [choosing, setChoosing] = useState(false)
  const method = methods?.find(m => m.id === selectedId) ?? methods?.find(m => m.isDefault) ?? methods?.[0]

  const mutation = useMutation({
    mutationFn: async () => {
      if (!draft.graveId || !draft.serviceId || !draft.date) throw new Error('draft')
      const input: CreateOrderInput = {
        graveId: draft.graveId,
        serviceId: draft.serviceId,
        date: draft.date,
        notes: draft.notes || null,
        isRecurring: draft.recurringPeriod !== 'once',
        recurringPeriod: draft.recurringPeriod,
      }
      const order = await ordersApi.create(input)
      if (method) await paymentsApi.create(order.id, method.id)
      return order
    },
    onSuccess: order => {
      haptics.success()
      void qc.invalidateQueries({ queryKey: ['orders'] })
      showToast(t('payment.success'), 'success')
      draft.reset()
      router.replace(`/order/${order.id}`)
    },
    onError: () => {
      haptics.error()
      showToast(t('payment.error'), 'error')
    },
  })

  return (
    <View style={styles.root}>
      <TopBar title={t('payment.title')} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card variant="success" padding="md" style={styles.secure}>
          <View style={styles.secureRow}>
            <Icon name="lock" size={20} color={c.sage} />
            <Text variant="bodySm" color="success">
              {t('payment.secure')}
            </Text>
          </View>
        </Card>

        <SectionLabel>{t('payment.method')}</SectionLabel>
        {isLoading ? (
          <Skeleton width="100%" height={56} radius={10} />
        ) : method ? (
          <Card padding="md">
            <View style={styles.methodRow}>
              <Icon name="orders" size={20} color={c.sage} />
              <View style={styles.methodInfo}>
                <Text variant="headingMd" color="ink">{`${method.brand} •••• ${method.last4}`}</Text>
                <Text variant="bodySm" color="muted">
                  {method.expiry}
                </Text>
              </View>
              <Icon name="checkCircle" size={20} color={c.sage} weight="fill" />
            </View>
          </Card>
        ) : null}
        <Pressable onPress={() => setChoosing(true)} hitSlop={8}>
          <Text variant="bodySm" color="sage" style={styles.otherMethod}>
            {t('payment.otherMethod')}
          </Text>
        </Pressable>

        <Divider />

        <SectionLabel>{t('payment.composition')}</SectionLabel>
        <View style={styles.line}>
          <Text variant="bodyMd" color="muted">
            {draft.serviceName}
          </Text>
          <Text variant="bodyMd" color="ink">
            {formatPrice(amount)}
          </Text>
        </View>
        <View style={styles.line}>
          <Text variant="bodyMd" color="muted">
            {t('payment.fee')}
          </Text>
          <Text variant="bodyMd" color="ink">
            {formatPrice(0)}
          </Text>
        </View>
        <Divider />
        <View style={styles.line}>
          <Text variant="headingMd" color="forest">
            {t('payment.toPay')}
          </Text>
          <Text style={styles.total}>{formatPrice(amount)}</Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button label={t('payment.pay', { amount: formatPrice(amount) })} onPress={() => mutation.mutate()} loading={mutation.isPending} fullWidth />
        <Button label={t('common.cancel')} variant="ghost" onPress={() => router.back()} />
      </View>

      <BottomSheet visible={choosing} onClose={() => setChoosing(false)}>
        <Text variant="headingLg" color="forest" style={styles.sheetTitle}>
          {t('payment.method')}
        </Text>
        {(methods ?? []).map(m => {
          const active = m.id === method?.id
          return (
            <Pressable
              key={m.id}
              style={styles.methodOption}
              onPress={() => {
                setSelectedId(m.id)
                setChoosing(false)
              }}
            >
              <Icon name="orders" size={20} color={active ? c.sage : c.light} />
              <View style={styles.methodInfo}>
                <Text variant="bodyLg" color="ink">{`${m.brand} •••• ${m.last4}`}</Text>
                <Text variant="bodySm" color="light">
                  {m.expiry}
                </Text>
              </View>
              {active ? <Icon name="checkCircle" size={20} color={c.sage} weight="fill" /> : null}
            </Pressable>
          )
        })}
      </BottomSheet>
    </View>
  )
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: c.cream },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  secure: { marginBottom: spacing.lg },
  secureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  methodInfo: { flex: 1 },
  otherMethod: { marginTop: spacing.md },
  sheetTitle: { marginBottom: spacing.md },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.linen,
  },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs },
  total: { fontFamily: 'PlayfairDisplay_400Regular', fontSize: 28, lineHeight: 34, color: c.forest },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.linen,
  },
})
