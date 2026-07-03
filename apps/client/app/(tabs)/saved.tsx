import { AnimatedListItem, EmptyState, GroupedRow, spacing, Text, useThemedStyles, type ThemeColors } from '@pamyat/ui'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { FlatList, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { GraveResultSkeleton } from '../../src/components/GraveResultSkeleton'
import { useSavedGraves } from '../../src/hooks/queries'
import { graveMeta, groupedPosition } from '../../src/lib/graveMeta'

export default function SavedScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const styles = useThemedStyles(makeStyles)
  const { data, isLoading, refetch, isRefetching } = useSavedGraves()

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
            <GraveResultSkeleton key={i} />
          ))}
        </View>
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState
          icon="saved"
          title={t('saved.empty')}
          actionLabel={t('saved.findGrave')}
          onAction={() => router.push('/(tabs)')}
        />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={g => g.id}
          contentContainerStyle={styles.list}
          onRefresh={refetch}
          refreshing={isRefetching}
          renderItem={({ item, index }) => (
            <AnimatedListItem index={index}>
              <GroupedRow
                serif
                avatarName={item.fullName}
                avatarUri={item.photos[0]}
                title={item.fullName}
                subtitle={graveMeta(item)}
                onPress={() => router.push(`/grave/${item.id}`)}
                position={groupedPosition(index, data?.length ?? 0)}
              />
            </AnimatedListItem>
          )}
        />
      )}
    </View>
  )
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.cream },
    header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    list: { paddingHorizontal: spacing.lg, paddingBottom: 120 },
  })
