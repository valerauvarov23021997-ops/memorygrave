# Задача 09 — Профиль и подписка

## ProfileScreen.tsx

```ts
const { data: profile } = useQuery({
  queryKey: ['profile'],
  queryFn:  () => userApi.getProfile(),
})
```

### UI

```
Аватар (40pt) + Имя (Playfair 18sp) + Телефон + Иконка редактирования

SubscriptionBanner
  background: linear forest → moss (через LinearGradient из expo-linear-gradient)
  Показывает: тариф + дата следующего списания + кнопка «Управлять»

SectionLabel «Моё»
  → Сохранённые могилы (кол-во)
  → Памятные даты
  → История заказов

SectionLabel «Помощь»
  → Поддержка в Telegram (Linking.openURL('tg://resolve?domain=pamyat_support'))
  → Политика и условия (WebView)

Ссылка «Выйти из аккаунта» (onPress → useAuth().logout())
```

### Редактирование профиля (BottomSheet)
```tsx
// Имя (Input)
// Аватар (expo-image-picker + загрузка на S3)
// Кнопка «Сохранить»
```

## SubscriptionScreen.tsx

```tsx
const { data: sub } = useQuery({
  queryKey: ['subscription'],
  queryFn:  () => userApi.getSubscription(),
})
```

Три карточки тарифов:
```ts
const PLANS = [
  {
    id: 'basic', name: 'Базовый', price: 0, period: 'навсегда бесплатно',
    features: ['Поиск захоронений', 'Разовые заказы и фотоотчёты'],
  },
  {
    id: 'standard', name: 'Стандарт', price: 299, period: 'в месяц · до 3 захоронений',
    featured: true,
    features: ['Всё из базового', 'Напоминания о датах', 'Автозаказ к годовщинам', 'Приоритетные исполнители'],
  },
  {
    id: 'premium', name: 'Премиум', price: 699, period: 'в месяц · без ограничений',
    features: ['Всё из стандарта', 'Персональный менеджер', 'Скидка 15% на услуги'],
  },
]
```

Оплата:
```ts
import * as InAppPurchases from 'expo-in-app-purchases'

// iOS: InAppPurchases.purchaseItemAsync(productId)
// Android: то же самое
// После успешной покупки → POST /subscriptions/activate { receipt }
```

Кнопка «Восстановить покупки» (обязательна для App Store):
```ts
await InAppPurchases.connectAsync()
await InAppPurchases.getPurchaseHistoryAsync()
// → POST /subscriptions/restore
```

## packages/api/src/user.api.ts

```ts
export const userApi = {
  getProfile:     () => client.get<{ data: UserProfile }>('/user/profile'),
  updateProfile:  (body: Partial<UserProfile>) => client.put('/user/profile', body),
  getSubscription: () => client.get<{ data: Subscription }>('/user/subscription'),
  getSaved:       () => client.get<{ data: Grave[] }>('/user/saved-graves'),
  addSaved:       (graveId: string) => client.post('/user/saved-graves', { graveId }),
  removeSaved:    (graveId: string) => client.delete(`/user/saved-graves/${graveId}`),
  deleteAccount:  () => client.delete('/auth/account'),
}
```

## Критерии выполнения

- [ ] Выход из аккаунта удаляет токены и возвращает на PhoneInput
- [ ] Загрузка аватара через expo-image-picker работает
- [ ] IAP (In-App Purchase) подключён для обоих платформ
- [ ] «Восстановить покупки» работает на iOS
- [ ] Удаление аккаунта требует подтверждения (Alert) и удаляет данные
