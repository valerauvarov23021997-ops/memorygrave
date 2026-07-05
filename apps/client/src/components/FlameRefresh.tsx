import { FlameLoader, haptics, useColors } from '@pamyat/ui'
import React from 'react'
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  RefreshControl,
  StyleSheet,
  View,
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
}

/**
 * Фирменный pull-to-refresh: на iOS огонёк живёт над верхом контента
 * и проявляется в «щели» по мере оттягивания списка — а при отпускании
 * уезжает вместе с ней, не наплывая на контент. На Android список
 * не тянется «в минус», поэтому остаётся системный жест с золотым
 * индикатором.
 */
export function useFlameRefresh({ refreshing, onRefresh }: Options) {
  const c = useColors()
  const pullY = useSharedValue(0)

  const onScroll = useAnimatedScrollHandler(e => {
    pullY.value = e.contentOffset.y
  })

  const flameStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pullY.value, [-16, -56], [0, 1], 'clamp'),
    transform: [{ scale: interpolate(pullY.value, [-16, -72], [0.55, 1], 'clamp') }],
  }))

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
    /** Передать в ListHeaderComponent списка: огонёк едет вместе с контентом. */
    listHeader: ios ? (
      <View style={styles.anchor} pointerEvents="none">
        <Animated.View style={[styles.flame, flameStyle]}>
          <FlameLoader size={26} />
        </Animated.View>
      </View>
    ) : null,
  }
}

const styles = StyleSheet.create({
  // нулевая высота: якорь не влияет на раскладку, огонёк висит над контентом
  anchor: { height: 0 },
  flame: { position: 'absolute', top: -68, alignSelf: 'center' },
})
