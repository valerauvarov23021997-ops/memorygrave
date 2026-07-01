import { executorApi } from '@pamyat/api'
import { Avatar, Card, colors, Divider, SectionLabel, Skeleton, spacing, StarRating, Text, Toggle, useToast } from '@pamyat/ui'
import { formatPrice, pluralOrders } from '@pamyat/utils'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { executorKeys, useExecutorProfile } from '../../src/hooks/queries'

export default function ExecutorProfileScreen() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const showToast = useToast()
  const qc = useQueryClient()
  const { data, isLoading } = useExecutorProfile()
  const [online, setOnline] = useState<boolean | null>(null)

  const setOnlineMutation = useMutation({
    mutationFn: (value: boolean) => executorApi.setOnline(value),
    onSuccess: () => void qc.invalidateQueries({ queryKey: executorKeys.profile }),
  })

  const isOnline = online ?? data?.isOnline ?? false

  const toggle = (value: boolean) => {
    setOnline(value)
    setOnlineMutation.mutate(value)
    showToast(value ? t('profile.online') : t('profile.offline'), value ? 'success' : 'info')
  }

  if (isLoading || !data) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + spacing.lg }]}>
        <View style={styles.content}>
          <Skeleton width="100%" height={64} radius={10} />
        </View>
      </View>
    )
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl }]}>
      <View style={styles.userRow}>
        <Avatar name={data.name} size={48} />
        <View style={styles.userInfo}>
          <Text variant="headingLg" color="forest">
            {data.name}
          </Text>
          <StarRating value={Math.round(data.rating)} size={16} />
        </View>
      </View>

      <Card variant={isOnline ? 'success' : 'surface'} padding="lg" style={styles.onlineCard}>
        <View style={styles.onlineRow}>
          <View style={styles.onlineText}>
            <Text variant="headingLg" color={isOnline ? 'success' : 'muted'}>
              {isOnline ? t('profile.online') : t('profile.offline')}
            </Text>
            <Text variant="bodySm" color="muted">
              {t('profile.onlineHint')}
            </Text>
          </View>
          <Toggle value={isOnline} onValueChange={toggle} />
        </View>
      </Card>

      <SectionLabel>{t('profile.stats')}</SectionLabel>
      <Card variant="surface" padding="md">
        <StatRow label={t('profile.totalOrders')} value={pluralOrders(data.totalOrders)} />
        <Divider />
        <StatRow label={t('profile.monthEarnings')} value={formatPrice(data.monthEarnings)} />
        <Divider />
        <StatRow label={t('profile.rating')} value={data.rating.toFixed(1)} />
      </Card>

      <SectionLabel>{t('profile.cities')}</SectionLabel>
      <Text variant="bodyMd" color="ink" style={styles.tags}>
        {data.cities.join(', ')}
      </Text>

      <SectionLabel>{t('profile.services')}</SectionLabel>
      <Text variant="bodyMd" color="ink" style={styles.tags}>
        {data.services.join(', ')}
      </Text>
    </ScrollView>
  )
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text variant="bodyMd" color="muted">
        {label}
      </Text>
      <Text variant="headingMd" color="forest">
        {value}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: spacing.lg },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  userInfo: { flex: 1, gap: spacing.xs },
  onlineCard: { marginBottom: spacing.lg },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  onlineText: { flex: 1 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs },
  tags: { marginBottom: spacing.md },
})
