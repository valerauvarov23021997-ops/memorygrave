import { Card, Icon, spacing, Text, useColors, useThemedStyles, type ThemeColors } from '@pamyat/ui'
import { daysUntilAnnual, daysUntilIso, formatDayMonth, nextMemorialDay, pluralDays } from '@pamyat/utils'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'

import { useSavedGraves } from '../hooks/queries'

interface Upcoming {
  days: number
  date: string
  title: string
  subtitle: string
  graveId?: string
}

/**
 * Карточка «ближайшая памятная дата» на главной: личные годовщины
 * по сохранённым захоронениям + православные дни поминовения.
 */
export function UpcomingDateCard() {
  const { t } = useTranslation()
  const router = useRouter()
  const c = useColors()
  const styles = useThemedStyles(makeStyles)
  const { data: saved } = useSavedGraves()

  const upcoming = useMemo<Upcoming | null>(() => {
    const candidates: Upcoming[] = []

    for (const grave of saved ?? []) {
      if (grave.deathDate) {
        candidates.push({
          days: daysUntilAnnual(grave.deathDate),
          date: grave.deathDate,
          title: t('home.anniversary'),
          subtitle: grave.fullName,
          graveId: grave.id,
        })
      }
      if (grave.birthDate) {
        candidates.push({
          days: daysUntilAnnual(grave.birthDate),
          date: grave.birthDate,
          title: t('home.birthday'),
          subtitle: grave.fullName,
          graveId: grave.id,
        })
      }
    }

    const national = nextMemorialDay()
    candidates.push({
      days: daysUntilIso(national.date),
      date: national.date,
      title: national.name,
      subtitle: national.hint,
    })

    candidates.sort((a, b) => a.days - b.days)
    return candidates[0] ?? null
  }, [saved, t])

  if (!upcoming) return null

  const when =
    upcoming.days === 0
      ? t('home.today')
      : upcoming.days === 1
        ? t('home.tomorrow')
        : t('home.inDays', { value: pluralDays(upcoming.days) })

  const onPress = () => {
    if (upcoming.graveId) router.push(`/grave/${upcoming.graveId}`)
    else router.push('/(tabs)/saved')
  }

  return (
    <Card padding="md" onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Icon name="candle" size={20} color={c.gold} />
        </View>
        <View style={styles.body}>
          <Text variant="caption" style={styles.kicker}>
            {`${t('home.upcoming').toUpperCase()} · ${when.toUpperCase()}`}
          </Text>
          <Text variant="headingMd" color="ink" numberOfLines={1}>
            {upcoming.title}
          </Text>
          <Text variant="bodySm" color="muted" numberOfLines={1}>
            {`${upcoming.subtitle} · ${formatDayMonth(upcoming.date)}`}
          </Text>
        </View>
        <Icon name="chevronRight" size={18} color={c.light} />
      </View>
    </Card>
  )
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    card: { marginHorizontal: spacing.lg, marginBottom: spacing.md },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.warningBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: { flex: 1 },
    kicker: { color: c.gold, letterSpacing: 1, marginBottom: 2, fontFamily: 'DMSans_500Medium' },
  })
