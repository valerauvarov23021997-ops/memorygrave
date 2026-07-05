import { FlameLoader, haptics, useColors } from '@pamyat/ui'
import React from 'react'
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  RefreshControl,
  StyleSheet,
} from 'react-native'
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'

interface Options {
  refreshing: boolean
  onRefresh: () => void
  /** Отступ огонька от верха экрана (обычно insets.top + высота шапки). */
  top?: number
}

/**
 * Фирменный pull-to-refresh: на iOS огонёк проявляется по мере оттягивания
 * списка (как на странице памяти). На Android список не тянется «в минус»,
 * поэтому остаётся системный жест с золотым индикатором.
 */
export function useFlameRefresh({ refreshing, onRefresh, top = 8 }: Options) {
  const c = useColors()
  const pullY = useSharedValue(0)

  const onScroll = useAnimatedScrollHandler(e => {
    pullY.value = e.contentOffset.y
  })

  const flameStyle = useAnimatedStyle(
    () => ({
      opacity: refreshing ? 1 : interpolate(pullY.value, [-16, -56], [0, 1], 'clamp'),
      transform: [{ scale: interpolate(pullY.value, [-16, -72], [0.55, 1], 'clamp') }],
    }),
    [refreshing]
  )

  const onScrollEndDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (e.nativeEvent.contentOffset.y < -64 && !refreshing) {
      haptics.light()
      onRefresh()
    }
  }

  const ios = Platform.OS === 'ios'

  return {
    /** Пропсы для Animated.FlatList / Animated.ScrollView. */
    scrollProps: ios ? { onScroll, onScrollEndDrag, scrollEventThrottle: 16 } : {},
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
