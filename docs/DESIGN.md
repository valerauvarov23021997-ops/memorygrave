# Память — Дизайн-система · Claude Code Agent

> Этот файл — единственный источник правды для агента,
> реализующего UI «Память» на React Native.
> Читай полностью перед написением первой строки кода.

---

## 0. Контекст и цель

Приложение «Память» — сервис ухода за захоронениями.
**Концепция:** Warm Minimal. Тёплые кремово-зелёные тона.
Транслирует: доверие, теплоту, профессионализм — не холодный сервис.
**Аудитория:** 30–65 лет. Простой, знакомый интерфейс.

Агент реализует:
1. `packages/ui` — полную дизайн-систему (токены + компоненты)
2. Все экраны клиентского приложения в соответствии с этим файлом

---

## 1. ЦВЕТА — использовать ТОЛЬКО эти токены

```ts
// packages/ui/src/tokens/colors.ts
export const colors = {
  // Основные
  forest:    '#1C3318',  // Primary: CTA-кнопки, активные иконки, заголовки
  moss:      '#2E5028',  // Secondary: hover, фоны заголовков секций
  sage:      '#5A8A52',  // Accent: иконки, бейджи, переключатели, активные чипы
  sageL:     '#8EBD86',  // Вторичный акцент, текст на тёмном фоне
  sageXL:    '#C4DEC0',  // Бледный: фон success-карточек, аватары
  cream:     '#FAF7F2',  // Основной фон всех экранов
  parchment: '#F0EBE0',  // Поля ввода, карточки, вторичные поверхности
  linen:     '#EDE7D9',  // Разделители, рамки карточек, фон чипов
  stone:     '#C8BEA8',  // Плейсхолдеры, неактивные иконки
  gold:      '#B8935A',  // ТОЛЬКО звёзды рейтинга и премиум-акценты
  ink:       '#1A1A14',  // Основной текст
  muted:     '#6B6B5E',  // Вторичный текст, описания, подписи
  light:     '#9A9A8E',  // Третичный: даты, метаданные, плейсхолдеры
  // Семантические
  successBg: '#EAF3DE',  // Фон: выполнен, онбординг-слайд 3
  success:   '#27500A',  // Текст/иконки на success-фоне
  warningBg: '#FFF8E8',  // Фон: предупреждения, онбординг-слайд 2
  warning:   '#854F0B',  // Текст на warning-фоне
  errorBg:   '#FCEBEB',  // Фон: ошибки SMS, оплаты, форм
  error:     '#9B1C1C',  // Текст ошибки
  infoBg:    '#E6F1FB',  // Информационные блоки, бейдж «Оцифровано»
  info:      '#185FA5',  // Текст на info-фоне
  white:     '#FFFFFF',
} as const

export type ColorToken = keyof typeof colors
```

**Запрещено:** хардкод HEX в компонентах. Только `colors.forest`, не `'#1C3318'`.

---

## 2. ТИПОГРАФИКА

```ts
// packages/ui/src/tokens/typography.ts
// Шрифты: Playfair Display + DM Sans
// Установка: @expo-google-fonts/playfair-display + @expo-google-fonts/dm-sans

export const typography = {
  // Playfair Display — ВСЕ заголовки, имена людей
  displayLg:   { fontFamily: 'PlayfairDisplay_400Regular', fontSize: 34, lineHeight: 42 },
  displayMd:   { fontFamily: 'PlayfairDisplay_500Medium',  fontSize: 22, lineHeight: 28 },
  headingLg:   { fontFamily: 'PlayfairDisplay_500Medium',  fontSize: 18, lineHeight: 24 },
  priceDisplay:{ fontFamily: 'PlayfairDisplay_300Light',   fontSize: 28, lineHeight: 34 },

  // DM Sans — весь остальной текст
  headingMd:   { fontFamily: 'DMSans_500Medium',  fontSize: 15, lineHeight: 22 },
  bodyLg:      { fontFamily: 'DMSans_400Regular', fontSize: 16, lineHeight: 26 },
  bodyMd:      { fontFamily: 'DMSans_400Regular', fontSize: 14, lineHeight: 22 },
  bodySm:      { fontFamily: 'DMSans_300Light',   fontSize: 13, lineHeight: 20 },
  caption:     { fontFamily: 'DMSans_400Regular', fontSize: 11, lineHeight: 16 },
  micro:       { fontFamily: 'DMSans_300Light',   fontSize: 10, lineHeight: 14 },
  // Для кнопок и лейблов
  buttonLabel: { fontFamily: 'DMSans_500Medium',  fontSize: 13, lineHeight: 18,
                 letterSpacing: 1.0, textTransform: 'uppercase' as const },
  sectionLabel:{ fontFamily: 'DMSans_300Light',   fontSize: 11, lineHeight: 16,
                 letterSpacing: 1.6, textTransform: 'uppercase' as const },
} as const
```

**Правила применения:**
- `displayLg/displayMd/headingLg` — Playfair. Для имён, заголовков экранов, цен.
- Имена людей (ФИО усопших) — **всегда** Playfair, никогда DM Sans.
- `sectionLabel` — для всех SECTION LABEL (ФОТО ДО, БЫСТРЫЕ УСЛУГИ и т.д.).
- Никаких `fontWeight: '700'` или выше — выглядит грубо для этой ниши.
- `lineHeight: 1.6` для биографий. `lineHeight: 1` для кнопок и чипов.

---

## 3. ОТСТУПЫ И СЕТКА

```ts
// packages/ui/src/tokens/spacing.ts
export const spacing = {
  xs:  4,   // между inline-элементами
  sm:  8,   // gap внутри секции
  md:  12,  // padding компактной карточки
  lg:  16,  // горизонтальный отступ экрана (от края до контента)
  xl:  24,  // gap между секциями
  xxl: 32,
} as const

export const radii = {
  sm:   6,
  md:   8,   // поля ввода, карточки
  lg:   10,  // карточки по умолчанию
  xl:   16,  // BottomSheet
  full: 999, // круглые (badge, avatar)
} as const

// Минимальный touch target для ВСЕХ нажимаемых элементов
export const MIN_TOUCH_TARGET = 44
```

**SafeArea и StatusBar:**
```ts
// Использовать react-native-safe-area-context везде
// StatusBar iOS: 59px (Dynamic Island) / 44px (notch)
// SafeArea bottom iOS: 34px (Home Indicator)
// StatusBar Android: 24px
// Bottom Tab: 56pt iOS / 60pt Android (ВКЛЮЧАЯ SafeArea)
// Контент экрана начинается ПОСЛЕ StatusBar, заканчивается ДО SafeArea
```

---

## 4. ИКОНКИ

```ts
// Библиотека: Phosphor Icons (outline) через @expo/vector-icons
// НЕ смешивать с Feather — только одна библиотека
// Stroke-width: 1.5px

export const iconSizes = {
  inline: 20,  // в строках, карточках
  nav:    22,  // Bottom Tab
  deco:   28,  // декоративные в хедерах
}

// Цвет по умолчанию: colors.sage
// Активное состояние: colors.forest
// Нейтральные/неактивные: colors.stone
```

**Маппинг иконок:**
```ts
export const icons = {
  // Bottom Tab
  search:      'MagnifyingGlass',
  saved:       'Heart',
  orders:      'ShoppingBag',
  profile:     'User',
  // Услуги
  cleaning:    'Broom',
  flowers:     'Flower',
  candles:     'Flame',
  headstone:   'Square',
  bench:       'Armchair',
  fence:       'Fence',
  // Действия
  mapPin:      'MapPin',
  camera:      'Camera',
  checkCircle: 'CheckCircle',
  bell:        'Bell',
  lock:        'Lock',
  share:       'Upload',
  edit:        'PencilSimple',
  support:     'ChatCircleText',
  settings:    'Gear',
  cake:        'Cake',
  candle:      'Candle',
  back:        'CaretLeft',
  close:       'X',
  plus:        'Plus',
  chevronRight:'CaretRight',
} as const
```

---

## 5. КОМПОНЕНТЫ

### 5.1 Button

```tsx
// packages/ui/src/components/Button.tsx

type Variant = 'primary' | 'secondary' | 'destructive' | 'ghost'

interface ButtonProps {
  label:      string
  onPress:    () => void
  variant?:   Variant   // default: 'primary'
  loading?:   boolean
  disabled?:  boolean
  fullWidth?: boolean
}

// СТИЛИ (StyleSheet.create — не inline):
// primary:     bg forest, text cream, radius 8, height 52, paddingH 24
// secondary:   bg transparent, border 1px forest, text forest
// destructive: bg transparent, border 1px error, text error
// ghost:       bg none, text muted, underline
//
// disabled: opacity 0.4 — НЕ менять цвет на серый
// loading:  ActivityIndicator цвет cream(primary) / forest(others), текст скрыт
//
// Анимация tap: Reanimated withSpring scale 0.96 → 1.0
// Duration: 80ms ease-out
```

### 5.2 Input

```tsx
// packages/ui/src/components/Input.tsx

interface InputProps {
  label?:          string
  value:           string
  onChangeText:    (text: string) => void
  placeholder?:    string
  error?:          string        // красный лейбл снизу 11sp color.error
  keyboardType?:   KeyboardTypeOptions
  secureTextEntry?: boolean
  maxLength?:      number
  multiline?:      boolean
  rightElement?:   React.ReactNode
  editable?:       boolean
}

// СОСТОЯНИЯ (auto по focus/filled/error):
// Default: bg parchment, border 1px linen, radius 8, height 52, paddingH 12
// Active:  bg white, border 1.5px sage
// Filled:  bg white, border 1px linen
// Error:   bg white, border 1.5px error → + errorText под полем (11sp error)
// Multiline: minHeight 80, высота авто
//
// Label: DM Sans 13sp 500, color forest, marginBottom 4
// Placeholder: DM Sans 14sp 300, color light
// Value: DM Sans 14sp 400, color ink
```

### 5.3 Card

```tsx
// packages/ui/src/components/Card.tsx

type CardVariant = 'default' | 'surface' | 'featured' | 'success' | 'warning'

interface CardProps {
  children:  React.ReactNode
  variant?:  CardVariant   // default: 'default'
  padding?:  'sm'|'md'|'lg'  // 8|12|16 — default: 'md'
  onPress?:  () => void
}

// default:     bg white,      border 0.5px linen,   radius 10, NO shadow
// surface:     bg parchment,  no border
// featured:    bg forest,     border forest  (тариф «Популярный»)
// success:     bg successBg,  border 0.5px sageL
// warning:     bg warningBg,  border 0.5px '#D4A060'
```

### 5.4 TopBar

```tsx
// packages/ui/src/components/TopBar.tsx

interface TopBarProps {
  title?:         string
  onBack?:        () => void     // показывает кнопку «‹» если задан
  rightElement?:  React.ReactNode
  transparent?:   boolean        // поверх карты: blur + полупрозрачный
}

// Default: bg cream, border-bottom 0.5px linen, height 52pt (+ StatusBar)
// Transparent: bg rgba(250,247,242,0.85), blur 10px (expo-blur), no border
// Заголовок: Playfair Display 18sp 500, color forest, centered
// Кнопка назад: иконка CaretLeft, color light, touch area 44×44pt
```

### 5.5 Badge

```tsx
type BadgeVariant = 'success'|'warning'|'info'|'neutral'|'error'

// Цвета:
// success: bg successBg, text success
// warning: bg warningBg, text warning
// info:    bg infoBg,    text info
// neutral: bg parchment, text light
// error:   bg errorBg,   text error
//
// Font: DM Sans 11sp 500 (БЕЗ uppercase)
// radius: 10, padding: 2px 8px
```

### 5.6 SectionLabel

```tsx
// DM Sans 11sp 300, uppercase, letterSpacing 1.6, color light
// marginBottom 8
// Пример использования: <SectionLabel>Фото до</SectionLabel>
```

### 5.7 Divider

```tsx
// height: 0.5, bg linen, marginVertical: 8
```

### 5.8 Avatar

```tsx
interface AvatarProps { name: string; size?: number; imageUri?: string }
// Без imageUri: инициалы (2 буквы), bg sageXL, color forest, DM Sans 14sp 500
// С imageUri: expo-image с объектным fit
// border-radius: size/2 (круг)
// default size: 40
```

### 5.9 Toggle

```tsx
// Нативный Switch с кастомными цветами:
// trackColorTrue: sage, trackColorFalse: stone, thumbColor: white
// Анимация: spring 200ms
```

### 5.10 StarRating

```tsx
interface StarRatingProps {
  value:     number    // 0–5
  onChange?: (v: number) => void  // readonly если не задан
  size?:     number    // default 24
}
// Заполненная: color gold  (#B8935A)
// Пустая:      color stone (#C8BEA8)
// Анимация при tap: Reanimated scale 1.3 → 1.0, 150ms spring
```

### 5.11 Skeleton

```tsx
interface SkeletonProps { width: number|string; height: number; radius?: number }
// shimmer: expo-linear-gradient
// Цвет: parchment → linen → parchment, цикл 1.5s infinite
// Использовать ВМЕСТО спиннеров
```

### 5.12 BottomSheet

```tsx
// bg cream, border-radius 16px (только top), handle-bar 36×4px stone centered
// Закрывается: swipe-down | tap на overlay
// Использовать: @gorhom/bottom-sheet
// Анимация открытия: 350ms ease-out
```

### 5.13 Toast (утилита)

```tsx
// bg ink opacity 0.9, text white 13sp, radius 10, padding 12×16
// Позиция: bottom + 12px от SafeArea
// Auto-dismiss: 3 сек
// showToast(message, type?: 'success'|'error'|'info')
```

---

## 6. АНИМАЦИИ

```ts
// Использовать ТОЛЬКО react-native-reanimated v3
// НЕ использовать Animated из react-native core

// Переходы между экранами:
// push (вперёд):    slide left  (translateX)
// pop  (назад):     slide right
// tab switch:       fade
// BottomSheet:      slide up, 350ms ease-out
// Onboarding slides: horizontal swipe, pagingEnabled FlatList

// Micro-анимации:
const animations = {
  buttonTap:     { scale: 0.96, duration: 80, easing: 'easeOut' },
  starSelect:    { scale: [1, 1.3, 1], duration: 150, type: 'spring' },
  toggleKnob:    { duration: 200, type: 'spring' },
  skeletonShimmer: { duration: 1500, loop: true },
  successCheck:  { drawPath: true, duration: 400, easing: 'easeInOut' },
  toastSlideIn:  { translateY: 20, opacity: 0, duration: 250, easing: 'easeOut' },
  cardAppear:    { translateY: 8, opacity: 0, duration: 300, stagger: 50 },
}

// Timing functions:
// Ease Out — входящие элементы
// Ease In  — выходящие элементы
// Spring   — физические (toggle, звёзды, кнопки)
// Стандарт: 250–300ms. Детали: 150ms. BottomSheet: 350ms.
```

---

## 7. ЭКРАНЫ — полный список с требованиями

### Правила для ВСЕХ экранов:
- Фон: `colors.cream` (`#FAF7F2`)
- Горизонтальный padding: 16pt от края
- Использовать `useSafeAreaInsets()` для отступов
- Skeleton при загрузке — вместо спиннера
- Реалистичный контент (не Lorem Ipsum): русские имена, кладбища, суммы

---

### Экран 1–3: OnboardingScreen (3 слайда)

```tsx
// FlatList horizontal с pagingEnabled
// Свайп или кнопка «Далее»

// Каждый слайд:
interface Slide {
  icon:    string   // emoji
  iconBg:  string   // цвет фона иллюстрации
  title:   string   // Playfair displayMd, forest, centered
  desc:    string   // DM Sans bodyMd 300, muted, centered, lineHeight 1.5
}

const slides: Slide[] = [
  { icon: '🌿', iconBg: colors.successBg,
    title: 'Найдите захоронение близких',
    desc: 'Оцифрованный реестр кладбищ — поиск по имени, городу или кладбищу. Карта и страница памяти.' },
  { icon: '🧹', iconBg: colors.warningBg,
    title: 'Закажите уход в один клик',
    desc: 'Уборка, цветы, надгробные плиты, скамейки. Исполнитель назначается автоматически и едет к могиле.' },
  { icon: '📸', iconBg: colors.successBg,
    title: 'Получите фотоотчёт',
    desc: 'После каждого визита — фото до и после. Оценивайте работу исполнителя и будьте уверены в результате.' },
]

// Иллюстрация: 90×90, border-radius 16
// Прогресс-бар: 3 сегмента height 3pt (done=sage, active=forest, future=linen)
// Точки: active=forest 14px border-radius 4 | inactive=stone 6px round
// Кнопки слайда 1–2: «Далее» (primary) + «Пропустить» (ghost)
// Кнопки слайда 3:   «Начать» (primary) + «Уже есть аккаунт» (ghost)
// После слайда 3: сохранить 'onboarding_seen' в AsyncStorage
```

---

### Экран 4: PhoneInputScreen

```tsx
// Заголовок: «Вход в аккаунт» — Playfair displayMd
// Подзаголовок: DM Sans bodyMd muted
// Поле телефона: маска «+7 (___) ___-__-__»
//   - leftElement: флаг 🇷🇺 + «+7»
//   - rightElement: мигающий курсор (анимация opacity)
//   - keyboardType: 'phone-pad'
//   - Кнопка активна при 11 цифрах
// Разделитель: «или войти через» между горизонтальными линиями (linen)
// Кнопки соцсетей: border 1px linen, radius 8, высота 44pt
//   - Apple: тёмный фон (требование Apple HIG)
//   - Google: белый фон, «G» текст
// Дисклеймер: DM Sans 11sp light, ссылки на Условия и Политику

// Состояния:
// Default:  кнопка «Получить код» disabled (opacity 0.4)
// Active:   поле заполнено → кнопка активна
// Loading:  кнопка в loading state
// Error:    Toast «Не удалось отправить код»
```

---

### Экран 5: SmsCodeScreen

```tsx
// Заголовок: «Введите код» — Playfair displayMd
// Подзаголовок: «Отправили SMS на [phone]» — DM Sans bodyMd muted

// 6 ячеек ввода (grid 6 колонок, gap 4):
// Ячейка: width=(экран-32-gap*5)/6, height 48, radius 8
// Default: bg parchment, border 1px linen
// Active:  bg white, border 1.5px sage
// Filled:  bg successBg, border sage, text forest 18sp 700
// Error:   bg errorBg, border error

// Таймер: DM Sans bodyMd, «Повторить через 0:47»
// После 0: кнопка «Отправить повторно» (ghost)
// Ссылка «← Изменить номер»

// Инфо-блок (success Card):
// «На iOS 12+ код вставится автоматически»
// textContentType="oneTimeCode" на всех 6 полях
```

---

### Экран 6: SearchScreen (пустой)

```tsx
// TopBar: логотип «Память» (Playfair displayMd forest) + bell icon справа
// SearchBar: bg parchment → bg white при focus, radius 8, icon search sage
// Фильтр-чипы (горизонтальный ScrollView, gap 8):
//   Город | Кладбище | Год
//   Chip default: bg parchment, border 0.5px linen
//   Chip active:  bg forest, text cream (при выборе фильтра)

// Empty State (вертикально по центру):
//   Иконка 48pt, opacity 0.4
//   «Найдите захоронение» — Playfair headingLg
//   Подсказка — DM Sans bodySm muted, max-width 160

// Карточка «+ Добавить захоронение» (всегда видна внизу):
//   border 1px dashed stone, radius 8, text sage 13sp 500

// Bottom Tab: вкладка «Поиск» активна
```

---

### Экран 7: SearchScreen (результаты)

```tsx
// SearchBar: bg white, border 0.5px sage, кнопка × для очистки
// Активный фильтр: chip bg forest + × для сброса
// «Найдено: N результатов» — DM Sans caption muted

// SearchResultCard (на нажатие → GraveScreen):
//   fullName: Playfair headingMd forest
//   «[год]–[год] · [кладбище], уч. [уч.]» — DM Sans bodySm muted
//   Badge статуса (right-aligned):
//     success  = «Оцифровано»
//     warning  = «На модерации»
//     neutral  = «Не оцифровано»

// Skeleton (при загрузке): 5 карточек shimmer
// No Results: «Ничего не найдено» + кнопка «+ Добавить захоронение»
```

---

### Экран 8: AddGraveScreen

```tsx
// Info-баннер (success Card вверху):
//   «После отправки захоронение появится в реестре в течение 1–2 рабочих дней»

// Форма (react-hook-form):
//   ФИО * — Input, label «ФИО», placeholder «Иванов Иван Петрович»
//   Дата рождения | Дата смерти — DatePicker (grid 2 колонки)
//   Кладбище * — нажатие → BottomSheet со списком + поиском
//   Участок / Ряд — Input, placeholder «уч. 14, ряд 3»
//   Биография — Input multiline, maxLength 1000
//   Фото — зона загрузки (border 1px dashed stone, иконка camera)
//     После выбора: превью grid 2 колонки

// * обязательные поля — красная звёздочка рядом с label
// Кнопка «Отправить на проверку» — primary fullWidth внизу
```

---

### Экран 9: GraveScreen

```tsx
// TopBar: transparent (поверх карты), кнопка назад + share icon
// Карта (MapView): height 180, scrollEnabled=false, маркер на координатах
//   Поверх карты снизу: badge «уч. 14, ряд 3 · [Кладбище]»
//   bg ink opacity 0.7, text white 11sp, radius 4

// Контент (padding 16):
//   fullName: Playfair displayMd forest (+ Badge статуса справа)
//   даты: «02.05.1941 — 14.11.2003 · 62 года» — DM Sans bodySm muted
//   Биография: bodyMd ink, numberOfLines=3, «Читать полностью» раскрывает

//   Фотогалерея (если есть):
//     FlatList horizontal, gap 8
//     Фото: 80×80, radius 8, нажатие → fullscreen

//   Grid 3 кнопки действий:
//     Карточка (surface Card, text center):
//       📷 Фото (N штук)  |  ♡ Сохранить (active=featured Card)  |  🔔 Напомнить
//     touch area 44×44pt минимум

//   Divider

//   «Последний заказ» (если есть):
//     surface Card: serviceName + дата + StarRating readonly
//     Нажатие → PhotoReportScreen

//   Button primary fullWidth «Заказать уход» (липкий внизу)

// Состояния:
// Default: сердце outline
// Saved:   сердце filled (sage), карточка «Сохранить» → featured Card
// No history: блок «Последний заказ» скрыт
// Loading: Skeleton для каждой секции
```

---

### Экран 10: OrderScreen (каталог)

```tsx
// Строка контекста: «[fullName] · [cemeteryName]» — DM Sans bodySm muted

// SectionLabel «Быстрые услуги»
// FlatList — ServiceRow:
//   icon (sage, 20px) | Name (headingMd) + desc (bodySm muted) | «от N ₽» (headingMd forest)
//   Нажатие → BottomSheet с деталями:
//     Фото-примеры, описание, точная цена, Button «Выбрать»

// Divider + SectionLabel «Крупные работы»
// Те же ServiceRow

// Услуги и иконки:
const services = [
  { name: 'Уборка могилы',     icon: 'Broom',    price: 'от 800 ₽',     cat: 'quick' },
  { name: 'Цветы и венки',     icon: 'Flower',   price: 'от 500 ₽',     cat: 'quick' },
  { name: 'Свечи и лампадки',  icon: 'Flame',    price: 'от 300 ₽',     cat: 'quick' },
  { name: 'Надгробная плита',  icon: 'Square',   price: 'от 15 000 ₽',  cat: 'major' },
  { name: 'Скамейка и стол',   icon: 'Armchair', price: 'от 8 000 ₽',   cat: 'major' },
  { name: 'Ограда',            icon: 'Fence',    price: 'от 6 000 ₽',   cat: 'major' },
]
```

---

### Экран 11: OrderFormScreen

```tsx
// Card (surface) с выбранной услугой: icon + name + кладбище

// SectionLabel «Дата выполнения»
// Горизонтальный ScrollView дат (14 дней):
//   Карточка даты: height 56, radius 8
//   Default: bg parchment, text muted
//   Active:  bg forest, text cream
//   Контент: день недели (caption) + число (headingMd)

// SectionLabel «Повтор»
// 3 чипа: «Разовый» | «Ежемесячно» | «Ежеквартально»
//   Active chip: bg forest, text cream

// SectionLabel «Пожелания»
// Input multiline, placeholder «Необязательно...», maxLength 500

// Divider
// Row «Итого» — label bodyMd muted | price Playfair priceDisplay forest
//   Для major: «Стоимость уточняется» вместо суммы

// Button primary fullWidth «Перейти к оплате»
//   Для major: «Оставить заявку»
```

---

### Экран 12: PaymentScreen

```tsx
// success Card (вверху):
//   lock icon (sage) + «Безопасная оплата через ЮКассу» — bodySm success

// SectionLabel «Способ оплаты»
// Сохранённая карта (Card default, border sage при выборе):
//   иконка платёжной системы | «•••• •••• •••• 4242» headingMd | срок bodySm muted
//   Галочка CheckCircle sage справа
// Ссылка «+ Другая карта / СБП / Apple Pay» — bodySm sage

// Divider

// SectionLabel «Состав заказа»
// Row: serviceName (bodyMd muted) | price (bodyMd ink)
// Row: «Комиссия сервиса» (bodyMd muted) | «0 ₽» (bodyMd ink)
// Divider
// Row: «К оплате» (headingMd forest bold) | price (Playfair priceDisplay forest)

// Button primary fullWidth «Оплатить N ₽» — ВКЛЮЧАЕТ сумму в label
// Ссылка «Отменить» (ghost, centered)

// Состояния:
// Card saved:    карта подставлена автоматически
// No saved card: форма ввода новой карты
// Loading:       кнопка в loading state
// Error:         Toast «Ошибка оплаты. Попробуйте ещё раз.»
```

---

### Экран 13: OrdersListScreen

```tsx
// Топ-бар: «Мои заказы» (Playfair) + filter icon

// 3 таба-чипа: «Все» | «Активные» | «Завершённые»
//   горизонтальный ScrollView, sticky при скролле

// OrderCard (Card default, нажатие → OrderStatusScreen):
//   Row: serviceName (headingMd) + Badge статуса | дата (bodySm muted)
//   Row: cemeteryName (bodySm light) | amount (headingMd forest)

// Бейджи статусов:
const statusBadges = {
  pending:    { label: 'Ожидает исполнителя', variant: 'warning'  },
  assigned:   { label: 'Исполнитель назначен', variant: 'success'  },
  on_the_way: { label: 'Исполнитель едет',     variant: 'success'  },
  working:    { label: 'Работает',              variant: 'info'     },
  completed:  { label: 'Выполнен',              variant: 'success'  },
  cancelled:  { label: 'Отменён',               variant: 'neutral'  },
  refund:     { label: 'Возврат',               variant: 'neutral'  },
}

// Pull-to-refresh
// Empty State: «Заказов пока нет» + Button «Найти захоронение»
```

---

### Экран 14: OrderStatusScreen

```tsx
// Card (surface): serviceName + Badge статуса | fullName могилы + дата + сумма

// Card (success) — после назначения исполнителя:
//   Avatar (28pt) | имя исполнителя (headingMd) + «N заказов» (bodySm) | StarRating readonly

// SectionLabel «Статус»
// Timeline (5 шагов вертикально):
//   Каждый шаг: dot (10px) + line (1px) + label + time
//
//   Стили dot:
//     completed: bg sage (filled)
//     current:   bg forest, border 2px sageL (пульсирует — Reanimated)
//     future:    bg linen, border 1px stone
//
//   Стили label:
//     completed: bodySm muted
//     current:   bodySm forest 500 + time=«сейчас» (sage)
//     future:    bodySm light
//
// Шаги: Оплачен | Назначен | Едет | На месте | Выполнен

// Кнопка «Отменить заказ» (destructive):
//   ТОЛЬКО при status = 'pending' | 'assigned'
```

---

### Экран 15: PhotoReportScreen

```tsx
// success Card: checkCircle icon (success 20px) | «Уборка выполнена» (headingMd success) + дата (bodySm sage)

// SectionLabel «Фото до»
// Grid 2 колонки, gap 8:
//   PhotoBox before: height 100, bg parchment, border 0.5px stone, radius 8
//   (заглушка: camera icon stone, centered)

// SectionLabel «Фото после»
// Grid 2 колонки:
//   PhotoBox after: height 100, bg successBg, border sageL, radius 8
//   (заглушка: check icon success, centered)

// Нажатие на фото → полноэкранный просмотр (react-native-image-viewing)

// SectionLabel «Оценить работу» (если rating=null)
// StarRating value={localRating} onChange={...} size={28}
//   Сохраняется через debounce 800ms автоматически

// Button primary «Заказать повторно»
// Button secondary «Скачать фото»

// Состояния:
// Default (без оценки): StarRating все пустые
// Rated:               StarRating заполнена до выбранной
```

---

### Экран 16: RemindersScreen

```tsx
// Card (surface) с именем могилы и кладбищем (контекст)

// SectionLabel «Даты»
// RemindItem (border-bottom 0.5px linen):
//   IconWrap (26×26, radius full):
//     birthday: bg warningBg, icon Cake warning
//     anniversary: bg parchment, icon Candle muted
//   Body: label (headingMd) + «2 мая · через 347 дней» (bodySm light)
//   Toggle (right)

// Row «+ Добавить дату» (icon Plus sage) → AddReminderBottomSheet

// Divider

// SectionLabel «Автозаказ к дате»
// Card (surface):
//   «За 5 дней до годовщины автоматически заказать:»
//   Список услуг с checkCircle sage
//   Ссылка «+ Настроить автозаказ» sage → AutoOrderBottomSheet

// Состояния:
// Default:  есть 2 даты из реестра
// Empty:    нет дат → «+ Добавить» с описанием зачем
// Autoorder configured: показывает настроенный автозаказ
```

---

### Экран 17: ProfileScreen

```tsx
// Row: Avatar(40) | имя (Playfair headingLg) + телефон (bodySm muted) | edit icon

// SubscriptionBanner (LinearGradient forest→moss, radius 10, padding 12):
//   «ПОДПИСКА» sectionLabel sage-l
//   «Стандарт» Playfair headingLg cream
//   «до 15 июня 2025» bodySm rgba(cream, 0.7)
//   Кнопка «Управлять» (secondary с кремовым текстом, right)

// SectionLabel «Моё»
// ProfileRow (border-bottom 0.5px linen):
//   icon sage (20px) | label (bodyMd ink) | chevronRight light
// Строки: Сохранённые могилы (N) | Памятные даты | История заказов

// Divider

// SectionLabel «Помощь»
// Строки: Поддержка в Telegram | Политика и условия

// Ссылка «Выйти из аккаунта» (ghost, centered, marginTop 16)

// Bottom Tab: вкладка «Профиль» активна
```

---

### Экран 18: SubscriptionScreen

```tsx
// Описание (bodyMd muted centered, max-width 280)

const plans = [
  {
    id: 'basic', name: 'Базовый',
    price: '0', period: 'навсегда бесплатно',
    features: ['Поиск захоронений', 'Разовые заказы и фотоотчёты'],
    featured: false,
  },
  {
    id: 'standard', name: 'Стандарт',
    price: '299', period: 'в месяц · до 3 захоронений',
    features: ['Всё из базового','Напоминания о датах','Автозаказ к годовщинам','Приоритетные исполнители'],
    featured: true,  // тёмный фон forest
    badge: 'Популярный',
  },
  {
    id: 'premium', name: 'Премиум',
    price: '699', period: 'в месяц · без ограничений',
    features: ['Всё из стандарта','Персональный менеджер','Скидка 15% на услуги'],
    featured: false,
  },
]

// PlanCard:
//   Default: Card default (border stone)
//   Featured: Card featured (bg forest)
//     badge «Популярный» — Chip sage positioned absolute top:-12 center
//   name:  Playfair headingLg (cream если featured, иначе forest)
//   price: Playfair priceDisplay (sageXL если featured, иначе forest)
//   period: bodySm (rgba cream 0.6 если featured, иначе light)
//   features: список с checkCircle sage prefix
//   Button: solid (sageXL→forest text) если featured | outline если default

// Ссылка «Восстановить покупки» (ghost, centered, marginTop 12)
//   ОБЯЗАТЕЛЬНА для App Store
```

---

## 8. ЭКСПОРТ packages/ui

```ts
// packages/ui/src/index.ts — единый экспорт всего
export * from './tokens/colors'
export * from './tokens/typography'
export * from './tokens/spacing'
export * from './components/Button'
export * from './components/Input'
export * from './components/Card'
export * from './components/TopBar'
export * from './components/Badge'
export * from './components/SectionLabel'
export * from './components/Divider'
export * from './components/Avatar'
export * from './components/Toggle'
export * from './components/StarRating'
export * from './components/Skeleton'
export * from './utils/toast'
```

---

## 9. ЧЕКЛИСТ — проверить перед коммитом

**Цвета:**
- [ ] Ни одного хардкод HEX в компонентах или экранах
- [ ] Все цвета через `colors.token`

**Типографика:**
- [ ] Имена людей — Playfair Display, не DM Sans
- [ ] Section Labels — `sectionLabel` стиль (uppercase, light, letterSpacing)
- [ ] Нет fontWeight 700+ нигде

**Layout:**
- [ ] Горизонтальный padding экрана: 16pt
- [ ] useSafeAreaInsets() на каждом экране
- [ ] Все touch targets ≥ 44×44pt

**Компоненты:**
- [ ] StyleSheet.create() — нет inline-объектов в JSX
- [ ] Все состояния реализованы (Default/Active/Error/Disabled/Loading)
- [ ] Skeleton вместо спиннеров при загрузке

**Анимации:**
- [ ] Только react-native-reanimated, не Animated core
- [ ] Кнопки: scale 0.96 при tap
- [ ] Переходы: slide для stack, fade для tabs

**Контент:**
- [ ] Реалистичные данные (не Lorem Ipsum)
- [ ] Текст на русском языке
- [ ] Иконки из одной библиотеки (Phosphor)
