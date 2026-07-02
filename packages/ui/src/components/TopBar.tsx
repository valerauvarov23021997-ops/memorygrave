import { BlurView } from 'expo-blur'
import * as Phosphor from 'phosphor-react-native'
import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { type ThemeColors } from '../tokens/colors'
import { MIN_TOUCH_TARGET, spacing } from '../tokens/spacing'
import { typography } from '../tokens/typography'
import { useColors, useThemedStyles, useTheme } from '../theme/ThemeProvider'
import { Text } from './Text'

interface TopBarProps {
  title?: string
  onBack?: () => void
  rightElement?: React.ReactNode
  transparent?: boolean
}

export function TopBar({ title, onBack, rightElement, transparent }: TopBarProps) {
  const insets = useSafeAreaInsets()
  const c = useColors()
  const { isDark } = useTheme()
  const styles = useThemedStyles(makeStyles)
  const paddingTop = insets.top

  const content = (
    <View style={styles.row}>
      <View style={styles.side}>
        {onBack ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Назад" hitSlop={8} onPress={onBack} style={styles.touch}>
            <Phosphor.CaretLeft size={24} color={c.light} weight="regular" />
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
      <BlurView intensity={30} tint={isDark ? 'dark' : 'light'} style={[styles.transparent, { paddingTop }]}>
        {content}
      </BlurView>
    )
  }

  return <View style={[styles.solid, { paddingTop }]}>{content}</View>
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    solid: { backgroundColor: c.cream, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.linen },
    transparent: { backgroundColor: 'transparent' },
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
    title: { ...typography.headingLg, color: c.forest, flex: 1, textAlign: 'center' },
  })
