import React from 'react'
import { Pressable, StyleSheet } from 'react-native'

import { type ThemeColors } from '../tokens/colors'
import { MIN_TOUCH_TARGET, radii, spacing } from '../tokens/spacing'
import { typography } from '../tokens/typography'
import { useColors, useThemedStyles } from '../theme/ThemeProvider'
import { Text } from './Text'

interface ChipProps {
  label: string
  active?: boolean
  onPress?: () => void
}

/** Фильтр-чип: default (parchment) / active (forest). */
export function Chip({ label, active = false, onPress }: ChipProps) {
  const c = useColors()
  const styles = useThemedStyles(makeStyles)
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.chip, active ? styles.active : styles.inactive]}
    >
      <Text style={[styles.label, { color: active ? c.cream : c.muted }]}>{label}</Text>
    </Pressable>
  )
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    chip: {
      height: 36,
      paddingHorizontal: spacing.md,
      borderRadius: radii.full,
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: MIN_TOUCH_TARGET,
    },
    active: { backgroundColor: c.forest },
    inactive: { backgroundColor: c.parchment, borderWidth: 0.5, borderColor: c.linen },
    label: { ...typography.bodySm, fontFamily: 'DMSans_500Medium' },
  })
