import { Image } from 'expo-image'
import React from 'react'
import { StyleSheet, Text as RNText, View } from 'react-native'

import { initials } from '@pamyat/utils'

import { useColors } from '../theme/ThemeProvider'

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
  // Метрики масштабируются от размера аватара: фиксированный lineHeight
  // из токенов обрезал крупные инициалы (герой 96px, редактор 72px).
  const fontSize = Math.round(size * 0.34)
  return (
    <View style={[styles.placeholder, { width: size, height: size, borderRadius: radius, backgroundColor: c.sageXL }]}>
      <RNText
        allowFontScaling={false}
        style={[
          styles.initials,
          { fontSize, lineHeight: Math.round(fontSize * 1.4), color: c.forest },
        ]}
      >
        {initials(name)}
      </RNText>
    </View>
  )
}

const styles = StyleSheet.create({
  placeholder: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  initials: {
    fontFamily: 'DMSans_500Medium',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
})
