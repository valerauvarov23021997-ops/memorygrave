import React from 'react'
import { StyleSheet, View } from 'react-native'

import { spacing } from '../tokens/spacing'
import { useColors } from '../theme/ThemeProvider'

export function Divider() {
  const c = useColors()
  return <View style={[styles.divider, { backgroundColor: c.linen }]} />
}

const styles = StyleSheet.create({
  divider: { height: StyleSheet.hairlineWidth, marginVertical: spacing.sm },
})
