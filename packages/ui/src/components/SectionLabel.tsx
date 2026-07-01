import React from 'react'
import { StyleSheet } from 'react-native'

import { colors } from '../tokens/colors'
import { spacing } from '../tokens/spacing'
import { typography } from '../tokens/typography'
import { Text } from './Text'

interface SectionLabelProps {
  children: string
}

/** «ФОТО ДО», «БЫСТРЫЕ УСЛУГИ» — uppercase, light, letterSpacing. */
export function SectionLabel({ children }: SectionLabelProps) {
  return <Text style={styles.label}>{children}</Text>
}

const styles = StyleSheet.create({
  label: { ...typography.sectionLabel, color: colors.light, marginBottom: spacing.sm },
})
