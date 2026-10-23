import { Card, Skeleton, spacing } from '@pamyat/ui'
import { StyleSheet, View } from 'react-native'

/** Скелетон карточки захоронения — повторяет форму GraveResultCard. */
export function GraveResultSkeleton() {
  return (
    <Card padding="md" style={styles.card}>
      <View style={styles.row}>
        <Skeleton width={44} height={44} radius={22} />
        <View style={styles.lines}>
          <Skeleton width="65%" height={16} radius={6} />
          <Skeleton width="45%" height={12} radius={6} />
        </View>
      </View>
    </Card>
  )
}

/** Скелетон карточки заказа — повторяет форму OrderCard. */
export function OrderCardSkeleton() {
  return (
    <Card padding="md" style={styles.card}>
      <View style={styles.orderTop}>
        <Skeleton width="50%" height={16} radius={6} />
        <Skeleton width={96} height={18} radius={9} />
      </View>
      <View style={styles.orderMeta}>
        <Skeleton width="35%" height={12} radius={6} />
      </View>
      <View style={styles.orderFooter}>
        <Skeleton width={72} height={12} radius={6} />
        <Skeleton width={64} height={16} radius={6} />
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  lines: { flex: 1, gap: spacing.sm },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderMeta: { marginTop: spacing.sm },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
})

