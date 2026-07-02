import React, { createContext, useContext, useMemo } from 'react'
import { StyleSheet } from 'react-native'

import { lightColors, type ThemeColors } from '../tokens/colors'

export type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  mode: ThemeMode
  isDark: boolean
  colors: ThemeColors
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

interface ThemeProviderProps {
  children: React.ReactNode
}

/**
 * Провайдер темы. Сейчас приложение работает только в светлой палитре —
 * хуки useColors/useThemedStyles сохранены как единая точка доступа к цветам,
 * что упрощает возможное добавление тем в будущем.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const value = useMemo<ThemeContextValue>(
    () => ({ mode: 'light', isDark: false, colors: lightColors, setMode: () => {} }),
    []
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/** Полный доступ к теме: режим, переключение, флаг тёмной темы, палитра. */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    // Фолбэк вне провайдера — светлая палитра, чтобы ничего не падало.
    return { mode: 'light', isDark: false, colors: lightColors, setMode: () => {} }
  }
  return ctx
}

/** Активная палитра. Основной способ получить цвета в компонентах. */
export function useColors(): ThemeColors {
  return useTheme().colors
}

/**
 * Мемоизированные стили под текущую тему.
 * Использование: const styles = useThemedStyles(makeStyles), где
 * makeStyles(c) => StyleSheet.create({ ... c.forest ... }).
 */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (colors: ThemeColors) => T
): T {
  const colors = useColors()
  return useMemo(() => factory(colors), [colors, factory])
}
