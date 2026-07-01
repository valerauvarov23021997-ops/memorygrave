# Задача 08 — Памятные даты и автозаказ

## Типы

```ts
export interface Reminder {
  id:          string
  graveId:     string
  type:        'birthday' | 'anniversary' | 'custom'
  date:        string          // MM-DD (без года)
  label:       string          // «День рождения», «Годовщина», кастомное
  isEnabled:   boolean
  autoOrder:   AutoOrderConfig | null
  daysUntil:   number          // вычисляется на бэке
}

export interface AutoOrderConfig {
  serviceIds:      string[]
  paymentMethodId: string
  daysBeforeDate:  number     // за сколько дней до даты создавать заказ
}
```

## RemindersScreen.tsx

Параметры: `{ graveId: string }`

```ts
const { data: reminders, refetch } = useQuery({
  queryKey: ['reminders', graveId],
  queryFn:  () => remindersApi.getByGrave(graveId),
})

async function toggleReminder(id: string, current: boolean) {
  await remindersApi.update(id, { isEnabled: !current })
  refetch()
}
```

### UI
```
Card с именем и кладбищем (контекст)

SectionLabel «Памятные даты»

[Для каждого reminder:]
RemindItem
  ├─ IconWrap (круглый, цвет по type: birthday=warningBg, anniversary=parchment)
  ├─ IconWrap > Icon (cake / candle / calendar)
  ├─ Body: label + «MM дня · через N дней»
  └─ Toggle value={isEnabled} onValueChange={() => toggle(id, isEnabled)}

Row «+ Добавить дату» (icon: plus, color sage)
  → открывает AddReminderBottomSheet

Divider

SectionLabel «Автозаказ к дате»
AutoOrderCard
  ├─ Описание «За N дней до [label] автоматически заказать:»
  ├─ Список выбранных услуг с галочками
  └─ Ссылка «+ Настроить автозаказ» → AutoOrderBottomSheet
```

## AddReminderBottomSheet.tsx

```tsx
// DatePicker (только день и месяц, без года)
// Input «Название даты» (для type === 'custom')
// Button «Сохранить»
```

## AutoOrderBottomSheet.tsx

Показывается только при наличии подписки Standard+.
Если базовая подписка — показывает paywall.

```tsx
// Выбор услуг (мультиселект из каталога)
// Выбор сохранённой карты оплаты
// Slider «За сколько дней до даты» (1 / 3 / 5 / 7)
// Button «Сохранить автозаказ»
```

## packages/api/src/reminders.api.ts

```ts
export const remindersApi = {
  getByGrave: (graveId: string) =>
    client.get<{ data: Reminder[] }>('/reminders', { params: { graveId } }),
  create: (body: { graveId: string; type: string; date: string; label: string }) =>
    client.post<{ data: Reminder }>('/reminders', body),
  update: (id: string, body: Partial<Pick<Reminder, 'isEnabled' | 'autoOrder'>>) =>
    client.put<{ data: Reminder }>(`/reminders/${id}`, body),
  delete: (id: string) =>
    client.delete(`/reminders/${id}`),
}
```

## Критерии выполнения

- [ ] Toggle включает/выключает напоминания мгновенно (optimistic update)
- [ ] Счётчик «через N дней» корректен для всех дат
- [ ] AutoOrder доступен только при Standard+ подписке
- [ ] Добавление новой даты через BottomSheet сохраняется и отображается
