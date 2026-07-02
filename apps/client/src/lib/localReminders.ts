/**
 * Локальные напоминания о памятных датах — планируются прямо на устройстве
 * через expo-notifications, без сервера и push-сервисов.
 * Уведомление приходит за несколько дней до годовщины, ежегодно.
 */
import type { Reminder } from '@pamyat/api'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Notifications from 'expo-notifications'

const MAP_KEY = 'reminder_notifications'
const DAYS_BEFORE = 5
const NOTIFY_HOUR = 10

type NotificationMap = Record<string, string>

async function getMap(): Promise<NotificationMap> {
  const raw = await AsyncStorage.getItem(MAP_KEY)
  return raw ? (JSON.parse(raw) as NotificationMap) : {}
}

async function saveMap(map: NotificationMap): Promise<void> {
  await AsyncStorage.setItem(MAP_KEY, JSON.stringify(map))
}

/** Запрашивает разрешение на уведомления. true — если выдано. */
export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync()
  if (current.granted) return true
  const requested = await Notifications.requestPermissionsAsync()
  return requested.granted
}

/** Планирует ежегодное уведомление за DAYS_BEFORE дней до даты. */
export async function scheduleReminder(reminder: Reminder): Promise<void> {
  await cancelReminder(reminder.id)

  const date = new Date(reminder.date)
  if (Number.isNaN(date.getTime())) return

  // Дата уведомления = годовщина минус DAYS_BEFORE дней (берём месяц и день).
  const notify = new Date(2000, date.getMonth(), date.getDate())
  notify.setDate(notify.getDate() - DAYS_BEFORE)

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: reminder.label,
      body: `${reminder.graveName}: памятная дата через ${DAYS_BEFORE} дней. Заказать уход?`,
      data: { graveId: reminder.graveId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      month: notify.getMonth() + 1,
      day: notify.getDate(),
      hour: NOTIFY_HOUR,
      minute: 0,
      repeats: true,
    },
  })

  const map = await getMap()
  map[reminder.id] = notificationId
  await saveMap(map)
}

/** Отменяет запланированное уведомление напоминания. */
export async function cancelReminder(reminderId: string): Promise<void> {
  const map = await getMap()
  const notificationId = map[reminderId]
  if (notificationId) {
    await Notifications.cancelScheduledNotificationAsync(notificationId)
    delete map[reminderId]
    await saveMap(map)
  }
}

/** Синхронизирует расписание со списком напоминаний (включённые — планирует). */
export async function syncReminders(reminders: Reminder[]): Promise<void> {
  // Планируем только если разрешение уже выдано — не дёргаем запрос при пассивной синхронизации.
  const { granted } = await Notifications.getPermissionsAsync()
  for (const reminder of reminders) {
    try {
      if (reminder.isEnabled && granted) await scheduleReminder(reminder)
      else if (!reminder.isEnabled) await cancelReminder(reminder.id)
    } catch {
      // не критично — расписание не должно ронять экран
    }
  }
}
