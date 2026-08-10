# Задача 10 — Приложение исполнителя (apps/executor)

## Структура навигации

```
AuthNavigator (как у клиента, без онбординга)
MainNavigator (Bottom Tabs)
  ├─ ActiveOrders Tab   → ActiveOrdersScreen → ExecutionScreen → PhotoUploadScreen
  ├─ History Tab        → HistoryScreen
  └─ Profile Tab        → ExecutorProfileScreen
```

## Типы

```ts
// Расширяет packages/api/src/types.ts
export interface ExecutorOrder extends Order {
  reward:         number    // вознаграждение исполнителя в рублях
  executionSteps: string[]  // чек-лист для данной услуги
}
```

## ActiveOrdersScreen.tsx

```ts
const { data: orders, refetch } = useQuery({
  queryKey: ['executor-orders'],
  queryFn:  () => executorApi.getOrders({ status: 'assigned' }),
  refetchInterval: 30_000,  // обновлять каждые 30 сек
})
```

Карточка заказа:
```
Услуга + адрес кладбища
Дата и время
Вознаграждение (крупно, Playfair)
Кнопки: «Принять» (primary) | «Отклонить» (secondary/destructive)
```

Принять → `executorApi.accept(orderId)` → `refetch()` → навигация на ExecutionScreen
Отклонить → Alert с полем причины → `executorApi.reject(orderId, reason)` → `refetch()`

## ExecutionScreen.tsx

Параметры: `{ orderId: string }`

Последовательность шагов (Stepper):
```
Шаг 1: Детали заказа
  - Адрес кладбища, участок, услуга, пожелания клиента
  - Кнопка «Открыть в навигаторе» (Linking → Google Maps / Яндекс)
  - Кнопка «Я на месте» → executorApi.arrive(orderId) → Шаг 2

Шаг 2: Фото ДО (обязательно)
  → PhotoUploadScreen с type='before'
  После загрузки 2+ фото → Шаг 3

Шаг 3: Выполнение работ
  Чек-лист (order.executionSteps) с Toggle для каждого пункта
  Все пункты отмечены → кнопка «Завершить работы» активна → Шаг 4

Шаг 4: Фото ПОСЛЕ (обязательно)
  → PhotoUploadScreen с type='after'
  После загрузки 2+ фото → Шаг 5

Шаг 5: Завершение
  → executorApi.complete(orderId)
  → Клиент получает push
  → Возврат на ActiveOrdersScreen
```

## PhotoUploadScreen.tsx

Параметры: `{ orderId: string; type: 'before' | 'after' }`

```tsx
// Минимум 2 фото для продолжения — кнопка «Продолжить» disabled пока < 2

const [photos, setPhotos] = useState<string[]>([])

async function pickPhoto() {
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,         // сжатие до 80% качества
    allowsEditing: false,
  })
  if (!result.canceled) {
    const uri    = result.assets[0].uri
    const s3Url  = await uploadImage(uri, `orders/${orderId}/${type}`)
    setPhotos(prev => [...prev, s3Url])
  }
}

async function handleSubmit() {
  await executorApi.uploadPhotos(orderId, type, photos)
  navigation.goBack()   // возврат на ExecutionScreen для следующего шага
}
```

## ExecutorProfileScreen.tsx

```ts
const [isOnline, setIsOnline] = useState(false)

async function toggleOnline(value: boolean) {
  await executorApi.setOnline(value)
  setIsOnline(value)
}
```

```
Аватар + Имя + Рейтинг (звёзды)
Toggle «Онлайн / Офлайн» (крупный, заметный — это главное действие)
  При Online: получает новые заказы
  При Offline: новые заказы не приходят

Статистика: всего заказов, сумма за месяц, средний рейтинг
Города и услуги (просмотр, редактирование — отдельный экран)
```

## packages/api/src/executor.api.ts

```ts
export const executorApi = {
  getOrders:    (p?: { status?: string }) => client.get<{data:ExecutorOrder[]}>('/executor/orders', { params: p }),
  accept:       (id: string) => client.post(`/executor/orders/${id}/accept`),
  reject:       (id: string, reason: string) => client.post(`/executor/orders/${id}/reject`, { reason }),
  arrive:       (id: string) => client.post(`/executor/orders/${id}/arrive`),
  uploadPhotos: (id: string, type: 'before'|'after', urls: string[]) =>
    client.post(`/executor/orders/${id}/photos/${type}`, { urls }),
  complete:     (id: string) => client.post(`/executor/orders/${id}/complete`),
  setOnline:    (online: boolean) => client.put('/executor/profile', { isOnline: online }),
}
```

## Критерии выполнения

- [ ] Исполнитель не может завершить заказ без загрузки 2+ фото «до» и «после»
- [ ] Кнопка «Открыть в навигаторе» работает на iOS и Android
- [ ] Чек-лист сохраняет состояние при переключении между шагами
- [ ] Toggle онлайн/офлайн сохраняется и отражается на бэкенде
- [ ] Push приходит клиенту при вызове executorApi.complete()
