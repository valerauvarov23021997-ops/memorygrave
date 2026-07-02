import React from 'react'
import Animated, { FadeIn } from 'react-native-reanimated'

interface AnimatedListItemProps {
  /** Индекс в списке — задаёт лёгкую задержку для мягкого проявления. */
  index: number
  children: React.ReactNode
}

/**
 * Обёртка для элементов списка: спокойное проявление по прозрачности,
 * без сдвига и пружин — чтобы список не «дёргался», а мягко проступал.
 */
export function AnimatedListItem({ index, children }: AnimatedListItemProps) {
  const delay = Math.min(index, 6) * 40
  return <Animated.View entering={FadeIn.delay(delay).duration(400)}>{children}</Animated.View>
}
