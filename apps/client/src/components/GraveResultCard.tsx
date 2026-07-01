import type { Grave } from '@pamyat/api'
import { Avatar, Badge, Card, colors, spacing, Text } from '@pamyat/ui'
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
        <Avatar name={grave.fullName} size={44} imageUri={grave.photos[0]} />
        <View style={styles.info}>
          <Text variant="headingLg" color="forest" numberOfLines={1} style={styles.name}>
            {grave.fullName}
          </Text>
          <Text variant="bodySm" color="muted" numberOfLines={1}>
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
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  info: { flex: 1 },
  name: { fontFamily: 'PlayfairDisplay_500Medium', color: colors.forest, marginBottom: 2 },
})
