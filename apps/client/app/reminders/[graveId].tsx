import type { Reminder } from '@pamyat/api'
import { remindersApi } from '@pamyat/api'
import { Card, colors, Divider, Icon, SectionLabel, Skeleton, spacing, Text, Toggle, TopBar } from '@pamyat/ui'
import { daysUntilAnnual, formatDayMonth, pluralDays } from '@pamyat/utils'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useReminders, useServices } from '../../src/hooks/queries'
import { queryKeys } from '../../src/hooks/queries'

export default function RemindersScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const qc = useQueryClient()
  const { graveId } = useLocalSearchParams<{ graveId: string }>()
  const { data: reminders, isLoading } = useReminders(graveId)
  const { data: services } = useServices()

  const toggle = useMutation({
    mutationFn: ({ id, isEnabled }: { id: string; isEnabled: boolean }) =>
      remindersApi.update(id, { isEnabled }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.reminders(graveId) }),
  })

  const first = reminders?.[0]
  const autoOrder = reminders?.find(r => r.autoOrder.length > 0)
  const autoServices = services?.filter(s => autoOrder?.autoOrder.includes(s.id)) ?? []

  return (
    <View style={styles.root}>
      <TopBar title={t('reminders.title')} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        {first ? (
          <Card variant="surface" padding="md" style={styles.context}>
            <Text variant="headingMd" color="ink">
              {first.graveName}
            </Text>
            <Text variant="bodySm" color="muted">
              {first.cemeteryName}
            </Text>
          </Card>
        ) : null}

        <SectionLabel>{t('reminders.dates')}</SectionLabel>
        {isLoading ? (
          <Skeleton width="100%" height={120} radius={10} />
        ) : (reminders?.length ?? 0) === 0 ? (
          <Text variant="bodyMd" color="muted" style={styles.empty}>
            {t('reminders.empty')}
          </Text>
        ) : (
          reminders?.map(r => (
            <ReminderRow key={r.id} reminder={r} onToggle={next => toggle.mutate({ id: r.id, isEnabled: next })} />
          ))
        )}

        <Pressable style={styles.addRow}>
          <Icon name="plus" size={20} color={colors.sage} />
          <Text variant="bodyMd" color="sage">
            {t('reminders.addDate')}
          </Text>
        </Pressable>

        <Divider />

        <SectionLabel>{t('reminders.autoOrder')}</SectionLabel>
        <Card variant="surface" padding="md">
          <Text variant="bodySm" color="muted" style={styles.autoDesc}>
            {t('reminders.autoOrderDesc')}
          </Text>
          {autoServices.map(s => (
            <View key={s.id} style={styles.autoService}>
              <Icon name="checkCircle" size={18} color={colors.sage} weight="fill" />
              <Text variant="bodyMd" color="ink">
                {s.name}
              </Text>
            </View>
          ))}
          <Pressable style={styles.configureRow} onPress={() => router.push('/order/catalog')}>
            <Text variant="bodySm" color="sage">
              {t('reminders.configureAuto')}
            </Text>
          </Pressable>
        </Card>
        <View style={{ height: insets.bottom + spacing.lg }} />
      </ScrollView>
    </View>
  )
}

function ReminderRow({ reminder, onToggle }: { reminder: Reminder; onToggle: (next: boolean) => void }) {
  const { t } = useTranslation()
  const days = daysUntilAnnual(reminder.date)
  const isBirthday = reminder.type === 'birthday'
  return (
    <View style={styles.reminderRow}>
      <View style={[styles.iconWrap, { backgroundColor: isBirthday ? colors.warningBg : colors.parchment }]}>
        <Icon name={isBirthday ? 'cake' : 'candle'} size={18} color={isBirthday ? colors.warning : colors.muted} />
      </View>
      <View style={styles.reminderBody}>
        <Text variant="headingMd" color="ink">
          {reminder.label}
        </Text>
        <Text variant="bodySm" color="light">
          {t('reminders.inDays', { date: formatDayMonth(reminder.date), days: pluralDays(days) })}
        </Text>
      </View>
      <Toggle value={reminder.isEnabled} onValueChange={onToggle} />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  context: { marginBottom: spacing.lg },
  empty: { paddingVertical: spacing.md },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.linen,
  },
  iconWrap: { width: 26, height: 26, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  reminderBody: { flex: 1 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  autoDesc: { marginBottom: spacing.sm },
  autoService: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  configureRow: { marginTop: spacing.sm },
})
