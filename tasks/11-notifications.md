# Задача 11 — Push-уведомления

## Зависимости
Все предыдущие задачи выполнены.

## Настройка FCM

### Получение разрешений (apps/client/src/utils/notifications.ts)
```ts
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null  // симулятор не поддерживает push

  const { status: existing } = await Notifications.getPermissionsAsync()
  let status = existing

  if (existing !== 'granted') {
    const { status: requested } = await Notifications.requestPermissionsAsync()
    status = requested
  }

  if (status !== 'granted') return null

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig?.extra?.eas?.projectId,
  })

  // Сохранить токен на бэкенде
  await userApi.registerPushToken(token.data)
  return token.data
}
```

**Вызов**: после успешной авторизации в SmsCodeScreen, однократно.

### Обработка входящих уведомлений
```ts
// apps/client/src/App.tsx (или корневой компонент)

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
})

// При нажатии на уведомление — навигация на нужный экран
useEffect(() => {
  const sub = Notifications.addNotificationResponseReceivedListener(response => {
    const { screen, params } = response.notification.request.content.data as {
      screen: string; params: Record<string, string>
    }
    if (screen && navigationRef.current) {
      navigationRef.current.navigate(screen, params)
    }
  })
  return () => sub.remove()
}, [])
```

## Маппинг уведомлений → экраны

| Событие бэкенда      | data.screen       | data.params              |
|----------------------|-------------------|--------------------------|
| Заказ принят         | `OrderStatus`     | `{ orderId }`            |
| Исполнитель едет     | `OrderStatus`     | `{ orderId }`            |
| Заказ выполнен       | `PhotoReport`     | `{ orderId }`            |
| Напоминание о дате   | `Grave`           | `{ graveId }`            |
| Автозаказ создан     | `OrderStatus`     | `{ orderId }`            |
| Возврат выполнен     | `OrdersList`      | `{}`                     |
| Новый заказ (испол.) | `ActiveOrders`    | `{}`                     |

## packages/api/src/user.api.ts (дополнить)
```ts
registerPushToken: (token: string) =>
  client.post('/user/push-token', { token, platform: Platform.OS }),
```

## Локальные уведомления (для напоминаний)

Локальные уведомления планируются при создании/обновлении Reminder:

```ts
// packages/utils/src/localNotifications.ts
import * as Notifications from 'expo-notifications'

export async function scheduleReminderNotification(reminder: Reminder) {
  // За 7 дней до даты
  await Notifications.scheduleNotificationAsync({
    identifier: `reminder-${reminder.id}-7`,
    content: {
      title: 'Память',
      body: `Через 7 дней — ${reminder.label} (${reminder.grave.fullName})`,
      data: { screen: 'Grave', params: { graveId: reminder.graveId } },
    },
    trigger: { date: getDateMinusDays(reminder.date, 7) },
  })
  // За 3 дня
  await Notifications.scheduleNotificationAsync({
    identifier: `reminder-${reminder.id}-3`,
    content: {
      title: 'Память',
      body: `Через 3 дня — ${reminder.label} (${reminder.grave.fullName})`,
      data: { screen: 'Grave', params: { graveId: reminder.graveId } },
    },
    trigger: { date: getDateMinusDays(reminder.date, 3) },
  })
}

export async function cancelReminderNotification(reminderId: string) {
  await Notifications.cancelScheduledNotificationAsync(`reminder-${reminderId}-7`)
  await Notifications.cancelScheduledNotificationAsync(`reminder-${reminderId}-3`)
}
```

## Критерии выполнения

- [ ] Разрешение запрашивается после авторизации (не при запуске)
- [ ] FCM-токен регистрируется на бэкенде
- [ ] Нажатие на push-уведомление открывает нужный экран с правильными параметрами
- [ ] Локальные уведомления планируются при создании Reminder
- [ ] При удалении Reminder — его уведомления отменяются
- [ ] Работает в фоновом режиме (приложение свёрнуто)
