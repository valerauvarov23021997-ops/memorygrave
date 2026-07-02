import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Appearance, StyleSheet } from 'react-native'

import { darkColors, lightColors, type ThemeColors } from '../tokens/colors'

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
  /** Стартовый режим (например, восстановленный из хранилища). */
  initialMode?: ThemeMode
  /** Вызывается при смене режима — приложение сохраняет выбор. */
  onModeChange?: (mode: ThemeMode) => void
}

export function ThemeProvider({ children, initialMode = 'system', onModeChange }: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(initialMode)
  const [systemScheme, setSystemScheme] = useState(Appearance.getColorScheme())

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => setSystemScheme(colorScheme))
    return () => sub.remove()
  }, [])

  const setMode = (next: ThemeMode) => {
    setModeState(next)
    onModeChange?.(next)
  }

  const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark'
  const colors = isDark ? darkColors : lightColors

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, isDark, colors, setMode }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, isDark]
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
