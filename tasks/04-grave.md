# Задача 04 — Страница захоронения

## Зависимости
Задача 03 выполнена. Тип `Grave` доступен из `@pamyat/api`.

## GraveScreen.tsx

### Навигационные параметры
```ts
type GraveScreenParams = { graveId: string }
```

### Данные
```ts
const { graveId } = useRoute<RouteProp<...>>().params

const { data: grave, isLoading } = useQuery({
  queryKey: ['grave', graveId],
  queryFn: () => gravesApi.getById(graveId).then(r => r.data),
})

const { data: lastOrders } = useQuery({
  queryKey: ['grave-orders', graveId],
  queryFn: () => ordersApi.getByGrave(graveId, { limit: 3 }),
})

const isSaved = useSavedStore(s => s.savedIds.includes(graveId))
```

### Структура ScrollView (сверху вниз)

**1. Карта (MapView из react-native-maps)**
```tsx
<MapView
  style={{ height: 180 }}
  initialRegion={{
    latitude:      grave.coordinates?.lat ?? 55.75,
    longitude:     grave.coordinates?.lng ?? 37.62,
    latitudeDelta:  0.005,
    longitudeDelta: 0.005,
  }}
  scrollEnabled={false}
  zoomEnabled={false}
  onPress={() => openInMaps(grave)}  // deeplink в Google Maps / Яндекс
>
  {grave.coordinates && (
    <Marker coordinate={grave.coordinates} />
  )}
</MapView>
// Поверх карты — полупрозрачный топбар (TopBar transparent)
// Снизу карты — бейдж «уч. 14, ряд 3 · Новодевичье»
```

**2. Основная информация**
```
padding 16
fullName — Playfair Display 22sp Bold, color forest
Даты жизни — DM Sans 14sp, color muted
Badge статуса (оцифровано/модерация)
```

**3. Биография** (если есть)
```tsx
// Показывает первые 3 строки, кнопка «Читать полностью» раскрывает
<Animated.Text numberOfLines={expanded ? undefined : 3}>
  {grave.biography}
</Animated.Text>
```

**4. Фотогалерея** (если есть фото)
```tsx
<FlatList
  horizontal
  data={grave.photos}
  renderItem={({ item }) => (
    <Pressable onPress={() => openFullscreen(item)}>
      <Image source={{ uri: item }} style={{ width: 80, height: 80, borderRadius: 8 }} />
    </Pressable>
  )}
/>
```

**5. Три кнопки действий (grid 3 колонки)**
```tsx
const actions = [
  { icon: 'camera', label: `${grave.photos.length} фото`, onPress: openGallery },
  { icon: 'heart', label: isSaved ? 'Сохранено' : 'Сохранить',
    onPress: toggleSave, active: isSaved },
  { icon: 'bell', label: 'Напомнить', onPress: openReminders },
]
```

**6. Последние заказы** (если есть)
```tsx
{lastOrders?.slice(0, 1).map(order => (
  <Pressable key={order.id} onPress={() => nav.navigate('OrderStatus', { orderId: order.id })}>
    <Text>{order.serviceName}</Text>
    <Text>{formatDate(order.completedAt)}</Text>
    <StarRating value={order.rating} />
  </Pressable>
))}
```

**7. Кнопка CTA**
```tsx
<Button
  label="Заказать уход"
  onPress={() => nav.navigate('Catalog', { graveId })}
  fullWidth
/>
```

### openInMaps() — утилита
```ts
// packages/utils/src/maps.ts
export function openInMaps(grave: Grave) {
  const { lat, lng } = grave.coordinates ?? {}
  if (!lat || !lng) return
  const label = encodeURIComponent(grave.fullName)
  const url = Platform.select({
    ios:     `maps:?q=${label}&ll=${lat},${lng}`,
    android: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
  })
  Linking.openURL(url!)
}
```

### Сохранение в избранное (saved.store.ts)
```ts
// packages/store/src/saved.store.ts
interface SavedState {
  savedIds:    string[]
  toggleSave:  (graveId: string) => Promise<void>
}

export const useSavedStore = create<SavedState>()(
  persist(
    (set, get) => ({
      savedIds: [],
      toggleSave: async (graveId) => {
        const isSaved = get().savedIds.includes(graveId)
        if (isSaved) {
          await userApi.removeSaved(graveId)
          set(s => ({ savedIds: s.savedIds.filter(id => id !== graveId) }))
        } else {
          await userApi.addSaved(graveId)
          set(s => ({ savedIds: [...s.savedIds, graveId] }))
        }
      },
    }),
    { name: 'saved' }
  )
)
```

### Аналитика
```ts
// При открытии экрана:
amplitude.track('grave_viewed', { grave_id: graveId, source: route.params?.source ?? 'search' })
```

### Состояние загрузки
- Пока `isLoading` — показывать Skeleton для каждой секции (карта-заглушка, текстовые строки)

## Тесты

- Открывается с graveId, делает запрос к API
- Кнопка «Заказать уход» навигирует на CatalogScreen с graveId
- toggleSave вызывает API и обновляет иконку
- «Читать полностью» раскрывает биографию
- При coordinates === null карта не рендерится (или показывается заглушка)

## Критерии выполнения

- [ ] Карта рендерится с маркером на координатах могилы
- [ ] «Открыть в навигаторе» открывает внешнее приложение (Linking)
- [ ] Сохранение в избранное сохраняется между сессиями (persist)
- [ ] Галерея открывает полноэкранный просмотр
- [ ] Skeleton показывается при загрузке
