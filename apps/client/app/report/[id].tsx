import { ordersApi } from '@pamyat/api'
import { Button, Card, colors, Icon, SectionLabel, Skeleton, spacing, StarRating, Text, TopBar, useToast } from '@pamyat/ui'
import { useMutation } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useOrder, useReport } from '../../src/hooks/queries'

export default function ReportScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const showToast = useToast()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: order } = useOrder(id ?? '')
  const { data: report, isLoading } = useReport(id ?? '')

  const [rating, setRating] = useState(0)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (order?.rating != null) setRating(order.rating)
  }, [order?.rating])

  const review = useMutation({
    mutationFn: (value: number) => ordersApi.review(id ?? '', value),
    onSuccess: () => showToast(t('report.rated'), 'success'),
  })

  // Автосохранение оценки с задержкой 800мс.
  const onRate = (value: number) => {
    setRating(value)
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(() => review.mutate(value), 800)
  }

  useEffect(() => () => (debounce.current ? clearTimeout(debounce.current) : undefined), [])

  const beforeCount = report?.photosBefore.length ?? 0
  const afterCount = report?.photosAfter.length ?? 0

  return (
    <View style={styles.root}>
      <TopBar title={t('report.title')} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card variant="success" padding="md" style={styles.done}>
          <View style={styles.doneRow}>
            <Icon name="checkCircle" size={20} color={colors.success} weight="fill" />
            <View>
              <Text variant="headingMd" color="success">
                {t('report.done', { service: order?.serviceName ?? '' })}
              </Text>
              {order ? (
                <Text variant="bodySm" color="sage">
                  {order.cemeteryName}
                </Text>
              ) : null}
            </View>
          </View>
        </Card>

        {isLoading ? (
          <Skeleton width="100%" height={100} radius={10} />
        ) : (
          <>
            <SectionLabel>{t('report.before')}</SectionLabel>
            <PhotoGrid count={Math.max(beforeCount, 2)} variant="before" />

            <SectionLabel>{t('report.after')}</SectionLabel>
            <PhotoGrid count={Math.max(afterCount, 2)} variant="after" />
          </>
        )}

        <SectionLabel>{t('report.rate')}</SectionLabel>
        <View style={styles.rating}>
          <StarRating value={rating} onChange={onRate} size={28} />
        </View>

        <View style={styles.buttons}>
          <Button label={t('report.orderAgain')} onPress={() => router.push('/order/catalog')} fullWidth />
          <Button label={t('report.download')} variant="secondary" onPress={() => showToast(t('report.download'), 'info')} fullWidth />
        </View>
        <View style={{ height: insets.bottom + spacing.lg }} />
      </ScrollView>
    </View>
  )
}

function PhotoGrid({ count, variant }: { count: number; variant: 'before' | 'after' }) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[styles.photoBox, variant === 'after' ? styles.photoAfter : styles.photoBefore]}>
          <Icon
            name={variant === 'after' ? 'checkCircle' : 'camera'}
            size={22}
            color={variant === 'after' ? colors.success : colors.stone}
          />
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  done: { marginBottom: spacing.lg },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  photoBox: { width: '48%', height: 100, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  photoBefore: { backgroundColor: colors.parchment, borderWidth: 0.5, borderColor: colors.stone },
  photoAfter: { backgroundColor: colors.successBg, borderWidth: 0.5, borderColor: colors.sageL },
  rating: { marginBottom: spacing.lg },
  buttons: { gap: spacing.sm },
})
