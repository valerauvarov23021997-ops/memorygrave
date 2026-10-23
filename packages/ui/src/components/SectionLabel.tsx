import React from 'react'
import { StyleSheet, type StyleProp, type TextStyle } from 'react-native'

import { Text } from './Text'
import { spacing } from '../tokens/spacing'
import { typography } from '../tokens/typography'

interface SectionLabelProps {
  children: string
  style?: StyleProp<TextStyle>
}

/** «ФОТО ДО», «БЫСТРЫЕ УСЛУГИ» — uppercase, light, letterSpacing. */
export function SectionLabel({ children, style }: SectionLabelProps) {
  return (
    <Text color="light" style={[styles.label, style]}>
      {children}
    </Text>
  )
}

const styles = StyleSheet.create({
  label: { ...typography.sectionLabel, marginBottom: spacing.sm },
})
