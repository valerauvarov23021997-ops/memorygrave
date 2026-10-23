# Задача 00 — Настройка проекта

## Цель
Создать monorepo с двумя Expo-приложениями и общими пакетами. После выполнения оба приложения запускаются на iOS и Android симуляторах.

## Что создать

### 1. Инициализация monorepo (Turborepo + Yarn Workspaces)
```bash
npx create-turbo@latest pamyat --package-manager yarn
cd pamyat
mkdir -p apps/client apps/executor
mkdir -p packages/ui packages/api packages/store packages/utils
```

### 2. apps/client — зависимости
```json
{
  "name": "@pamyat/client",
  "dependencies": {
    "expo": "~51.0.0",
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/stack": "^6.3.0",
    "@react-navigation/bottom-tabs": "^6.5.0",
    "zustand": "^4.5.0",
    "@tanstack/react-query": "^5.0.0",
    "axios": "^1.7.0",
    "react-native-reanimated": "~3.10.0",
    "react-native-maps": "1.14.0",
    "expo-secure-store": "~13.0.0",
    "expo-image": "~1.12.0",
    "expo-notifications": "~0.28.0",
    "@expo-google-fonts/playfair-display": "*",
    "@expo-google-fonts/dm-sans": "*",
    "@sentry/react-native": "~5.22.0",
    "@amplitude/analytics-react-native": "^1.4.0",
    "@pamyat/ui": "*",
    "@pamyat/api": "*",
    "@pamyat/store": "*",
    "@pamyat/utils": "*"
  }
}
```

### 3. packages/ui/src/tokens.ts — токены дизайн-системы
Создай файл с экспортом `colors`, `typography`, `spacing`, `radii`.
Значения цветов — строго из CLAUDE.md.
```ts
export const colors = {
  forest: '#1C3318', moss: '#2E5028', sage: '#5A8A52',
  // ... все токены из CLAUDE.md
}
export const typography = {
  displayLg: { fontFamily: 'PlayfairDisplay_400Regular', fontSize: 34, lineHeight: 40 },
  displayMd: { fontFamily: 'PlayfairDisplay_500Medium',  fontSize: 22, lineHeight: 28 },
  headingLg: { fontFamily: 'PlayfairDisplay_500Medium',  fontSize: 18, lineHeight: 24 },
  bodyLg:    { fontFamily: 'DMSans_400Regular',          fontSize: 16, lineHeight: 24 },
  bodyMd:    { fontFamily: 'DMSans_400Regular',          fontSize: 14, lineHeight: 22 },
  bodySm:    { fontFamily: 'DMSans_300Light',            fontSize: 13, lineHeight: 20 },
  caption:   { fontFamily: 'DMSans_400Regular',          fontSize: 11, lineHeight: 16 },
  label:     { fontFamily: 'DMSans_500Medium',           fontSize: 13, lineHeight: 18 },
}
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 }
export const radii   = { sm: 6, md: 8, lg: 10, xl: 16, full: 999 }
```

### 4. packages/api/src/client.ts — Axios с interceptors
```ts
import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

const client = axios.create({
  baseURL: process.env.API_BASE_URL ?? 'https://api.pamyat.app/v1',
  timeout: 10_000,
})

client.interceptors.request.use(async config => {
  const token = await SecureStore.getItemAsync('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// При 401 — обновить токен через POST /auth/refresh и повторить запрос
client.interceptors.response.use(
  res => res.data,
  async err => {
    if (err.response?.status === 401) {
      const refresh = await SecureStore.getItemAsync('refreshToken')
      if (refresh) {
        const { data } = await axios.post('/auth/refresh', { refreshToken: refresh })
        await SecureStore.setItemAsync('accessToken', data.data.accessToken)
        return client.request(err.config)
      }
    }
    return Promise.reject(err)
  }
)
export default client
```

### 5. packages/store/src/auth.store.ts
```ts
import { create } from 'zustand'

interface AuthState {
  userId: string | null
  phone:  string | null
  isLoggedIn: boolean
  setAuth:  (userId: string, phone: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(set => ({
  userId: null, phone: null, isLoggedIn: false,
  setAuth:  (userId, phone) => set({ userId, phone, isLoggedIn: true }),
  clearAuth: () => set({ userId: null, phone: null, isLoggedIn: false }),
}))
```

### 6. apps/client/app.config.ts
```ts
export default {
  name: 'Память', slug: 'pamyat-client', version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  splash: { backgroundColor: '#1C3318' },
  ios: {
    bundleIdentifier: 'app.pamyat.client',
    supportsTablet: false,
    infoPlist: {
      NSLocationWhenInUseUsageDescription: 'Для отображения кладбища на карте',
      NSCameraUsageDescription: 'Для загрузки фотографий',
      NSPhotoLibraryUsageDescription: 'Для выбора фото из галереи',
    },
  },
  android: { package: 'app.pamyat.client' },
  plugins: [
    'expo-router', 'expo-secure-store',
    ['expo-notifications', { icon: './assets/notification-icon.png' }],
    ['react-native-maps', { googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY }],
  ],
}
```

### 7. Конфиг качества кода
- `.eslintrc.json` с `universe/native` + правило `no-explicit-any: error`
- `tsconfig.json` с `strict: true`
- `jest.config.js` с `preset: jest-expo`

## Критерии выполнения

- [ ] `yarn install` без ошибок
- [ ] `yarn workspace @pamyat/client start` запускает Metro
- [ ] `tsc --noEmit` — без ошибок в любом пакете
- [ ] `eslint . --ext .ts,.tsx` — без ошибок
- [ ] Токены из `@pamyat/ui` импортируются в обоих приложениях

## Не делать
- Не использовать `react-native-cli` — только Expo
- Не трогать нативные папки `android/` и `ios/` напрямую

---

## Дополнение · Мок-режим (важно для разработки без бэкенда)

Пока бэкенд не готов, весь UI разрабатывается на мок-данных.

### packages/api/src/mocks/
Создай фикстуры для основных сущностей:
```
packages/api/src/mocks/
├── graves.mock.ts       # 10–15 захоронений с реалистичными данными
├── services.mock.ts     # каталог услуг (уборка, цветы, плиты, скамейки, ограды)
├── orders.mock.ts       # 5–6 заказов в разных статусах
├── reminders.mock.ts    # памятные даты
└── user.mock.ts         # профиль, подписка, сохранённые могилы
```

### packages/api/src/client.ts — переключатель
```ts
const USE_MOCKS = process.env.USE_MOCKS === 'true'

// Если USE_MOCKS — каждый api-метод возвращает Promise.resolve(фикстура)
// с искусственной задержкой 300–600мс (имитация сети).
// Иначе — реальный axios-запрос.
```

Реалистичные данные (не Lorem Ipsum): русские ФИО, реальные названия кладбищ
(Новодевичье, Востряковское, Хованское, Троекуровское), суммы в рублях.

### Критерий
- [ ] При `USE_MOCKS=true` приложение работает полностью без бэкенда
- [ ] Все экраны получают данные из фикстур
