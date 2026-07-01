import type { Grave } from '@pamyat/api'
import { Badge, Card, colors, spacing, Text } from '@pamyat/ui'
import { formatDate } from '@pamyat/utils'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'

import { graveStatusBadge } from '../lib/statusMaps'

interface Props {
  grave: Grave
  onPress: () => void
}

/** Карточка результата поиска / сохранённого захоронения. */
export function GraveResultCard({ grave, onPress }: Props) {
  const { t } = useTranslation()
  const badge = graveStatusBadge(grave.status, t)
  const years = [formatDate(grave.birthDate), formatDate(grave.deathDate)].filter(Boolean).join(' – ')
  const meta = [years, grave.cemeteryName, grave.plot].filter(Boolean).join(' · ')

  return (
    <Card onPress={onPress} padding="md" style={styles.card}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text variant="headingMd" color="forest" style={styles.name}>
            {grave.fullName}
          </Text>
          <Text variant="bodySm" color="muted">
            {meta}
          </Text>
        </View>
        <Badge label={badge.label} variant={badge.variant} />
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  info: { flex: 1 },
  name: { fontFamily: 'PlayfairDisplay_500Medium', color: colors.forest, marginBottom: 2 },
})
