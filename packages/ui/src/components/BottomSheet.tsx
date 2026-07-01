import React, { useEffect } from 'react'
import { Modal, Pressable, StyleSheet, View } from 'react-native'
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { colors } from '../tokens/colors'
import { radii, spacing } from '../tokens/spacing'

interface BottomSheetProps {
  visible: boolean
  onClose: () => void
  children: React.ReactNode
}

/**
 * Лёгкий bottom sheet на Modal + Reanimated (без нативных зависимостей).
 * Закрывается тапом по оверлею. Анимация всплытия 350ms ease-out.
 */
export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  const insets = useSafeAreaInsets()
  const translateY = useSharedValue(600)
  const overlayOpacity = useSharedValue(0)
  const [mounted, setMounted] = React.useState(visible)

  useEffect(() => {
    if (visible) {
      setMounted(true)
      translateY.value = withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) })
      overlayOpacity.value = withTiming(1, { duration: 250 })
    } else if (mounted) {
      overlayOpacity.value = withTiming(0, { duration: 250 })
      translateY.value = withTiming(600, { duration: 300, easing: Easing.in(Easing.cubic) }, finished => {
        if (finished) runOnJS(setMounted)(false)
      })
    }
  }, [visible, mounted, translateY, overlayOpacity])

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }))
  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }))

  if (!mounted) return null

  return (
    <Modal transparent visible={mounted} onRequestClose={onClose} animationType="none">
      <View style={styles.root}>
        <AnimatedPressable style={[styles.overlay, overlayStyle]} onPress={onClose} />
        <Animated.View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }, sheetStyle]}>
          <View style={styles.handle} />
          {children}
        </Animated.View>
      </View>
    </Modal>
  )
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(26,26,20,0.45)' },
  sheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.stone,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
})
