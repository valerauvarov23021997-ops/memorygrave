import React from 'react'
import { StyleSheet } from 'react-native'

import { spacing } from '../tokens/spacing'
import { typography } from '../tokens/typography'
import { Text } from './Text'

interface SectionLabelProps {
  children: string
}

/** «ФОТО ДО», «БЫСТРЫЕ УСЛУГИ» — uppercase, light, letterSpacing. */
export function SectionLabel({ children }: SectionLabelProps) {
  return (
    <Text color="light" style={styles.label}>
      {children}
    </Text>
  )
}

const styles = StyleSheet.create({
  label: { ...typography.sectionLabel, marginBottom: spacing.sm },
})
