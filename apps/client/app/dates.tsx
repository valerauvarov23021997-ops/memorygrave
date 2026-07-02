import type { Reminder } from '@pamyat/api'
import { remindersApi } from '@pamyat/api'
import { AnimatedListItem, Card, EmptyState, Icon, SectionLabel, Skeleton, spacing, Text, TopBar, useColors, useThemedStyles, type ThemeColors } from '@pamyat/ui'
import { daysUntilAnnual, daysUntilIso, formatDayMonth, memorialDaysForYear, nextMemorialDay, pluralDays } from '@pamyat/utils'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

/**
 * Сводный экран памятных дат: личные даты по всем захоронениям
 * (отсортированы по близости) + православные дни поминовения года.
 */
export default function DatesScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const c = useColors()
  const styles = useThemedStyles(makeStyles)
  const { data: reminders, isLoading } = useQuery({
    queryKey: ['reminders', 'all'],
    queryFn: () => remindersApi.list(),
  })

  const sorted = useMemo(
    () => [...(reminders ?? [])].sort((a, b) => daysUntilAnnual(a.date) - daysUntilAnnual(b.date)),
    [reminders]
  )

  const national = useMemo(() => {
    const next = nextMemorialDay()
    const year = Number(next.date.slice(0, 4))
    // Показываем дни текущего церковного «горизонта»: от ближайшего и дальше
    const all = [...memorialDaysForYear(year), ...memorialDaysForYear(year + 1)]
    return all.filter(d => d.date >= next.date).slice(0, 4)
  }, [])

  return (
    <View style={styles.root}>
      <TopBar title={t('dates.title')} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <SectionLabel>{t('dates.personal')}</SectionLabel>
        {isLoading ? (
          <Skeleton width="100%" height={140} radius={12} />
        ) : sorted.length === 0 ? (
          <EmptyState icon="bell" title={t('dates.empty')} subtitle={t('dates.emptyHint')} />
        ) : (
          sorted.map((r, index) => (
            <AnimatedListItem key={r.id} index={index}>
              <PersonalRow reminder={r} onPress={() => router.push(`/reminders/${r.graveId}`)} />
            </AnimatedListItem>
          ))
        )}

        <SectionLabel style={styles.nationalLabel}>{t('dates.national')}</SectionLabel>
        <Card variant="surface" padding="md">
          {national.map((d, i) => (
            <View key={d.date} style={[styles.nationalRow, i < national.length - 1 && styles.nationalDivider]}>
              <View style={styles.nationalIcon}>
                <Icon name="candle" size={16} color={c.gold} />
              </View>
              <View style={styles.nationalBody}>
                <Text variant="bodyMd" color="ink">
                  {d.name}
                </Text>
                <Text variant="bodySm" color="light">
                  {d.hint}
                </Text>
              </View>
              <View style={styles.nationalWhen}>
                <Text variant="bodySm" color="forest" style={styles.nationalDate}>
                  {formatDayMonth(d.date)}
                </Text>
                <Text variant="caption" color="light">
                  {daysUntilIso(d.date) === 0 ? t('home.today') : t('home.inDays', { value: pluralDays(daysUntilIso(d.date)) })}
                </Text>
              </View>
            </View>
          ))}
        </Card>
        <View style={{ height: insets.bottom + spacing.xl }} />
      </ScrollView>
    </View>
  )
}

function PersonalRow({ reminder, onPress }: { reminder: Reminder; onPress: () => void }) {
  const { t } = useTranslation()
  const c = useColors()
  const styles = useThemedStyles(makeStyles)
  const days = daysUntilAnnual(reminder.date)
  const isBirthday = reminder.type === 'birthday'
  return (
    <Pressable style={styles.personalRow} onPress={onPress}>
      <View style={[styles.personalIcon, { backgroundColor: isBirthday ? c.warningBg : c.parchment }]}>
        <Icon name={isBirthday ? 'cake' : 'candle'} size={16} color={isBirthday ? c.warning : c.muted} />
      </View>
      <View style={styles.personalBody}>
        <Text variant="bodyMd" color="ink" numberOfLines={1}>
          {reminder.label}
        </Text>
        <Text variant="bodySm" color="light" numberOfLines={1}>
          {reminder.graveName}
        </Text>
      </View>
      <View style={styles.nationalWhen}>
        <Text variant="bodySm" color="forest" style={styles.nationalDate}>
          {formatDayMonth(reminder.date)}
        </Text>
        <Text variant="caption" color="light">
          {days === 0 ? t('home.today') : t('home.inDays', { value: pluralDays(days) })}
        </Text>
      </View>
    </Pressable>
  )
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.cream },
    content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
    personalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.linen,
    },
    personalIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    personalBody: { flex: 1 },
    nationalLabel: { marginTop: spacing.lg },
    nationalRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
    nationalDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.linen },
    nationalIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.warningBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    nationalBody: { flex: 1 },
    nationalWhen: { alignItems: 'flex-end' },
    nationalDate: { fontFamily: 'DMSans_500Medium' },
  })
