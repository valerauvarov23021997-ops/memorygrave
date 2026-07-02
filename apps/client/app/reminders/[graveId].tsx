import type { Reminder } from '@pamyat/api'
import { remindersApi } from '@pamyat/api'
import { BottomSheet, Button, Card, useColors, useThemedStyles, useToast, type ThemeColors, Divider, Icon, Input, SectionLabel, Skeleton, spacing, Text, Toggle, TopBar } from '@pamyat/ui'
import { useOrderDraftStore } from '@pamyat/store'
import { dateMaskToIso, daysUntilAnnual, formatDateMask, formatDayMonth, pluralDays } from '@pamyat/utils'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useReminders, useServices } from '../../src/hooks/queries'
import { queryKeys } from '../../src/hooks/queries'
import {
  cancelReminder,
  ensureNotificationPermission,
  scheduleReminder,
  syncReminders,
} from '../../src/lib/localReminders'

export default function RemindersScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const c = useColors()
  const styles = useThemedStyles(makeStyles)
  const qc = useQueryClient()
  const showToast = useToast()
  const { graveId } = useLocalSearchParams<{ graveId: string }>()
  const { data: reminders, isLoading } = useReminders(graveId)
  const { data: services } = useServices()
  const startOrder = useOrderDraftStore(s => s.startOrder)

  // Синхронизируем расписание уведомлений с включёнными напоминаниями.
  useEffect(() => {
    if (reminders) void syncReminders(reminders)
  }, [reminders])

  const [adding, setAdding] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newDate, setNewDate] = useState('')
  const [dateError, setDateError] = useState<string | undefined>()

  const create = useMutation({
    mutationFn: async () => {
      const iso = dateMaskToIso(newDate)
      if (!iso) throw new Error('date')
      const reminder = await remindersApi.create({
        graveId: graveId ?? '',
        type: 'custom',
        date: iso,
        label: newLabel.trim(),
        autoOrder: [],
      })
      const granted = await ensureNotificationPermission()
      if (granted) await scheduleReminder(reminder)
      return reminder
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.reminders(graveId) })
      setAdding(false)
      setNewLabel('')
      setNewDate('')
      setDateError(undefined)
      showToast(t('reminders.added'), 'success')
    },
    onError: () => setDateError(t('reminders.dateInvalid')),
  })

  const canCreate = newLabel.trim().length > 0 && newDate.length === 10

  const toggle = useMutation({
    mutationFn: async ({ reminder, next }: { reminder: Reminder; next: boolean }) => {
      const updated = await remindersApi.update(reminder.id, { isEnabled: next })
      if (next) {
        const granted = await ensureNotificationPermission()
        if (granted) await scheduleReminder({ ...reminder, isEnabled: true })
      } else {
        await cancelReminder(reminder.id)
      }
      return updated
    },
    onSuccess: (_res, { next }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.reminders(graveId) })
      showToast(next ? t('reminders.enabled') : t('reminders.disabled'), 'success')
    },
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
            <ReminderRow key={r.id} reminder={r} onToggle={next => toggle.mutate({ reminder: r, next })} />
          ))
        )}

        <Pressable style={styles.addRow} onPress={() => setAdding(true)}>
          <Icon name="plus" size={20} color={c.sage} />
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
              <Icon name="checkCircle" size={18} color={c.sage} weight="fill" />
              <Text variant="bodyMd" color="ink">
                {s.name}
              </Text>
            </View>
          ))}
          <Pressable
            style={styles.configureRow}
            onPress={() => {
              if (first) startOrder({ id: first.graveId, name: first.graveName, cemetery: first.cemeteryName })
              router.push('/order/catalog')
            }}
          >
            <Text variant="bodySm" color="sage">
              {t('reminders.configureAuto')}
            </Text>
          </Pressable>
        </Card>
        <View style={{ height: insets.bottom + spacing.lg }} />
      </ScrollView>

      <BottomSheet visible={adding} onClose={() => setAdding(false)}>
        <Text variant="headingLg" color="forest" style={styles.sheetTitle}>
          {t('reminders.addDate')}
        </Text>
        <View style={styles.sheetField}>
          <Input
            label={t('reminders.labelField')}
            value={newLabel}
            onChangeText={setNewLabel}
            placeholder={t('reminders.labelPlaceholder')}
          />
        </View>
        <View style={styles.sheetField}>
          <Input
            label={t('reminders.dateField')}
            value={newDate}
            onChangeText={text => {
              setNewDate(formatDateMask(text))
              setDateError(undefined)
            }}
            placeholder="ДД.ММ.ГГГГ"
            keyboardType="number-pad"
            error={dateError}
          />
        </View>
        <Button
          label={t('common.save')}
          onPress={() => create.mutate()}
          disabled={!canCreate}
          loading={create.isPending}
          fullWidth
        />
      </BottomSheet>
    </View>
  )
}

function ReminderRow({ reminder, onToggle }: { reminder: Reminder; onToggle: (next: boolean) => void }) {
  const { t } = useTranslation()
  const c = useColors()
  const styles = useThemedStyles(makeStyles)
  const days = daysUntilAnnual(reminder.date)
  const isBirthday = reminder.type === 'birthday'
  return (
    <View style={styles.reminderRow}>
      <View style={[styles.iconWrap, { backgroundColor: isBirthday ? c.warningBg : c.parchment }]}>
        <Icon name={isBirthday ? 'cake' : 'candle'} size={18} color={isBirthday ? c.warning : c.muted} />
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

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: c.cream },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  context: { marginBottom: spacing.lg },
  empty: { paddingVertical: spacing.md },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.linen,
  },
  iconWrap: { width: 26, height: 26, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  reminderBody: { flex: 1 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  sheetTitle: { marginBottom: spacing.md },
  sheetField: { marginBottom: spacing.md },
  autoDesc: { marginBottom: spacing.sm },
  autoService: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  configureRow: { marginTop: spacing.sm },
})
