# Задача 01 — Дизайн-система (packages/ui)

## Цель
Создать полную библиотеку переиспользуемых компонентов, которые используют оба приложения. Никакой бизнес-логики — только UI.

## Компоненты для создания

### Button
Файл: `packages/ui/src/components/Button.tsx`

```ts
type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost'
type ButtonSize    = 'md' | 'lg'

interface ButtonProps {
  label:     string
  onPress:   () => void
  variant?:  ButtonVariant  // default: 'primary'
  size?:     ButtonSize     // default: 'lg'
  loading?:  boolean
  disabled?: boolean
  fullWidth?: boolean
}
```

Правила:
- Primary: background forest, текст cream, border-radius 8
- Secondary: border 1px forest, текст forest, background transparent
- Destructive: border 1px error, текст error
- Ghost: только текст, без border и background
- При loading — ActivityIndicator цвета cream (primary) или forest (secondary), текст скрыт
- При disabled — opacity 0.4, onPress не вызывается
- Минимальная высота: 52pt (lg), 44pt (md)
- Анимация нажатия: scale 0.96 через Reanimated withSpring

### Input
Файл: `packages/ui/src/components/Input.tsx`

```ts
interface InputProps {
  label?:        string
  value:         string
  onChangeText:  (text: string) => void
  placeholder?:  string
  error?:        string        // показывает красный лейбл снизу
  keyboardType?: KeyboardTypeOptions
  secureTextEntry?: boolean
  maxLength?:    number
  multiline?:    boolean       // для textarea
  rightElement?: React.ReactNode
  editable?:     boolean
}
```

Состояния (менять стили автоматически):
- Default: background parchment, border 1px linen
- Active (onFocus): border 1.5px sage, background white
- Filled: border 1px linen, background white
- Error: border 1.5px error, + errorText снизу 11sp color.error
- Высота: 52pt (не multiline), auto (multiline, minHeight 80)

### Card
Файл: `packages/ui/src/components/Card.tsx`

```ts
interface CardProps {
  children:  React.ReactNode
  variant?:  'default' | 'surface' | 'featured' | 'success' | 'warning'
  padding?:  'sm' | 'md' | 'lg'  // default: md (12pt)
  onPress?:  () => void           // делает карточку нажимаемой
}
```

- Default: background white, border 0.5px linen, radius 10
- Surface: background parchment, без border
- Featured: background forest, border forest
- Success: background successBg, border 0.5px sageL
- Warning: background warningBg, border 0.5px '#D4A060'

### Badge
Файл: `packages/ui/src/components/Badge.tsx`

```ts
type BadgeVariant = 'success' | 'warning' | 'info' | 'neutral' | 'error'
interface BadgeProps { label: string; variant: BadgeVariant }
```

- Радиус: 10px, padding: 2px 8px, font: DMSans 11sp 500
- Цвета по variant из семантических токенов

### SectionLabel
Файл: `packages/ui/src/components/SectionLabel.tsx`

```ts
interface SectionLabelProps { children: string; style?: StyleProp<TextStyle> }
```

- DMSans 11sp 300, uppercase, letterSpacing 1.4, color light
- marginBottom 8

### Divider
Файл: `packages/ui/src/components/Divider.tsx`

- height 0.5, background linen, marginVertical 8

### Avatar
Файл: `packages/ui/src/components/Avatar.tsx`

```ts
interface AvatarProps { name: string; size?: number; imageUri?: string }
```

- Если imageUri — показывает фото через expo-image
- Если нет — инициалы (первые буквы имён), background sageXL, цвет forest
- border-radius: size/2 (круг)
- Размер по умолчанию: 40pt

### Toggle
Файл: `packages/ui/src/components/Toggle.tsx`

```ts
interface ToggleProps { value: boolean; onValueChange: (v: boolean) => void; disabled?: boolean }
```

- Использовать нативный Switch, но переопределить цвета:
  - trackColorTrue: sage, trackColorFalse: stone, thumbColor: white

### StarRating
Файл: `packages/ui/src/components/StarRating.tsx`

```ts
interface StarRatingProps {
  value:     number       // 0–5
  onChange?: (v: number) => void  // если undefined — readonly
  size?:     number       // default: 24
}
```

- 5 звёзд (иконка ★)
- Заполненная: color gold
- Пустая: color stone
- При onChange: анимация scale 1.3 → 1.0 при нажатии (Reanimated)

### Skeleton
Файл: `packages/ui/src/components/Skeleton.tsx`

```ts
interface SkeletonProps { width: number | string; height: number; radius?: number }
```

- Shimmer-анимация: LinearGradient движется слева направо, цикл 1.5s
- Цвет: parchment → linen → parchment
- Использовать expo-linear-gradient

### TopBar
Файл: `packages/ui/src/components/TopBar.tsx`

```ts
interface TopBarProps {
  title?:       string
  onBack?:      () => void    // если есть — показывает кнопку назад
  rightElement?: React.ReactNode
  transparent?: boolean       // для отображения поверх карты
}
```

- Высота: 52pt (не считая StatusBar)
- Background: cream (default) | rgba(250,247,242,0.9) + blur (transparent)
- Border-bottom: 0.5px linen (default) | none (transparent)
- Заголовок: Playfair Display 18sp 500, цвет forest, по центру
- Кнопка назад: иконка chevron-left, touch area 44×44pt

### Toast (утилита, не компонент)
Файл: `packages/ui/src/utils/toast.ts`

```ts
export function showToast(message: string, type?: 'success' | 'error' | 'info'): void
```

- Использовать react-native-toast-message или создать через Reanimated
- Появляется снизу (над SafeArea), background ink opacity 0.9, текст white
- Auto-dismiss через 3 секунды

## Экспорт

`packages/ui/src/index.ts` — экспортирует все компоненты и токены:
```ts
export * from './tokens'
export * from './components/Button'
export * from './components/Input'
// ... все компоненты
```

## Тесты

Для каждого компонента — минимум один тест в `__tests__/`:
```ts
// Button.test.tsx
it('вызывает onPress при нажатии', () => {
  const onPress = jest.fn()
  const { getByText } = render(<Button label="Тест" onPress={onPress} />)
  fireEvent.press(getByText('Тест'))
  expect(onPress).toHaveBeenCalledTimes(1)
})

it('не вызывает onPress если disabled', () => { ... })
it('показывает ActivityIndicator при loading', () => { ... })
```

## Критерии выполнения

- [ ] Все компоненты экспортируются из `@pamyat/ui`
- [ ] Каждый компонент — все состояния из ТЗ
- [ ] Тесты проходят: `yarn workspace @pamyat/ui test`
- [ ] Нет TypeScript-ошибок
- [ ] Все цвета — из `colors` токенов, не хардкод
