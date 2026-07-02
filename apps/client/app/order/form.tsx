import type { RecurringPeriod } from '@pamyat/api'
import { Button, Card, useColors, useThemedStyles, type ThemeColors, Divider, Icon, Input, SectionLabel, spacing, Text, TopBar, typography } from '@pamyat/ui'
import { useOrderDraftStore } from '@pamyat/store'
import { formatPrice } from '@pamyat/utils'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const WEEKDAYS = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']

export default function OrderFormScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const c = useColors()
  const styles = useThemedStyles(makeStyles)
  const draft = useOrderDraftStore()

  const days = useMemo(() => {
    const today = new Date()
    return Array.from({ length: 14 }).map((_, i) => {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      return d
    })
  }, [])

  const periods: { key: RecurringPeriod; label: string }[] = [
    { key: 'once', label: t('orderForm.once') },
    { key: 'monthly', label: t('orderForm.monthly') },
    { key: 'quarterly', label: t('orderForm.quarterly') },
  ]

  const toIso = (d: Date) => d.toISOString().slice(0, 10)
  const canProceed = !!draft.date

  const onProceed = () => {
    if (!canProceed) return
    if (draft.fixedPrice) router.push('/order/payment')
    else {
      // Крупные работы — заявка без немедленной оплаты.
      router.replace('/(tabs)/orders')
    }
  }

  return (
    <View style={styles.root}>
      <TopBar title={t('orderForm.title')} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card variant="surface" padding="md" style={styles.serviceCard}>
          <View style={styles.serviceRow}>
            {draft.serviceIcon ? <Icon name={draft.serviceIcon} size={22} color={c.sage} /> : null}
            <View style={styles.serviceInfo}>
              <Text variant="headingMd" color="ink">
                {draft.serviceName}
              </Text>
              <Text variant="bodySm" color="muted">
                {draft.cemeteryName}
              </Text>
            </View>
          </View>
        </Card>

        <SectionLabel>{t('orderForm.dateLabel')}</SectionLabel>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dates}>
          {days.map(d => {
            const iso = toIso(d)
            const active = draft.date === iso
            return (
              <Pressable
                key={iso}
                style={[styles.dateCell, active ? styles.dateActive : styles.dateInactive]}
                onPress={() => draft.setDate(iso)}
              >
                <Text variant="caption" style={{ color: active ? c.cream : c.muted }}>
                  {WEEKDAYS[d.getDay()]}
                </Text>
                <Text variant="headingMd" style={{ color: active ? c.cream : c.ink }}>
                  {d.getDate()}
                </Text>
              </Pressable>
            )
          })}
        </ScrollView>

        <SectionLabel>{t('orderForm.repeatLabel')}</SectionLabel>
        <View style={styles.periods}>
          {periods.map(p => {
            const active = draft.recurringPeriod === p.key
            return (
              <Pressable
                key={p.key}
                style={[styles.period, active ? styles.periodActive : styles.periodInactive]}
                onPress={() => draft.setRecurring(p.key)}
              >
                <Text variant="bodySm" style={{ color: active ? c.cream : c.muted, fontFamily: 'DMSans_500Medium' }}>
                  {p.label}
                </Text>
              </Pressable>
            )
          })}
        </View>

        <SectionLabel>{t('orderForm.wishesLabel')}</SectionLabel>
        <Input
          value={draft.notes}
          onChangeText={draft.setNotes}
          placeholder={t('orderForm.wishesPlaceholder')}
          multiline
          maxLength={500}
        />

        <Divider />
        <View style={styles.totalRow}>
          <Text variant="bodyMd" color="muted">
            {t('orderForm.total')}
          </Text>
          <Text style={styles.totalValue}>
            {draft.fixedPrice && draft.priceFrom != null ? formatPrice(draft.priceFrom) : t('orderForm.priceOnRequest')}
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          label={draft.fixedPrice ? t('orderForm.toPayment') : t('orderForm.leaveRequest')}
          onPress={onProceed}
          disabled={!canProceed}
          fullWidth
        />
      </View>
    </View>
  )
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: c.cream },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  serviceCard: { marginBottom: spacing.lg },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  serviceInfo: { flex: 1 },
  dates: { gap: spacing.sm, paddingBottom: spacing.md },
  dateCell: { width: 52, height: 56, borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: 2 },
  dateActive: { backgroundColor: c.forest },
  dateInactive: { backgroundColor: c.parchment },
  periods: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  period: { flex: 1, height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  periodActive: { backgroundColor: c.forest },
  periodInactive: { backgroundColor: c.parchment, borderWidth: 0.5, borderColor: c.linen },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  totalValue: { ...typography.priceDisplay, color: c.forest },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.linen,
  },
})
