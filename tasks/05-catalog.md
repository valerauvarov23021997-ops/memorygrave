# Задача 05 — Каталог услуг и оформление заказа

## Зависимости
Задача 04 выполнена.

## Типы

```ts
// packages/api/src/types.ts (добавить)
export interface Service {
  id:          string
  name:        string
  description: string
  category:    'quick' | 'major'  // quick: 1–3 дня, major: 7–30 дней
  basePrice:   number              // минимальная цена в рублях
  photos:      string[]            // примеры выполненных работ
}

export interface OrderDraft {
  graveId:         string
  serviceId:       string
  date:            string          // ISO date
  notes:           string
  isRecurring:     boolean
  recurringPeriod: 'monthly' | 'quarterly' | null
}
```

## CatalogScreen.tsx

Параметры: `{ graveId: string }`

```ts
const { data: services } = useQuery({
  queryKey: ['services'],
  queryFn: () => servicesApi.getAll(),
  staleTime: 5 * 60 * 1000,  // кешировать 5 минут — список меняется редко
})

const quickServices = services?.filter(s => s.category === 'quick') ?? []
const majorServices = services?.filter(s => s.category === 'major') ?? []
```

UI:
- Строка контекста: «[fullName] · [cemeteryName]» (DM Sans 13sp color muted)
- SectionLabel «Быстрые услуги»
- FlatList quickServices с ServiceRow
- SectionLabel «Крупные работы»
- FlatList majorServices с ServiceRow

### ServiceRow.tsx
```tsx
// Row: Icon (sage, 20px) | Name + Description | Price «от N ₽»
// Нажатие → BottomSheet с деталями услуги (фото, что входит, кнопка «Выбрать»)
// «Выбрать» → navigation.navigate('OrderForm', { graveId, serviceId })
```

## OrderFormScreen.tsx

Параметры: `{ graveId: string; serviceId: string }`

### Состояние
```ts
const [selectedDate, setSelectedDate]   = useState<Date>(getMinDate())
const [isRecurring, setIsRecurring]     = useState(false)
const [recurringPeriod, setRecurring…]  = useState<'monthly'|'quarterly'>('monthly')
const [notes, setNotes]                 = useState('')
```

`getMinDate()` — завтра (quick) или через 7 дней (major).

### Выбор даты — горизонтальный скролл
```tsx
// Показывает 14 ближайших доступных дат
// Карточка даты: день недели (caption), число (heading)
// Активная: background forest, текст cream
// Нажатие — setSelectedDate
const dates = Array.from({ length: 14 }, (_, i) => addDays(getMinDate(), i))
```

### Тип заказа
```tsx
// Три чипа: «Разовый» | «Ежемесячно» | «Ежеквартально»
// Активный — background forest, текст cream
// При выборе «Разовый»: isRecurring = false
// При выборе повтора: isRecurring = true, recurringPeriod = ...
```

### Пожелания
```tsx
<Input
  label="Пожелания"
  multiline
  value={notes}
  onChangeText={setNotes}
  maxLength={500}
  placeholder="Необязательно — дополнительные инструкции для исполнителя"
/>
```

### Итого
```tsx
// Для quick: показывает service.basePrice + «₽»
// Для major: «Стоимость уточняется» — финальная цена после замера
<Row>
  <Text>Итого</Text>
  <Text style={typography.displayMd}>
    {service.category === 'quick' ? `${service.basePrice} ₽` : 'Уточняется'}
  </Text>
</Row>
```

### Кнопка
```tsx
<Button
  label="Перейти к оплате"
  onPress={() => nav.navigate('Payment', { draft })}
  fullWidth
/>
// Для major — label «Оставить заявку», flow другой (менеджер позвонит)
```

## packages/api/src/services.api.ts

```ts
export const servicesApi = {
  getAll: () => client.get<{ data: Service[] }>('/services'),
  getById: (id: string) => client.get<{ data: Service }>(`/services/${id}`),
}
```

## Аналитика

```ts
// При выборе услуги:
amplitude.track('order_started', { service_id: serviceId, service_name: service.name })
```

## Критерии выполнения

- [ ] Каталог разбит на две секции (быстрые / крупные)
- [ ] Нажатие на услугу открывает BottomSheet с деталями
- [ ] Выбор даты — горизонтальный скролл с корректными минимальными датами
- [ ] Для крупных работ — другой текст кнопки и flow
- [ ] Переход на PaymentScreen с заполненным OrderDraft
