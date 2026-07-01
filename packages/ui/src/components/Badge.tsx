import React from 'react'
import { StyleSheet, View, type ViewStyle } from 'react-native'

import { colors } from '../tokens/colors'
import { radii } from '../tokens/spacing'
import { typography } from '../tokens/typography'
import { Text } from './Text'

type BadgeVariant = 'success' | 'warning' | 'info' | 'neutral' | 'error'

interface BadgeProps {
  label: string
  variant?: BadgeVariant
}

export function Badge({ label, variant = 'neutral' }: BadgeProps) {
  const scheme = schemes[variant]
  return (
    <View style={[styles.badge, { backgroundColor: scheme.bg }]}>
      <Text style={[styles.text, { color: scheme.text }]}>{label}</Text>
    </View>
  )
}

const schemes: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: colors.successBg, text: colors.success },
  warning: { bg: colors.warningBg, text: colors.warning },
  info: { bg: colors.infoBg, text: colors.info },
  neutral: { bg: colors.parchment, text: colors.light },
  error: { bg: colors.errorBg, text: colors.error },
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radii.lg,
    paddingHorizontal: 8,
    paddingVertical: 2,
  } as ViewStyle,
  text: { ...typography.caption, fontFamily: 'DMSans_500Medium' },
})
