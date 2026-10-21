import { cemeteryMapApi, type BurialPlace, type CemeteryMap, type PlacePerson } from '@pamyat/api'
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
import { Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native'
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

/** Регистр и «ё» не должны мешать поиску: на памятниках пишут по-разному. */
function normalize(s: string): string {
  return s.toLowerCase().replace(/ё/g, 'е').trim()
}

/** «1932–2019»: на карте хватает годов, полные даты — на странице памяти. */
function lifeYears(p: PlacePerson): string {
  const b = p.birthYear ?? (p.birthDate ? Number(p.birthDate.slice(0, 4)) : null)
  const d = p.deathYear ?? (p.deathDate ? Number(p.deathDate.slice(0, 4)) : null)
  if (!b && !d) return ''
  return `${b ?? '?'}–${d ?? '?'}`
}

/** Сколько найденных людей показываем списком под поиском. */
const MAX_RESULTS = 8

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

  // Ищем по номеру места или по ФИО (все слова запроса должны встретиться)
  const search = useMemo(() => {
    const q = normalize(query)
    if (!q || !data) return null
    if (/^\d+$/.test(q)) {
      const n = Number(q)
      return { byName: false, places: data.places.filter(p => p.number === n), people: [] }
    }
    const words = q.split(/\s+/)
    const people: { place: BurialPlace; person: PlacePerson }[] = []
    for (const place of data.places) {
      for (const person of place.people) {
        const name = normalize(person.fullName)
        if (words.every(w => name.includes(w))) people.push({ place, person })
      }
    }
    const places = [...new Map(people.map(r => [r.place.id, r.place])).values()]
    return { byName: true, places, people }
  }, [query, data])

  const named = useMemo(() => data?.places.filter(p => p.people.length > 0).length ?? 0, [data])

  // Единственный результат — сразу открываем карточку: попасть пальцем
  // в одну из 382 меток на экране телефона практически невозможно
  useEffect(() => {
    if (search?.places.length === 1) setSelected(search.places[0] ?? null)
  }, [search])

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

  const highlight = new Set((search?.places ?? []).map(p => p.id))
  const showResults = !!search?.byName && search.people.length > 1 && !selected

  return (
    <View style={styles.root}>
      <TopBar title={name ?? t('cemeteryMap.title')} onBack={() => router.back()} />

      <View style={styles.search}>
        <Input
          value={query}
          onChangeText={setQuery}
          placeholder={t('cemeteryMap.searchPlaceholder')}
        />
        <Text variant="caption" color="light" style={styles.counter}>
          {search
            ? search.places.length
              ? search.byName
                ? t('cemeteryMap.foundPeople', { count: search.people.length })
                : t('cemeteryMap.foundOne', { n: query.trim() })
              : t('cemeteryMap.notFound')
            : named
              ? t('cemeteryMap.total', { count: data.places.length, named })
              : t('cemeteryMap.totalPlain', { count: data.places.length })}
        </Text>
        {showResults ? (
          <View style={styles.results}>
            {search.people.slice(0, MAX_RESULTS).map(({ place, person }) => (
              <Pressable
                key={person.graveId}
                style={({ pressed }) => [styles.resultRow, pressed && styles.pressed]}
                onPress={() => onPick(place)}
              >
                <Text variant="bodyMd" style={styles.resultName} numberOfLines={1}>
                  {person.fullName}
                </Text>
                <Text variant="caption" color="muted">
                  {[lifeYears(person), t('cemeteryMap.placeShort', { n: place.number })].filter(Boolean).join(' · ')}
                </Text>
              </Pressable>
            ))}
            {search.people.length > MAX_RESULTS ? (
              <Text variant="caption" color="light" style={styles.more}>
                {t('cemeteryMap.refine', { count: search.people.length - MAX_RESULTS })}
              </Text>
            ) : null}
          </View>
        ) : null}
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
                {/* места без имени — светлее: сразу видно, где надпись не прочитана */}
                <Circle
                  cx={p.x}
                  cy={p.y}
                  r={sel ? 1.7 : on ? 1.5 : 0.85}
                  fill={sel ? c.gold : on ? c.error : place.people.length ? c.forest : c.stone}
                  fillOpacity={sel || on ? 1 : 0.8}
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
              <Text variant="caption" color="muted">
                {t('cemeteryMap.placeNumber', { n: selected.number })}
              </Text>
              {selected.people.length === 0 ? (
                <Text variant="bodyMd" color="muted" style={styles.noName}>
                  {t('cemeteryMap.noName')}
                </Text>
              ) : null}
            </View>
            <Pressable style={styles.close} onPress={() => setSelected(null)} hitSlop={10}>
              <Text variant="bodyMd" color="muted">
                ✕
              </Text>
            </Pressable>
          </View>
          {selected.people.length ? (
            <ScrollView style={styles.people} bounces={false}>
              {selected.people.map(person => (
                <Pressable
                  key={person.graveId}
                  style={({ pressed }) => [styles.person, pressed && styles.pressed]}
                  onPress={() => router.push(`/grave/${person.graveId}`)}
                >
                  <View style={styles.sheetInfo}>
                    <Text variant="headingMd" color="forest">
                      {person.fullName}
                    </Text>
                    {lifeYears(person) ? (
                      <Text variant="bodySm" color="muted">
                        {lifeYears(person)}
                      </Text>
                    ) : null}
                  </View>
                  <Text variant="bodySm" color="sage">
                    {t('cemeteryMap.openMemory')} ›
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}
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
    results: {
      marginTop: spacing.sm,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: c.linen,
      backgroundColor: c.white,
      overflow: 'hidden',
    },
    resultRow: {
      minHeight: 44,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: c.linen,
    },
    resultName: { fontFamily: typography.headingLg.fontFamily },
    more: { padding: spacing.sm, textAlign: 'center' },
    pressed: { backgroundColor: c.parchment },
    noName: { marginTop: spacing.xs },
    people: { maxHeight: 220 },
    person: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: 52,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: c.linen,
    },
    label: { ...typography.caption },
  })
