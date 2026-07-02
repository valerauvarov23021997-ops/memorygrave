import React from 'react'
import { StyleSheet, View, type ViewStyle } from 'react-native'

import { type ThemeColors } from '../tokens/colors'
import { radii } from '../tokens/spacing'
import { typography } from '../tokens/typography'
import { useColors } from '../theme/ThemeProvider'
import { Text } from './Text'

type BadgeVariant = 'success' | 'warning' | 'info' | 'neutral' | 'error'

interface BadgeProps {
  label: string
  variant?: BadgeVariant
}

function scheme(variant: BadgeVariant, c: ThemeColors): { bg: string; text: string } {
  switch (variant) {
    case 'success':
      return { bg: c.successBg, text: c.success }
    case 'warning':
      return { bg: c.warningBg, text: c.warning }
    case 'info':
      return { bg: c.infoBg, text: c.info }
    case 'error':
      return { bg: c.errorBg, text: c.error }
    case 'neutral':
    default:
      return { bg: c.parchment, text: c.light }
  }
}

export function Badge({ label, variant = 'neutral' }: BadgeProps) {
  const c = useColors()
  const s = scheme(variant, c)
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.text, { color: s.text }]}>{label}</Text>
    </View>
  )
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
