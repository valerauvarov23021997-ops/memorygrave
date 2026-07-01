import React from 'react'
import { Pressable, StyleSheet } from 'react-native'

import { colors } from '../tokens/colors'
import { MIN_TOUCH_TARGET, radii, spacing } from '../tokens/spacing'
import { typography } from '../tokens/typography'
import { Text } from './Text'

interface ChipProps {
  label: string
  active?: boolean
  onPress?: () => void
}

/** Фильтр-чип: default (parchment) / active (forest). */
export function Chip({ label, active = false, onPress }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.chip, active ? styles.active : styles.inactive]}
    >
      <Text style={[styles.label, { color: active ? colors.cream : colors.muted }]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  chip: {
    height: 36,
    minHeight: undefined,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: MIN_TOUCH_TARGET,
  },
  active: { backgroundColor: colors.forest },
  inactive: { backgroundColor: colors.parchment, borderWidth: 0.5, borderColor: colors.linen },
  label: { ...typography.bodySm, fontFamily: 'DMSans_500Medium' },
})
