import { Image } from 'expo-image'
import React from 'react'
import { StyleSheet, View } from 'react-native'

import { initials } from '@pamyat/utils'

import { typography } from '../tokens/typography'
import { useColors } from '../theme/ThemeProvider'
import { Text } from './Text'

interface AvatarProps {
  name: string
  size?: number
  imageUri?: string | null
}

export function Avatar({ name, size = 40, imageUri }: AvatarProps) {
  const c = useColors()
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
    <View style={[styles.placeholder, { width: size, height: size, borderRadius: radius, backgroundColor: c.sageXL }]}>
      <Text style={[styles.initials, { fontSize: size * 0.35, color: c.forest }]}>{initials(name)}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  initials: { ...typography.label },
})
