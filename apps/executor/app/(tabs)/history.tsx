import { Card, colors, EmptyState, Skeleton, spacing, Text } from '@pamyat/ui'
import { formatDate, formatPrice } from '@pamyat/utils'
import { useTranslation } from 'react-i18next'
import { FlatList, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useExecutorOrders } from '../../src/hooks/queries'

export default function HistoryScreen() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const { data, isLoading } = useExecutorOrders('completed')

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text variant="displayMd" color="forest">
          {t('history.title')}
        </Text>
      </View>
      {isLoading ? (
        <View style={styles.list}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={72} radius={10} />
          ))}
        </View>
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState icon="checkCircle" title={t('history.empty')} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={o => o.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card padding="md" style={styles.card}>
              <View style={styles.row}>
                <View style={styles.info}>
                  <Text variant="headingMd" color="ink">
                    {item.serviceName}
                  </Text>
                  <Text variant="bodySm" color="muted">
                    {`${item.cemeteryName} · ${formatDate(item.date)}`}
                  </Text>
                </View>
                <Text variant="headingMd" color="forest">
                  {formatPrice(item.reward)}
                </Text>
              </View>
            </Card>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 120, gap: spacing.sm },
  card: {},
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  info: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.xl },
  emptyText: { maxWidth: 220 },
})
