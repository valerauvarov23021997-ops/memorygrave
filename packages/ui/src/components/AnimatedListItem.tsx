import React from 'react'
import Animated, { FadeInDown } from 'react-native-reanimated'

interface AnimatedListItemProps {
  /** Индекс в списке — задаёт задержку для каскадного появления. */
  index: number
  children: React.ReactNode
}

/**
 * Обёртка для элементов списка: мягкое каскадное «выплывание» снизу.
 * Задержка растёт с индексом, но ограничена, чтобы длинные списки
 * не появлялись слишком долго.
 */
export function AnimatedListItem({ index, children }: AnimatedListItemProps) {
  const delay = Math.min(index, 8) * 45
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(340).springify().damping(18)}>
      {children}
    </Animated.View>
  )
}
