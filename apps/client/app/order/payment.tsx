import { ordersApi, paymentsApi, type CreateOrderInput } from '@pamyat/api'
import { Button, Card, colors, Divider, Icon, SectionLabel, Skeleton, spacing, Text, TopBar, useToast } from '@pamyat/ui'
import { useOrderDraftStore } from '@pamyat/store'
import { formatPrice } from '@pamyat/utils'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { usePaymentMethods } from '../../src/hooks/queries'

export default function PaymentScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const showToast = useToast()
  const qc = useQueryClient()
  const draft = useOrderDraftStore()
  const { data: methods, isLoading } = usePaymentMethods()

  const amount = draft.priceFrom ?? 0
  const defaultMethod = methods?.find(m => m.isDefault) ?? methods?.[0]

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
      if (defaultMethod) await paymentsApi.create(order.id, defaultMethod.id)
      return order
    },
    onSuccess: order => {
      void qc.invalidateQueries({ queryKey: ['orders'] })
      showToast(t('payment.success'), 'success')
      draft.reset()
      router.replace(`/order/${order.id}`)
    },
    onError: () => showToast(t('payment.error'), 'error'),
  })

  return (
    <View style={styles.root}>
      <TopBar title={t('payment.title')} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card variant="success" padding="md" style={styles.secure}>
          <View style={styles.secureRow}>
            <Icon name="lock" size={20} color={colors.sage} />
            <Text variant="bodySm" color="success">
              {t('payment.secure')}
            </Text>
          </View>
        </Card>

        <SectionLabel>{t('payment.method')}</SectionLabel>
        {isLoading ? (
          <Skeleton width="100%" height={56} radius={10} />
        ) : defaultMethod ? (
          <Card padding="md">
            <View style={styles.methodRow}>
              <Icon name="orders" size={20} color={colors.sage} />
              <View style={styles.methodInfo}>
                <Text variant="headingMd" color="ink">{`${defaultMethod.brand} •••• ${defaultMethod.last4}`}</Text>
                <Text variant="bodySm" color="muted">
                  {defaultMethod.expiry}
                </Text>
              </View>
              <Icon name="checkCircle" size={20} color={colors.sage} weight="fill" />
            </View>
          </Card>
        ) : null}
        <Text variant="bodySm" color="sage" style={styles.otherMethod}>
          {t('payment.otherMethod')}
        </Text>

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
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  secure: { marginBottom: spacing.lg },
  secureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  methodInfo: { flex: 1 },
  otherMethod: { marginTop: spacing.md },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs },
  total: { fontFamily: 'PlayfairDisplay_400Regular', fontSize: 28, lineHeight: 34, color: colors.forest },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.linen,
  },
})
