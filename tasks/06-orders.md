# Задача 06 — Заказы и оплата

## Зависимости
Задача 05 выполнена.

## Типы

```ts
export type OrderStatus =
  | 'pending'     // ожидает исполнителя
  | 'assigned'    // исполнитель назначен
  | 'on_the_way'  // едет
  | 'working'     // на месте, работает
  | 'completed'   // выполнен
  | 'cancelled'   // отменён
  | 'refund'      // возврат

export interface Order {
  id:           string
  grave:        Grave
  service:      Service
  status:       OrderStatus
  scheduledAt:  string
  completedAt:  string | null
  amount:       number
  notes:        string | null
  executor:     Executor | null
  isRecurring:  boolean
  rating:       number | null
}

export interface Executor {
  id:     string
  name:   string
  phone:  string
  rating: number
  totalOrders: number
}
```

## PaymentScreen.tsx

Параметры: `{ draft: OrderDraft }`

### Логика
```ts
// 1. При входе на экран — загрузить сохранённые карты пользователя
const { data: paymentMethods } = useQuery({
  queryKey: ['payment-methods'],
  queryFn: () => paymentsApi.getMethods(),
})

// 2. Первая карта выбирается по умолчанию
const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
useEffect(() => {
  if (paymentMethods?.length) setSelectedMethod(paymentMethods[0])
}, [paymentMethods])

// 3. Оплата
async function handlePay() {
  setLoading(true)
  try {
    // POST /payments/create → получаем confirmationUrl
    const { paymentId, confirmationUrl } = await paymentsApi.create({
      ...draft, methodId: selectedMethod?.id
    })
    // Открываем WebView с confirmationUrl (ЮКасса)
    nav.navigate('PaymentWebView', { paymentId, url: confirmationUrl })
  } catch (e) {
    showToast('Ошибка оплаты. Попробуйте ещё раз.', 'error')
  } finally {
    setLoading(false)
  }
}
```

### UI
```
Баннер безопасности (lock-icon + «Безопасная оплата через ЮКассу», successBg)
─────────────────────────────────────────────
SectionLabel «Способ оплаты»
Сохранённые карты (radio-select)
  Карточка: иконка платёжной системы + «•••• 4242» + срок
  Активная — border sage + галочка
Ссылка «+ Другая карта / СБП / Apple Pay»
  → BottomSheet со списком методов
─────────────────────────────────────────────
SectionLabel «Состав заказа»
Строка: «[serviceName]» — «[amount] ₽»
Строка: «Комиссия сервиса» — «0 ₽»
Divider
Строка «К оплате» — «[amount] ₽» (крупно, Playfair)
─────────────────────────────────────────────
Button primary «Оплатить [amount] ₽» fullWidth
Ссылка «Отменить» (ghost)
```

## PaymentWebViewScreen.tsx

```tsx
import WebView from 'react-native-webview'

// Открывает ЮКасса confirmationUrl
// Отслеживает URL для определения результата:
//   success: URL содержит ?payment=success → навигация на OrderSuccess
//   cancel:  URL содержит ?payment=cancel  → возврат назад
```

## OrdersListScreen.tsx

```ts
const [tab, setTab] = useState<'all' | 'active' | 'done'>('all')

const { data, refetch } = useQuery({
  queryKey: ['orders', tab],
  queryFn: () => ordersApi.getAll({ status: tab === 'active' ? 'active' : tab === 'done' ? 'completed' : undefined }),
})
```

UI:
- Tab-фильтр: «Все» | «Активные» | «Завершённые»
- FlatList с OrderCard
- Pull-to-refresh (onRefresh → refetch)
- Empty state с кнопкой «Найти захоронение»

### OrderCard.tsx
```tsx
// fullName могилы, название услуги, дата, badge статуса, сумма
// Нажатие → OrderStatusScreen

const STATUS_BADGE: Record<OrderStatus, { label: string; variant: BadgeVariant }> = {
  pending:    { label: 'Ожидает исполнителя', variant: 'warning' },
  assigned:   { label: 'Исполнитель назначен', variant: 'success' },
  on_the_way: { label: 'Исполнитель едет',    variant: 'success' },
  working:    { label: 'Работает',             variant: 'info' },
  completed:  { label: 'Выполнен',             variant: 'success' },
  cancelled:  { label: 'Отменён',              variant: 'neutral' },
  refund:     { label: 'Возврат',              variant: 'neutral' },
}
```

## OrderStatusScreen.tsx

Параметры: `{ orderId: string }`

```ts
// Polling статуса каждые 30 секунд пока статус !== completed | cancelled
const { data: order } = useQuery({
  queryKey: ['order', orderId],
  queryFn: () => ordersApi.getById(orderId),
  refetchInterval: order?.status === 'completed' || order?.status === 'cancelled'
    ? false
    : 30_000,
})
```

Timeline:
```tsx
const TIMELINE_STEPS: OrderStatus[] = ['pending', 'assigned', 'on_the_way', 'working', 'completed']

// Для каждого шага:
// - Выполненный: dot sage (заполненный) + line sage
// - Текущий: dot forest с обводкой + bold text
// - Будущий: dot linen с обводкой stone + color light
```

Кнопка отмены:
```tsx
// Показывать только если status === 'pending' || status === 'assigned'
{canCancel && (
  <Button variant="destructive" label="Отменить заказ" onPress={handleCancel} />
)}
```

## packages/api/src/orders.api.ts

```ts
export const ordersApi = {
  create:   (body: OrderDraft) => client.post<{ data: Order }>('/orders', body),
  getAll:   (params?: { status?: string }) => client.get<{ data: Order[] }>('/orders', { params }),
  getById:  (id: string) => client.get<{ data: Order }>(`/orders/${id}`),
  cancel:   (id: string) => client.delete(`/orders/${id}`),
  addReview: (id: string, body: { rating: number; comment?: string }) =>
    client.post(`/orders/${id}/review`, body),
}
```

## Аналитика

```ts
// При успешной оплате:
amplitude.track('order_completed', { order_id, service_id, amount })
// При ошибке оплаты:
amplitude.track('payment_failed', { error_code, method })
```

## Критерии выполнения

- [ ] PaymentScreen показывает сохранённые карты и суммы
- [ ] Оплата через WebView с обработкой success/cancel URL
- [ ] OrdersList обновляется при pull-to-refresh
- [ ] Polling статуса каждые 30 сек для активных заказов
- [ ] Timeline отображает все шаги с корректными цветами
- [ ] Кнопка отмены активна только на ранних статусах
