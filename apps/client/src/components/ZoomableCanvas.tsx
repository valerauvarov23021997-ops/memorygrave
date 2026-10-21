import { forwardRef, useImperativeHandle, type ReactNode } from 'react'
import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'

/** С какого масштаба план считается «приближенным» — пора показывать подписи. */
const ZOOMED_AT = 3.5
const FOCUS_SCALE = 4

export interface ZoomableHandle {
  /** Приблизить и поставить в центр точку (в пикселях холста до масштаба). */
  focusOn: (x: number, y: number, scale?: number) => void
  /** Изменить масштаб в factor раз относительно центра. */
  zoomBy: (factor: number) => void
  /** Весь план. */
  reset: () => void
}

interface ZoomableCanvasProps {
  children: ReactNode
  style?: StyleProp<ViewStyle>
  maxScale?: number
  onLayout?: (e: LayoutChangeEvent) => void
  /** Перешли порог ZOOMED_AT туда или обратно. */
  onZoomedChange?: (zoomed: boolean) => void
}

/** Сдвиг не даёт увести план за край: при масштабе s запас — (s-1)/2 размера. */
function clampShift(t: number, s: number, dim: number): number {
  'worklet'
  const max = ((s - 1) * dim) / 2
  return Math.min(max, Math.max(-max, t))
}

/**
 * Холст, который можно приближать двумя пальцами, двигать одним и
 * приближать двойным касанием. Одиночные касания проходят к детям —
 * метки на плане по-прежнему нажимаются.
 */
export const ZoomableCanvas = forwardRef<ZoomableHandle, ZoomableCanvasProps>(
  function ZoomableCanvas({ children, style, maxScale = 6, onLayout, onZoomedChange }, ref) {
    const width = useSharedValue(0)
    const height = useSharedValue(0)
    const scale = useSharedValue(1)
    const startScale = useSharedValue(1)
    const tx = useSharedValue(0)
    const ty = useSharedValue(0)
    const startX = useSharedValue(0)
    const startY = useSharedValue(0)

    const animateTo = (s: number, x: number, y: number) => {
      scale.value = withTiming(s)
      tx.value = withTiming(clampShift(x, s, width.value))
      ty.value = withTiming(clampShift(y, s, height.value))
    }

    useImperativeHandle(ref, () => ({
      focusOn: (x, y, s = FOCUS_SCALE) => {
        const target = Math.min(maxScale, s)
        // точка p после трансформации: центр + (p - центр)·s + сдвиг → сдвиг = (центр - p)·s
        animateTo(target, (width.value / 2 - x) * target, (height.value / 2 - y) * target)
      },
      zoomBy: factor => {
        const target = Math.min(maxScale, Math.max(1, scale.value * factor))
        const k = target / scale.value
        animateTo(target, tx.value * k, ty.value * k)
      },
      reset: () => {
        animateTo(1, 0, 0)
      },
    }))

    const pinch = Gesture.Pinch()
      .onStart(() => {
        startScale.value = scale.value
      })
      .onUpdate(e => {
        const s = Math.min(maxScale, Math.max(1, startScale.value * e.scale))
        scale.value = s
        tx.value = clampShift(tx.value, s, width.value)
        ty.value = clampShift(ty.value, s, height.value)
      })

    const pan = Gesture.Pan()
      .minDistance(6)
      .averageTouches(true)
      .onStart(() => {
        startX.value = tx.value
        startY.value = ty.value
      })
      .onUpdate(e => {
        tx.value = clampShift(startX.value + e.translationX, scale.value, width.value)
        ty.value = clampShift(startY.value + e.translationY, scale.value, height.value)
      })

    const doubleTap = Gesture.Tap()
      .numberOfTaps(2)
      .maxDuration(300)
      .onEnd(e => {
        if (scale.value > 1.2) {
          scale.value = withTiming(1)
          tx.value = withTiming(0)
          ty.value = withTiming(0)
          return
        }
        const s = 2.6
        scale.value = withTiming(s)
        tx.value = withTiming(clampShift((width.value / 2 - e.x) * s, s, width.value))
        ty.value = withTiming(clampShift((height.value / 2 - e.y) * s, s, height.value))
      })

    useAnimatedReaction(
      () => scale.value > ZOOMED_AT,
      (zoomed, prev) => {
        if (prev !== null && zoomed !== prev && onZoomedChange) scheduleOnRN(onZoomedChange, zoomed)
      }
    )

    const animated = useAnimatedStyle(() => ({
      transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
    }))

    return (
      <View
        style={[styles.clip, style]}
        onLayout={e => {
          width.value = e.nativeEvent.layout.width
          height.value = e.nativeEvent.layout.height
          onLayout?.(e)
        }}
      >
        <GestureDetector gesture={Gesture.Simultaneous(pinch, pan, doubleTap)}>
          <Animated.View style={[styles.fill, animated]}>{children}</Animated.View>
        </GestureDetector>
      </View>
    )
  }
)

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  fill: { flex: 1 },
})
