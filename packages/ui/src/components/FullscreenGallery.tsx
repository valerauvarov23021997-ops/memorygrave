import { Image } from 'expo-image'
import * as Phosphor from 'phosphor-react-native'
import React, { useState } from 'react'
import { Dimensions, FlatList, Modal, Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { colors } from '../tokens/colors'
import { spacing } from '../tokens/spacing'
import { typography } from '../tokens/typography'
import { Text } from './Text'

interface FullscreenGalleryProps {
  visible: boolean
  photos: string[]
  initialIndex?: number
  onClose: () => void
}

const { width, height } = Dimensions.get('window')

/**
 * Полноэкранный просмотр фото: горизонтальный свайп между снимками,
 * тап по фото или крестик — закрыть. Чёрный фон, счётчик страниц.
 */
export function FullscreenGallery({ visible, photos, initialIndex = 0, onClose }: FullscreenGalleryProps) {
  const insets = useSafeAreaInsets()
  const [index, setIndex] = useState(initialIndex)

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <FlatList
          data={photos}
          keyExtractor={(item, i) => `${item}-${i}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          onMomentumScrollEnd={e => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          renderItem={({ item }) => (
            <Pressable style={styles.page} onPress={onClose}>
              <Image source={{ uri: item }} style={styles.image} contentFit="contain" />
            </Pressable>
          )}
        />

        <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
          {photos.length > 1 ? (
            <Text style={styles.counter}>{`${index + 1} / ${photos.length}`}</Text>
          ) : (
            <View />
          )}
          <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
            <Phosphor.X size={22} color={colors.white} weight="bold" />
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  page: { width, height, alignItems: 'center', justifyContent: 'center' },
  image: { width, height: height * 0.8 },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  counter: { ...typography.bodyMd, color: colors.white },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
