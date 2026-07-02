import {
  AnimatedListItem,
  BottomSheet,
  Chip,
  EmptyState,
  Icon,
  spacing,
  Text,
  typography,
  useColors,
  useThemedStyles,
  type ThemeColors,
} from '@pamyat/ui'
import { useSearchStore } from '@pamyat/store'
import { pluralResults } from '@pamyat/utils'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { GraveResultCard } from '../../src/components/GraveResultCard'
import { GraveResultSkeleton } from '../../src/components/GraveResultSkeleton'
import { useCemeteries, useCities, useGraveSearch } from '../../src/hooks/queries'

type Picker = 'city' | 'cemetery' | null

export default function SearchScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const c = useColors()
  const styles = useThemedStyles(makeStyles)
  const { query, setQuery, city, cemeteryId, setCity, setCemetery } = useSearchStore()
  const [focused, setFocused] = useState(false)
  const [picker, setPicker] = useState<Picker>(null)

  const { data: cities } = useCities()
  const { data: cemeteries } = useCemeteries()
  const cemeteryName = cemeteries?.find(cm => cm.id === cemeteryId)?.name

  const hasQuery = query.trim().length > 0
  const hasFilters = !!city || !!cemeteryId
  const active = hasQuery || hasFilters
  const params = useMemo(
    () => ({ q: query.trim(), city: city ?? undefined, cemeteryId: cemeteryId ?? undefined }),
    [query, city, cemeteryId]
  )
  const { data, isLoading } = useGraveSearch(params, active)

  const addGraveCard = (
    <Pressable style={styles.addCard} onPress={() => router.push('/grave/add')}>
      <Icon name="plus" size={18} color={c.sage} />
      <Text variant="bodySm" color="sage" style={styles.addLabel}>
        {t('search.addGrave')}
      </Text>
    </Pressable>
  )

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text variant="displayMd" color="forest">
          {t('search.appName')}
        </Text>
        <Pressable hitSlop={8}>
          <Icon name="bell" size={22} color={c.sage} />
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <View style={[styles.searchBar, focused && styles.searchBarActive]}>
          <Icon name="search" size={20} color={c.sage} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={t('search.placeholder')}
            placeholderTextColor={c.light}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {hasQuery ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Icon name="close" size={18} color={c.light} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.chips}>
        <Chip
          label={city ?? t('search.filterCity')}
          active={!!city}
          onPress={() => (city ? setCity(null) : setPicker('city'))}
        />
        <Chip
          label={cemeteryName ?? t('search.filterCemetery')}
          active={!!cemeteryId}
          onPress={() => (cemeteryId ? setCemetery(null) : setPicker('cemetery'))}
        />
      </View>

      {!active ? (
        <EmptyState icon="search" title={t('search.emptyTitle')} subtitle={t('search.emptyHint')} />
      ) : isLoading ? (
        <View style={styles.list}>
          {Array.from({ length: 5 }).map((_, i) => (
            <GraveResultSkeleton key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={g => g.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListHeaderComponent={
            <Text variant="caption" color="muted" style={styles.count}>
              {t('search.found', { value: pluralResults(data?.length ?? 0) })}
            </Text>
          }
          renderItem={({ item, index }) => (
            <AnimatedListItem index={index}>
              <GraveResultCard grave={item} onPress={() => router.push(`/grave/${item.id}`)} />
            </AnimatedListItem>
          )}
          ListEmptyComponent={
            <View style={styles.noResults}>
              <Text variant="bodyMd" color="muted" center>
                {t('search.noResults')}
              </Text>
            </View>
          }
          ListFooterComponent={addGraveCard}
        />
      )}

      <BottomSheet visible={picker !== null} onClose={() => setPicker(null)}>
        <Text variant="headingLg" color="forest" style={styles.pickerTitle}>
          {picker === 'city' ? t('search.filterCity') : t('search.filterCemetery')}
        </Text>
        {picker === 'city'
          ? (cities ?? []).map(item => (
              <Pressable
                key={item.id}
                style={styles.pickerRow}
                onPress={() => {
                  setCity(item.name)
                  setPicker(null)
                }}
              >
                <Text variant="bodyLg" color="ink">
                  {item.name}
                </Text>
              </Pressable>
            ))
          : (cemeteries ?? []).map(item => (
              <Pressable
                key={item.id}
                style={styles.pickerRow}
                onPress={() => {
                  setCemetery(item.id)
                  setPicker(null)
                }}
              >
                <Text variant="bodyLg" color="ink">
                  {item.name}
                </Text>
                <Text variant="bodySm" color="light">
                  {item.cityName}
                </Text>
              </Pressable>
            ))}
      </BottomSheet>
    </View>
  )
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: c.cream },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  searchWrap: { paddingHorizontal: spacing.lg },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 48,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    backgroundColor: c.parchment,
  },
  searchBarActive: { backgroundColor: c.white, borderWidth: 0.5, borderColor: c.sage },
  searchInput: { flex: 1, ...typography.bodyMd, color: c.ink },
  chips: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, gap: spacing.sm },
  emptyTitle: { marginTop: spacing.md },
  emptyHint: { maxWidth: 200 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: 0 },
  count: { marginBottom: spacing.sm },
  noResults: { paddingVertical: spacing.xl },
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: c.stone,
    marginTop: spacing.sm,
  },
  addLabel: { fontFamily: 'DMSans_500Medium' },
  pickerTitle: { marginBottom: spacing.md },
  pickerRow: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.linen,
  },
})
