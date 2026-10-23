import { ordersApi } from '@pamyat/api'
import { useOrderDraftStore } from '@pamyat/store'
import {
  Button,
  Card,
  FullscreenGallery,
  useColors,
  useThemedStyles,
  type ThemeColors,
  Icon,
  SectionLabel,
  Skeleton,
  spacing,
  StarRating,
  Text,
  TopBar,
  useToast,
} from '@pamyat/ui'
import { useMutation } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useOrder, useReport } from '../../src/hooks/queries'
import { goBack } from '../../src/lib/navigation'
import { reportError } from '../../src/lib/sentry'
import { shareText } from '../../src/lib/share'

export default function ReportScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const c = useColors()
  const styles = useThemedStyles(makeStyles)
  const showToast = useToast()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: order } = useOrder(id ?? '')
  const { data: report, isLoading } = useReport(id ?? '')
  const startOrder = useOrderDraftStore(s => s.startOrder)

  const [rating, setRating] = useState(0)
  const [gallery, setGallery] = useState<{ photos: string[]; index: number } | null>(null)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRating = useRef<number | null>(null)

  useEffect(() => {
    if (order?.rating != null) setRating(order.rating)
  }, [order?.rating])

  const review = useMutation({
    mutationFn: (value: number) => ordersApi.review(id ?? '', value),
    // iOS обрывает запрос при уходе приложения в фон — повторяем, а не теряем оценку молча.
    retry: 2,
    onSuccess: () => {
      showToast(t('report.rated'), 'success')
    },
    onError: () => {
      showToast(t('common.error'), 'error')
    },
  })

  // Автосохранение оценки с задержкой 800мс.
  const onRate = (value: number) => {
    setRating(value)
    if (debounce.current) clearTimeout(debounce.current)
    pendingRating.current = value
    debounce.current = setTimeout(() => {
      pendingRating.current = null
      review.mutate(value)
    }, 800)
  }

  // Ушли с экрана раньше 800мс — оценку всё равно сохраняем, иначе она пропадала.
  useEffect(
    () => () => {
      if (debounce.current) clearTimeout(debounce.current)
      const value = pendingRating.current
      if (value !== null && id) ordersApi.review(id, value).catch(reportError)
    },
    [id]
  )

  const onShare = async () => {
    if (!order) return
    const result = await shareText(
      t('report.shareMessage', { service: order.serviceName, cemetery: order.cemeteryName })
    )
    if (result === 'copied') showToast(t('common.linkCopied'), 'success')
  }

  const before = report?.photosBefore ?? []
  const after = report?.photosAfter ?? []

  return (
    <View style={styles.root}>
      <TopBar
        title={t('report.title')}
        onBack={() => {
          goBack()
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Card variant="success" padding="md" style={styles.done}>
          <View style={styles.doneRow}>
            <Icon name="checkCircle" size={20} color={c.success} weight="fill" />
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
          <View style={styles.loadingGrid}>
            <Skeleton width="48%" height={140} radius={12} />
            <Skeleton width="48%" height={140} radius={12} />
          </View>
        ) : (
          <>
            {before.length > 0 ? (
              <>
                <SectionLabel>{t('report.before')}</SectionLabel>
                <PhotoGrid
                  photos={before}
                  onOpen={index => {
                    setGallery({ photos: before, index })
                  }}
                />
              </>
            ) : null}
            {after.length > 0 ? (
              <>
                <SectionLabel>{t('report.after')}</SectionLabel>
                <PhotoGrid
                  photos={after}
                  onOpen={index => {
                    setGallery({ photos: after, index })
                  }}
                />
              </>
            ) : null}
          </>
        )}

        <SectionLabel>{t('report.rate')}</SectionLabel>
        <View style={styles.rating}>
          <StarRating value={rating} onChange={onRate} size={28} />
        </View>

        <View style={styles.buttons}>
          <Button
            label={t('report.orderAgain')}
            disabled={!order}
            onPress={() => {
              if (!order) return
              // Без могилы в черновике оплата падала с ошибкой «draft».
              startOrder({ id: order.graveId, name: order.graveName, cemetery: order.cemeteryName })
              router.push('/order/catalog')
            }}
            fullWidth
          />
          <Button label={t('report.share')} variant="secondary" onPress={onShare} fullWidth />
        </View>
        <View style={{ height: insets.bottom + spacing.lg }} />
      </ScrollView>

      <FullscreenGallery
        visible={gallery !== null}
        photos={gallery?.photos ?? []}
        initialIndex={gallery?.index ?? 0}
        onClose={() => {
          setGallery(null)
        }}
      />
    </View>
  )
}

function PhotoGrid({ photos, onOpen }: { photos: string[]; onOpen: (index: number) => void }) {
  const styles = useThemedStyles(makeStyles)
  return (
    <View style={styles.grid}>
      {photos.map((uri, i) => (
        <Pressable
          key={uri}
          style={styles.photoBox}
          onPress={() => {
            onOpen(i)
          }}
        >
          <Image source={{ uri }} style={styles.photo} contentFit="cover" transition={200} />
        </Pressable>
      ))}
    </View>
  )
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.cream },
    content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
    done: { marginBottom: spacing.lg },
    doneRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    loadingGrid: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
    photoBox: {
      width: '48%',
      aspectRatio: 1,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: c.parchment,
    },
    photo: { width: '100%', height: '100%' },
    rating: { marginBottom: spacing.lg },
    buttons: { gap: spacing.sm },
  })
