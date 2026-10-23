# Задача 02 — Авторизация

## Зависимости
Задача 00 и 01 выполнены.

## Файлы для создания

```
apps/client/src/
├── navigation/
│   ├── AuthNavigator.tsx    # Stack для неавторизованных
│   └── RootNavigator.tsx    # Корневой — выбирает Auth или Main
├── screens/auth/
│   ├── OnboardingScreen.tsx
│   ├── PhoneInputScreen.tsx
│   └── SmsCodeScreen.tsx
└── hooks/
    └── useAuth.ts
```

## RootNavigator.tsx

```tsx
// Читает isLoggedIn из useAuthStore
// Если false → AuthNavigator
// Если true  → MainNavigator (реализуется в задаче 03+)
// При первом запуске (флаг в AsyncStorage 'onboarding_seen') → OnboardingScreen
```

## OnboardingScreen.tsx

Три слайда с горизонтальным свайпом через FlatList (pagingEnabled).

```ts
const SLIDES = [
  {
    id: '1',
    icon: '🌿',
    iconBg: colors.successBg,
    title: 'Найдите захоронение близких',
    description: 'Оцифрованный реестр кладбищ — поиск по имени, городу или кладбищу. Карта и страница памяти.',
  },
  {
    id: '2',
    icon: '🧹',
    iconBg: colors.warningBg,
    title: 'Закажите уход в один клик',
    description: 'Уборка, цветы, надгробные плиты, скамейки. Исполнитель назначается автоматически.',
  },
  {
    id: '3',
    icon: '📸',
    iconBg: colors.successBg,
    title: 'Получите фотоотчёт',
    description: 'После каждого визита — фото до и после. Оценивайте работу и будьте уверены в результате.',
  },
]
```

UI-требования:
- Прогресс-бар: 3 сегмента (активный — forest, пройденный — sage, будущий — linen), высота 3pt, margin-bottom 28
- Иконка: 90×90, border-radius 16, по центру
- Заголовок: Playfair Display 22sp Bold, color forest, textAlign center
- Описание: DM Sans 14sp 300, color muted, textAlign center, lineHeight 22
- Точки-индикаторы: активная — forest 14px width, border-radius 4; неактивная — stone 6px round
- Кнопка «Далее»/«Начать»: Button primary fullWidth
- Ссылка «Пропустить» (слайды 1–2) / «Уже есть аккаунт» (слайд 3): Button ghost
- По завершении: сохранить `onboarding_seen = '1'` в AsyncStorage → навигация на PhoneInputScreen

## PhoneInputScreen.tsx

```tsx
// Состояние
const [phone, setPhone] = useState('')
const [loading, setLoading] = useState(false)
const [error, setError] = useState<string | null>(null)

// Валидация: номер считается заполненным при 11 цифрах
const isValid = phone.replace(/\D/g, '').length === 11

// API вызов
async function handleSubmit() {
  setLoading(true)
  try {
    await authApi.sendCode(phone)
    navigation.navigate('SmsCode', { phone })
  } catch (e) {
    setError('Не удалось отправить код. Попробуйте позже.')
  } finally {
    setLoading(false)
  }
}
```

UI-требования:
- Заголовок: Playfair Display 22sp Bold «Вход в аккаунт»
- Подзаголовок: DM Sans 14sp color muted
- Поле телефона: кастомный Input с маской «+7 (___) ___-__-__»
  - Используй `react-native-phone-number-input` или реализуй маску через `onChangeText`
  - Левый элемент: флаг 🇷🇺 + «+7»
  - keyboardType: 'phone-pad'
- Button primary «Получить код», disabled пока phone невалиден, loading при запросе
- Разделитель «или войти через» с горизонтальными линиями
- Кнопки Apple Sign-In и Google Sign-In (заготовки, без реализации OAuth в этой задаче)
- Дисклеймер: DM Sans 11sp color light, ссылки на Условия и Политику

## SmsCodeScreen.tsx

```tsx
// Параметры навигации
type SmsCodeParams = { phone: string }

// Состояние
const [code, setCode] = useState(['', '', '', '', '', ''])
const [timer, setTimer] = useState(60)
const [loading, setLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
const inputRefs = useRef<TextInput[]>([])
```

6 отдельных Input-ячеек:
- При вводе цифры: фокус переходит на следующую ячейку автоматически
- При удалении из пустой ячейки: фокус возвращается на предыдущую
- При заполнении 6-й: автоматически вызывать `handleVerify()`
- Состояния ячейки: default parchment | filled successBg + border sage | error errorBg + border error

Таймер:
- `useEffect` с `setInterval 1000ms`, уменьшает timer до 0
- При timer === 0: показывать кнопку «Отправить повторно»

```tsx
async function handleVerify() {
  const fullCode = code.join('')
  if (fullCode.length !== 6) return
  setLoading(true)
  try {
    const { accessToken, refreshToken, user } = await authApi.verifyCode(phone, fullCode)
    await SecureStore.setItemAsync('accessToken', accessToken)
    await SecureStore.setItemAsync('refreshToken', refreshToken)
    authStore.setAuth(user.id, phone)
    // RootNavigator автоматически переключится на MainNavigator
  } catch (e) {
    setError('Неверный код')
    setCode(['', '', '', '', '', ''])
    inputRefs.current[0]?.focus()
  } finally {
    setLoading(false)
  }
}
```

SMS Autofill:
- iOS: `textContentType="oneTimeCode"` на всех 6 полях
- Android: `expo-sms` для SMS Retriever API (если доступно)

## packages/api/src/auth.api.ts

```ts
import client from './client'

export const authApi = {
  sendCode: (phone: string) =>
    client.post('/auth/send-code', { phone }),

  verifyCode: (phone: string, code: string) =>
    client.post<{ accessToken: string; refreshToken: string; user: { id: string; phone: string } }>(
      '/auth/verify-code', { phone, code }
    ),

  refresh: (refreshToken: string) =>
    client.post<{ accessToken: string; refreshToken: string }>(
      '/auth/refresh', { refreshToken }
    ),

  logout: () => client.post('/auth/logout'),
}
```

## hooks/useAuth.ts

```ts
export function useAuth() {
  const { setAuth, clearAuth } = useAuthStore()

  const logout = async () => {
    try { await authApi.logout() } catch { /* игнорируем */ }
    await SecureStore.deleteItemAsync('accessToken')
    await SecureStore.deleteItemAsync('refreshToken')
    clearAuth()
  }

  return { logout }
}
```

## Тесты

```
apps/client/src/screens/auth/__tests__/
├── PhoneInputScreen.test.tsx
└── SmsCodeScreen.test.tsx
```

Минимальные кейсы:
- PhoneInput: кнопка disabled при пустом поле, активна при валидном номере
- PhoneInput: вызывает `authApi.sendCode` при нажатии, показывает ошибку при неудаче
- SmsCode: фокус переходит на следующую ячейку при вводе цифры
- SmsCode: auto-submit при заполнении 6-й ячейки
- SmsCode: показывает ошибку и сбрасывает поля при неверном коде

## Критерии выполнения

- [ ] Онбординг показывается только при первом запуске
- [ ] Поле телефона маскирует ввод
- [ ] SMS-код: автофокус + автосабмит работают
- [ ] Успешная авторизация сохраняет токены и переключает навигатор
- [ ] Все тесты проходят
- [ ] Нет `any` в TypeScript
