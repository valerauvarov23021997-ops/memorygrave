import { cemeteryMapApi, type BurialPlace, type CemeteryMap } from '@pamyat/api'
import {
  Button,
  FlameLoader,
  haptics,
  Input,
  radii,
  spacing,
  Text,
  TopBar,
  typography,
  useColors,
  useThemedStyles,
  useToast,
  type ThemeColors,
} from '@pamyat/ui'
import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native'
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

/** Экранная проекция: метры от юго-западного угла съёмки. */
interface Frame {
  toXY: (lon: number, lat: number) => { x: number; y: number }
  width: number
  height: number
}

/** Локальная плоская проекция — на 200 м искажением можно пренебречь. */
function makeFrame(map: CemeteryMap): Frame | null {
  const pts = map.places.map(p => p.coordinates)
  if (!pts.length) return null
  const lats = pts.map(p => p.latitude)
  const lons = pts.map(p => p.longitude)
  const minLat = Math.min(...lats)
  const minLon = Math.min(...lons)
  const mLat = 111_320
  const mLon = 111_320 * Math.cos(((minLat + Math.max(...lats)) / 2) * (Math.PI / 180))
  const pad = 12
  const width = (Math.max(...lons) - minLon) * mLon + pad * 2
  const height = (Math.max(...lats) - minLat) * mLat + pad * 2
  return {
    // север сверху: широта растёт вверх, поэтому ось Y переворачиваем
    toXY: (lon, lat) => ({ x: (lon - minLon) * mLon + pad, y: height - ((lat - minLat) * mLat + pad) }),
    width,
    height,
  }
}

const SURFACE_FILL: Record<string, string> = {
  'ДОРОГА АСФ': '#9C9C96',
  ЩЕБЕНЬ: '#D3C8B0',
  'ГРУНТОВАЯ ДОРОГА': '#D8CDB2',
}

export default function CemeteryMapScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const c = useColors()
  const styles = useThemedStyles(makeStyles)
  const showToast = useToast()
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>()
  const cemeteryId = id ?? 'daymische'

  const { data, isLoading, isError } = useQuery({
    queryKey: ['cemetery-map', cemeteryId],
    queryFn: () => cemeteryMapApi.get(cemeteryId),
    staleTime: 60 * 60 * 1000, // карта кладбища меняется редко
  })

  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<BurialPlace | null>(null)
  const lastTap = useRef(0)

  const frame = useMemo(() => (data ? makeFrame(data) : null), [data])

  // Найденные по номеру места подсвечиваем на плане
  const found = useMemo(() => {
    const q = query.trim()
    if (!q || !data) return null
    const n = Number(q)
    if (!Number.isFinite(n)) return null
    return data.places.filter(p => p.number === n)
  }, [query, data])

  // Единственный номер в поиске — сразу открываем карточку: попасть пальцем
  // в одну из 382 меток на экране телефона практически невозможно
  useEffect(() => {
    if (found?.length === 1) setSelected(found[0] ?? null)
  }, [found])

  const onRoute = (place: BurialPlace) => {
    const { latitude: la, longitude: lo } = place.coordinates
    haptics.light()
    void Linking.openURL(`https://yandex.ru/maps/?rtext=~${la},${lo}&rtt=pd`)
  }

  const onPick = (place: BurialPlace) => {
    // на телефоне метки мелкие — гасим дребезг двойных нажатий
    const now = Date.now()
    if (now - lastTap.current < 250) return
    lastTap.current = now
    haptics.light()
    setSelected(place)
  }

  if (isLoading) {
    return (
      <View style={styles.root}>
        <TopBar title={name ?? t('cemeteryMap.title')} onBack={() => router.back()} />
        <View style={styles.center}>
          <FlameLoader size={34} />
          <Text variant="bodySm" color="muted" style={styles.hint}>
            {t('cemeteryMap.loading')}
          </Text>
        </View>
      </View>
    )
  }

  if (isError || !data || !frame || !data.places.length) {
    return (
      <View style={styles.root}>
        <TopBar title={name ?? t('cemeteryMap.title')} onBack={() => router.back()} />
        <View style={styles.center}>
          <Text variant="bodyMd" color="muted" center>
            {t('cemeteryMap.empty')}
          </Text>
        </View>
      </View>
    )
  }

  const highlight = new Set((found ?? []).map(p => p.id))

  return (
    <View style={styles.root}>
      <TopBar title={name ?? t('cemeteryMap.title')} onBack={() => router.back()} />

      <View style={styles.search}>
        <Input
          value={query}
          onChangeText={setQuery}
          placeholder={t('cemeteryMap.searchPlaceholder')}
          keyboardType="number-pad"
        />
        <Text variant="caption" color="light" style={styles.counter}>
          {found
            ? found.length
              ? t('cemeteryMap.foundOne', { n: query.trim() })
              : t('cemeteryMap.notFound')
            : t('cemeteryMap.total', { count: data.places.length })}
        </Text>
      </View>

      {/* План: масштабируется по ширине экрана, север сверху */}
      <View style={styles.canvas}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${frame.width} ${frame.height}`}>
          <Rect width={frame.width} height={frame.height} fill={c.successBg} />
          {data.paths.map((road, i) => {
            const d =
              'M ' +
              road.polygon
                .map(([lon, lat]) => {
                  const p = frame.toXY(lon, lat)
                  return `${p.x.toFixed(1)},${p.y.toFixed(1)}`
                })
                .join(' ') +
              ' Z'
            const fill = SURFACE_FILL[road.surface] ?? c.stone
            return <Path key={`r${i}`} d={d} fill={fill} fillOpacity={0.75} stroke={fill} strokeWidth={0.5} />
          })}
          {data.plots.map((poly, i) => {
            const d =
              'M ' +
              poly
                .map(([lon, lat]) => {
                  const p = frame.toXY(lon, lat)
                  return `${p.x.toFixed(1)},${p.y.toFixed(1)}`
                })
                .join(' ') +
              ' Z'
            return <Path key={`p${i}`} d={d} fill={c.parchment} fillOpacity={0.85} stroke={c.stone} strokeWidth={0.18} />
          })}
          {data.places.map(place => {
            const p = frame.toXY(place.coordinates.longitude, place.coordinates.latitude)
            const on = highlight.has(place.id)
            const sel = selected?.id === place.id
            return (
              <G key={place.id} onPress={() => onPick(place)}>
                {/* прозрачный круг пошире — иначе в метку не попасть пальцем */}
                <Circle cx={p.x} cy={p.y} r={2.6} fill="transparent" />
                <Circle
                  cx={p.x}
                  cy={p.y}
                  r={sel ? 1.7 : on ? 1.5 : 0.85}
                  fill={sel ? c.gold : on ? c.error : c.forest}
                  fillOpacity={sel || on ? 1 : 0.75}
                />
                {(on || sel) && (
                  <SvgText
                    x={p.x}
                    y={p.y - 2.6}
                    fontSize={3.4}
                    fontWeight="700"
                    fill={c.ink}
                    textAnchor="middle"
                  >
                    {place.number}
                  </SvgText>
                )}
              </G>
            )
          })}
        </Svg>
      </View>

      {selected ? (
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.sheetRow}>
            <View style={styles.sheetInfo}>
              <Text variant="headingLg" color="forest">
                {t('cemeteryMap.placeNumber', { n: selected.number })}
              </Text>
              <Text variant="bodySm" color="muted">
                {selected.coordinates.latitude.toFixed(6)}, {selected.coordinates.longitude.toFixed(6)}
              </Text>
            </View>
            <Pressable style={styles.close} onPress={() => setSelected(null)} hitSlop={10}>
              <Text variant="bodyMd" color="muted">
                ✕
              </Text>
            </Pressable>
          </View>
          <Button label={t('cemeteryMap.route')} onPress={() => onRoute(selected)} fullWidth />
          <Button
            label={t('cemeteryMap.reportMissing')}
            variant="ghost"
            onPress={() => showToast(t('cemeteryMap.reportSent'), 'info')}
          />
        </View>
      ) : (
        <View style={[styles.legend, { paddingBottom: insets.bottom + spacing.sm }]}>
          <Text variant="caption" color="muted" center>
            {t('cemeteryMap.tapHint')}
          </Text>
        </View>
      )}
    </View>
  )
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.cream },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
    hint: { marginTop: spacing.sm },
    search: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
    counter: { marginTop: spacing.xs },
    canvas: {
      flex: 1,
      marginHorizontal: spacing.md,
      borderRadius: radii.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.linen,
      backgroundColor: c.successBg,
    },
    sheet: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      gap: spacing.sm,
      backgroundColor: c.white,
      borderTopLeftRadius: radii.xl,
      borderTopRightRadius: radii.xl,
      ...(Platform.OS === 'web' ? {} : { shadowColor: c.forest, shadowOpacity: 0.12, shadowRadius: 16, elevation: 8 }),
    },
    sheetRow: { flexDirection: 'row', alignItems: 'flex-start' },
    sheetInfo: { flex: 1 },
    close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    legend: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
    label: { ...typography.caption },
  })
