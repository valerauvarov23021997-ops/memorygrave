import { Image } from 'expo-image'
import React from 'react'
import { StyleSheet, View } from 'react-native'

import { initials } from '@pamyat/utils'

import { colors } from '../tokens/colors'
import { typography } from '../tokens/typography'
import { Text } from './Text'

interface AvatarProps {
  name: string
  size?: number
  imageUri?: string | null
}

export function Avatar({ name, size = 40, imageUri }: AvatarProps) {
  const radius = size / 2
  if (imageUri) {
    return (
      <Image
        source={{ uri: imageUri }}
        style={{ width: size, height: size, borderRadius: radius }}
        contentFit="cover"
      />
    )
  }
  return (
    <View style={[styles.placeholder, { width: size, height: size, borderRadius: radius }]}>
      <Text style={[styles.initials, { fontSize: size * 0.35 }]}>{initials(name)}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  placeholder: { backgroundColor: colors.sageXL, alignItems: 'center', justifyContent: 'center' },
  initials: { ...typography.label, color: colors.forest },
})
