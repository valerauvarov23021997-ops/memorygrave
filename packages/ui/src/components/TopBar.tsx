import { BlurView } from 'expo-blur'
import * as Phosphor from 'phosphor-react-native'
import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { colors } from '../tokens/colors'
import { MIN_TOUCH_TARGET, spacing } from '../tokens/spacing'
import { typography } from '../tokens/typography'
import { Text } from './Text'

interface TopBarProps {
  title?: string
  onBack?: () => void
  rightElement?: React.ReactNode
  transparent?: boolean
}

export function TopBar({ title, onBack, rightElement, transparent }: TopBarProps) {
  const insets = useSafeAreaInsets()
  const paddingTop = insets.top

  const content = (
    <View style={styles.row}>
      <View style={styles.side}>
        {onBack ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Назад" hitSlop={8} onPress={onBack} style={styles.touch}>
            <Phosphor.CaretLeft size={24} color={colors.light} weight="regular" />
          </Pressable>
        ) : null}
      </View>
      {title ? (
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      ) : (
        <View />
      )}
      <View style={[styles.side, styles.right]}>{rightElement}</View>
    </View>
  )

  if (transparent) {
    return (
      <BlurView intensity={30} tint="light" style={[styles.transparent, { paddingTop }]}>
        {content}
      </BlurView>
    )
  }

  return <View style={[styles.solid, { paddingTop }]}>{content}</View>
}

const styles = StyleSheet.create({
  solid: { backgroundColor: colors.cream, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.linen },
  transparent: { backgroundColor: 'rgba(250,247,242,0.85)' },
  row: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  side: { minWidth: MIN_TOUCH_TARGET, justifyContent: 'center' },
  right: { alignItems: 'flex-end' },
  touch: { minWidth: MIN_TOUCH_TARGET, minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' },
  title: { ...typography.headingLg, color: colors.forest, flex: 1, textAlign: 'center' },
})
