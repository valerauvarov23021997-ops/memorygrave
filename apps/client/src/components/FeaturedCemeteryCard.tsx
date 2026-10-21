import type { Cemetery } from '@pamyat/api'
import { Icon, radii, shadowFor, spacing, Text, useColors, useThemedStyles, type ThemeColors } from '@pamyat/ui'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, View } from 'react-native'

import { useGraveSearch } from '../hooks/queries'

/** Сколько снимков памятников показываем на обложке. */
const COVER_PHOTOS = 3

/**
 * Обложка оцифрованного кладбища на главной: фото памятников, сколько людей
 * можно найти, переход на план. Пустая главная выглядела «грустно» — теперь
 * сразу видно, что в приложении есть живые данные.
 */
export function FeaturedCemeteryCard({ cemetery }: { cemetery: Cemetery }) {
  const { t } = useTranslation()
  const router = useRouter()
  const c = useColors()
  const styles = useThemedStyles(makeStyles)
  const { data } = useGraveSearch({ cemeteryId: cemetery.id })

  // Берём по одному снимку с разных людей — первый у каждого крупный план памятника
  const photos = useMemo(
    () => (data ?? []).map(g => g.photos[0]).filter((u): u is string => !!u).slice(0, COVER_PHOTOS),
    [data]
  )

  const openMap = () => router.push({ pathname: '/cemetery/[id]', params: { id: cemetery.id, name: cemetery.name } })

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={openMap}>
      {photos.length ? (
        <View style={styles.cover}>
          {photos.map(uri => (
            <Image key={uri} source={{ uri }} style={styles.photo} contentFit="cover" transition={200} />
          ))}
        </View>
      ) : null}
      <View style={styles.body}>
        <Text variant="caption" color="gold" style={styles.kicker}>
          {t('home.featuredKicker')}
        </Text>
        <Text variant="headingLg" color="forest">
          {cemetery.name}
        </Text>
        <Text variant="bodySm" color="muted">
          {cemetery.peopleCount
            ? t('home.featuredPeople', { count: cemetery.peopleCount, city: cemetery.cityName })
            : cemetery.cityName}
        </Text>
        <View style={styles.cta}>
          <Icon name="mapPin" size={16} color={c.sage} />
          <Text variant="label" color="sage">
            {t('home.featuredOpen')}
          </Text>
        </View>
      </View>
    </Pressable>
  )
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    card: {
      borderRadius: radii.xl,
      backgroundColor: c.white,
      overflow: 'hidden',
      ...shadowFor('md', c),
    },
    pressed: { opacity: 0.92 },
    cover: { flexDirection: 'row', height: 132, gap: 2, backgroundColor: c.linen },
    photo: { flex: 1, height: '100%' },
    body: { padding: spacing.lg, gap: spacing.xs },
    kicker: { letterSpacing: 1 },
    cta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm, minHeight: 44 },
  })
