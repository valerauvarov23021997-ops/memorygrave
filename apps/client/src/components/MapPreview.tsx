import type { Coordinates } from '@pamyat/api'
import { Icon, radii, spacing, Text, typography, useColors, useThemedStyles, type ThemeColors } from '@pamyat/ui'
import { Image } from 'expo-image'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, Pressable, StyleSheet, View } from 'react-native'

// Ключ Яндекс Static API. Клиентский по своей природе (виден в URL картинки
// карты) — это нормально для карт-ключей; лимиты настраиваются в Яндекс.Кабинете.
// Переопределяется через EXPO_PUBLIC_YANDEX_MAPS_API_KEY.
const YANDEX_KEY =
  process.env.EXPO_PUBLIC_YANDEX_MAPS_API_KEY ?? 'a10371ea-1a73-41b5-9c09-594319693b5d'

interface MapPreviewProps {
  coordinates: Coordinates
  label?: string
  height?: number
}

/** Превью локации на Яндекс.Картах. Тап открывает Яндекс.Карты. */
export function MapPreview({ coordinates, label, height = 160 }: MapPreviewProps) {
  const { t } = useTranslation()
  const c = useColors()
  const styles = useThemedStyles(makeStyles)
  const [imgFailed, setImgFailed] = useState(false)
  const { latitude: lat, longitude: lon } = coordinates

  // У Яндекса порядок координат — долгота,широта.
  const staticUrl = YANDEX_KEY
    ? `https://static-maps.yandex.ru/v1?ll=${lon},${lat}&z=16&size=650,300&pt=${lon},${lat},pm2rdm&lang=ru_RU&apikey=${YANDEX_KEY}`
    : null

  const openYandex = () => {
    void Linking.openURL(`https://yandex.ru/maps/?ll=${lon},${lat}&z=17&pt=${lon},${lat},pm2rdm`)
  }

  const showImage = !!staticUrl && !imgFailed

  return (
    <Pressable style={[styles.card, { height }]} onPress={openYandex}>
      {showImage ? (
        <Image
          source={{ uri: staticUrl! }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <View style={styles.placeholder}>
          <Icon name="mapPin" size={28} color={c.sage} />
          <Text variant="bodySm" color="sage" style={styles.openLabel}>
            {t('grave.openMap')}
          </Text>
        </View>
      )}
      {label ? (
        <View style={styles.badge}>
          <Icon name="mapPin" size={14} color="#FFFFFF" />
          <Text style={styles.badgeText}>{label}</Text>
        </View>
      ) : null}
    </Pressable>
  )
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    card: {
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 0.5,
      borderColor: c.linen,
      backgroundColor: c.parchment,
    },
    placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
    openLabel: { fontFamily: 'DMSans_500Medium' },
    badge: {
      position: 'absolute',
      bottom: spacing.sm,
      left: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(26,26,20,0.72)',
      borderRadius: radii.lg,
      paddingHorizontal: spacing.sm,
      paddingVertical: 5,
    },
    badgeText: { ...typography.caption, color: '#FFFFFF' },
  })
