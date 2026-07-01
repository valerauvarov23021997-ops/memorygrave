import React from 'react'
import { StyleSheet, View } from 'react-native'

import { colors } from '../tokens/colors'
import { spacing } from '../tokens/spacing'

export function Divider() {
  return <View style={styles.divider} />
}

const styles = StyleSheet.create({
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.linen, marginVertical: spacing.sm },
})
