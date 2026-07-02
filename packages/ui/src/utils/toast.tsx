import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { radii, spacing } from '../tokens/spacing'
import { typography } from '../tokens/typography'
import { useColors } from '../theme/ThemeProvider'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  message: string
  type: ToastType
}

type ShowToast = (message: string, type?: ToastType) => void

const ToastContext = createContext<ShowToast>(() => {})

/** Хук для показа тостов из любого экрана. */
export function useToast(): ShowToast {
  return useContext(ToastContext)
}

/**
 * Провайдер тостов. Оборачивает приложение один раз в корне.
 * bg ink 0.9, авто-скрытие через 3с, слайд снизу.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets()
  const c = useColors()
  const accent: Record<ToastType, string> = { success: c.sageL, error: c.error, info: c.info }
  const [toast, setToast] = useState<ToastItem | null>(null)
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(20)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback<ShowToast>(
    (message, type = 'info') => {
      setToast({ message, type })
      opacity.value = withTiming(1, { duration: 250 })
      translateY.value = withTiming(0, { duration: 250 })
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 250 })
        translateY.value = withTiming(20, { duration: 250 })
      }, 3000)
    },
    [opacity, translateY]
  )

  useEffect(() => () => (timer.current ? clearTimeout(timer.current) : undefined), [])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.toast, { bottom: insets.bottom + spacing.md }, animatedStyle]}
        >
          <View style={[styles.dot, { backgroundColor: accent[toast.type] }]} />
          <Animated.Text style={styles.text}>{toast.message}</Animated.Text>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  )
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(26,26,20,0.9)',
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  dot: { width: 8, height: 8, borderRadius: radii.full },
  text: { ...typography.bodySm, color: '#FFFFFF', flex: 1 },
})
