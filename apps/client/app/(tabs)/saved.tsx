import { Button, colors, Icon, Skeleton, spacing, Text } from '@pamyat/ui'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { FlatList, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { GraveResultCard } from '../../src/components/GraveResultCard'
import { useSavedGraves } from '../../src/hooks/queries'

export default function SavedScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { data, isLoading } = useSavedGraves()

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text variant="displayMd" color="forest">
          {t('saved.title')}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.list}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={72} radius={10} />
          ))}
        </View>
      ) : (data?.length ?? 0) === 0 ? (
        <View style={styles.empty}>
          <Icon name="saved" size={48} color={colors.stone} />
          <Text variant="bodyMd" color="muted" center style={styles.emptyText}>
            {t('saved.empty')}
          </Text>
          <Button label={t('saved.findGrave')} variant="secondary" onPress={() => router.push('/(tabs)')} />
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={g => g.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <GraveResultCard grave={item} onPress={() => router.push(`/grave/${item.id}`)} />
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.xl },
  emptyText: { maxWidth: 220 },
})
