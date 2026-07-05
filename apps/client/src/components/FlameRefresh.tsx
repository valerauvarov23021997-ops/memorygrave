import { FlameLoader, haptics, useColors } from '@pamyat/ui'
import React, { useEffect, useRef } from 'react'
import { Platform, RefreshControl, StyleSheet } from 'react-native'
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

interface Options {
  refreshing: boolean
  onRefresh: () => void
  /** Отступ огонька от верха экрана (insets.top + высота шапки). */
  top: number
}

/**
 * Фирменный pull-to-refresh: на iOS огонёк проявляется в «щели» по мере
 * оттягивания, а при отпускании пальца растворяется на месте, пока экран
 * поднимается обратно. На Android список не тянется «в минус», поэтому
 * остаётся системный жест с золотым индикатором.
 */
export function useFlameRefresh({ refreshing, onRefresh, top }: Options) {
  const c = useColors()
  const pullY = useSharedValue(0)
  // 1 — палец на экране: яркость следует за жестом; 0 — отпущен: гаснем
  const dragging = useSharedValue(0)

  const refreshingRef = useRef(refreshing)
  useEffect(() => {
    refreshingRef.current = refreshing
  }, [refreshing])

  const trigger = () => {
    if (refreshingRef.current) return
    haptics.light()
    onRefresh()
  }

  const onScroll = useAnimatedScrollHandler({
    onBeginDrag: () => {
      dragging.value = 1
    },
    onScroll: e => {
      pullY.value = e.contentOffset.y
    },
    onEndDrag: e => {
      dragging.value = 0
      if (e.contentOffset.y < -64) {
        runOnJS(trigger)()
      }
    },
  })

  const flameStyle = useAnimatedStyle(() => ({
    opacity: dragging.value
      ? interpolate(pullY.value, [-16, -56], [0, 1], 'clamp')
      : withTiming(0, { duration: 240 }),
    transform: [{ scale: interpolate(pullY.value, [-16, -72], [0.55, 1], 'clamp') }],
  }))

  const ios = Platform.OS === 'ios'

  return {
    /** Пропсы для Animated.FlatList / Animated.ScrollView. */
    scrollProps: ios ? { onScroll, scrollEventThrottle: 16 } : {},
    refreshControl: ios ? undefined : (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        tintColor={c.gold}
        colors={[c.gold]}
        progressBackgroundColor={c.white}
      />
    ),
    /** Огонёк — рендерить последним элементом экрана (поверх списка). */
    indicator: ios ? (
      <Animated.View pointerEvents="none" style={[styles.flame, { top }, flameStyle]}>
        <FlameLoader size={26} />
      </Animated.View>
    ) : null,
  }
}

const styles = StyleSheet.create({
  flame: { position: 'absolute', alignSelf: 'center', zIndex: 10 },
})
