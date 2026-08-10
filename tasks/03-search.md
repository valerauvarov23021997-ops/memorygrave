# Задача 03 — Поиск захоронений

## Зависимости
Задачи 00, 01, 02 выполнены.

## Файлы

```
apps/client/src/
├── screens/search/
│   ├── SearchScreen.tsx
│   ├── SearchResultCard.tsx
│   └── AddGraveScreen.tsx
├── navigation/MainNavigator.tsx   # Bottom Tabs
packages/api/src/
└── graves.api.ts
packages/store/src/
└── search.store.ts
```

## Типы (packages/api/src/types.ts)

```ts
export interface Grave {
  id:          string
  fullName:    string
  birthDate:   string | null     // ISO-строка или null
  deathDate:   string | null
  cemetery:    Cemetery
  plot:        string | null     // «уч. 14, ряд 3»
  photos:      string[]          // URL фотографий
  biography:   string | null
  status:      'digitized' | 'moderation' | 'not_digitized'
  coordinates: { lat: number; lng: number } | null
}

export interface Cemetery {
  id:   string
  name: string
  city: string
  address: string
}
```

## graves.api.ts

```ts
import client from './client'
import type { Grave } from './types'

export const gravesApi = {
  search: (params: {
    q?: string; city?: string; cemeteryId?: string
    page?: number; limit?: number
  }) => client.get<{ data: Grave[]; meta: { total: number; page: number } }>('/graves/search', { params }),

  getById: (id: string) =>
    client.get<{ data: Grave }>(`/graves/${id}`),

  create: (body: {
    fullName: string; birthDate?: string; deathDate?: string
    cemeteryId: string; plot?: string; photos?: string[]; biography?: string
  }) => client.post<{ data: Grave }>('/graves', body),

  getCemeteries: (cityId?: string) =>
    client.get<{ data: Cemetery[] }>('/cemeteries', { params: { cityId } }),

  getCities: () =>
    client.get<{ data: { id: string; name: string }[] }>('/cities'),
}
```

## SearchScreen.tsx

### Состояние
```ts
const [query, setQuery]           = useState('')
const [cityFilter, setCityFilter] = useState<string | null>(null)
const [cemeteryFilter, ...]       = useState<string | null>(null)
const debouncedQuery              = useDebounce(query, 400)
```

### useDebounce hook (packages/utils/src/useDebounce.ts)
```ts
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debouncedValue
}
```

### TanStack Query запрос
```ts
const { data, isLoading, isFetchingNextPage, fetchNextPage } = useInfiniteQuery({
  queryKey: ['graves', 'search', debouncedQuery, cityFilter, cemeteryFilter],
  queryFn: ({ pageParam = 1 }) =>
    gravesApi.search({ q: debouncedQuery, city: cityFilter, page: pageParam, limit: 20 }),
  enabled: debouncedQuery.length >= 2 || !!cityFilter,
  getNextPageParam: (lastPage) =>
    lastPage.meta.page * 20 < lastPage.meta.total ? lastPage.meta.page + 1 : undefined,
})
```

### UI-структура экрана
```
TopBar (логотип «Память» + колокольчик уведомлений)
SearchBar (белый фон при active, кнопка × для очистки)
FilterChips (Город | Кладбище — горизонтальный ScrollView)
─────────────────────────────────────────────────────
СОСТОЯНИЯ:
  isLoading && !data  →  SkeletonList (5 карточек-скелетонов)
  query < 2 && !filters →  EmptyState (иллюстрация + подсказка)
  data.length === 0   →  NoResults («По запросу ничего не найдено»)
  data.length > 0     →  FlatList<Grave> с onEndReached для пагинации
─────────────────────────────────────────────────────
Карточка «+ Добавить захоронение» (всегда внизу ListFooterComponent)
```

### SearchResultCard.tsx
```tsx
interface SearchResultCardProps {
  grave:    Grave
  onPress: (id: string) => void
}
// Показывает: fullName (Playfair), даты + кладбище (muted), badge статуса
// Нажатие → navigation.navigate('Grave', { graveId: grave.id })
```

### Аналитика
```ts
// При выполнении поиска:
amplitude.track('search_performed', {
  query_length: query.length,
  has_filters: !!(cityFilter || cemeteryFilter),
  results_count: data?.pages[0]?.meta.total ?? 0,
})
```

## AddGraveScreen.tsx

```tsx
// Форма с валидацией через react-hook-form + zod
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'

const schema = z.object({
  fullName:   z.string().min(3, 'Введите полное имя'),
  birthDate:  z.string().optional(),
  deathDate:  z.string().optional(),
  cemeteryId: z.string().min(1, 'Выберите кладбище'),
  plot:       z.string().optional(),
  biography:  z.string().max(1000).optional(),
})
```

Поля формы:
- `fullName` — Input с label «ФИО *»
- `birthDate` / `deathDate` — DatePicker через `@react-native-community/datetimepicker`
- `cemeteryId` — нажатие открывает BottomSheet со списком кладбищ (с поиском)
- `plot` — Input «Участок / Ряд»
- Фото — кнопка выбора через `expo-image-picker`, показывает превью

При сабмите:
1. Если есть фото — загрузить на S3 через `uploadImage()` из utils
2. Вызвать `gravesApi.create()` с URL фото
3. Показать Toast «Отправлено на проверку»
4. Навигация назад

## Тесты

- SearchScreen рендерится без ошибок
- Debounce: запрос не отправляется при < 2 символах
- Запрос отправляется через 400мс после остановки ввода
- При ошибке API показывается сообщение об ошибке
- Нажатие на карточку открывает GraveScreen (mock navigation)

## Критерии выполнения

- [ ] Поиск работает с debounce 400мс
- [ ] Бесконечная пагинация (onEndReached) подгружает следующие страницы
- [ ] Все три состояния (empty, loading, results) отображаются
- [ ] Форма добавления валидируется, ошибки показываются под полями
- [ ] Фото загружается на S3 перед сохранением записи
