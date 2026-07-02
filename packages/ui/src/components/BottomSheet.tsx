import React, { useEffect } from 'react'
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native'
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { radii, spacing } from '../tokens/spacing'
import { useColors } from '../theme/ThemeProvider'

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
  const c = useColors()
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
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <AnimatedPressable style={[styles.overlay, overlayStyle]} onPress={onClose} />
        <Animated.View
          style={[styles.sheet, { backgroundColor: c.cream, paddingBottom: insets.bottom + spacing.lg }, sheetStyle]}
        >
          <View style={[styles.handle, { backgroundColor: c.stone }]} />
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(26,26,20,0.45)' },
  sheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: radii.full,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
})
