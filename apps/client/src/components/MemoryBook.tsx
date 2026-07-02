import { memoriesApi, type Memory } from '@pamyat/api'
import {
  Avatar,
  BottomSheet,
  Button,
  Card,
  radii,
  useColors, useThemedStyles, type ThemeColors,
  FullscreenGallery,
  Icon,
  Input,
  SectionLabel,
  spacing,
  Text,
  useToast,
} from '@pamyat/ui'
import { formatDate } from '@pamyat/utils'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'

import { useProfile } from '../hooks/queries'

/** Книга воспоминаний: истории близких о человеке + форма добавления с фото. */
export function MemoryBook({ graveId }: { graveId: string }) {
  const { t } = useTranslation()
  const c = useColors()
  const styles = useThemedStyles(makeStyles)
  const qc = useQueryClient()
  const showToast = useToast()
  const { data: profile } = useProfile()

  const { data: memories } = useQuery({
    queryKey: ['memories', graveId],
    queryFn: () => memoriesApi.list(graveId),
  })

  const [open, setOpen] = useState(false)
  const [author, setAuthor] = useState('')
  const [text, setText] = useState('')
  const [photos, setPhotos] = useState<string[]>([])

  // Просмотр фото на весь экран
  const [viewer, setViewer] = useState<{ photos: string[]; index: number } | null>(null)

  const add = useMutation({
    mutationFn: () =>
      memoriesApi.add({
        graveId,
        authorName: author.trim() || profile?.name || 'Аноним',
        text: text.trim(),
        photos,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['memories', graveId] })
      showToast(t('memoryBook.added'), 'success')
      setOpen(false)
      setText('')
      setPhotos([])
    },
  })

  const openForm = () => {
    setAuthor(profile?.name ?? '')
    setOpen(true)
  }

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) return
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsMultipleSelection: false })
    if (!result.canceled && result.assets[0]) setPhotos(prev => [...prev, result.assets[0]!.uri])
  }

  const canSubmit = text.trim().length > 0

  return (
    <View style={styles.wrap}>
      <SectionLabel>{t('memoryBook.title')}</SectionLabel>

      {(memories?.length ?? 0) === 0 ? (
        <Text variant="bodySm" color="muted" style={styles.empty}>
          {t('memoryBook.empty')}
        </Text>
      ) : (
        memories?.map(m => (
          <MemoryCard key={m.id} memory={m} onOpenPhoto={index => setViewer({ photos: m.photos, index })} />
        ))
      )}

      <Pressable style={styles.addRow} onPress={openForm}>
        <Icon name="plus" size={20} color={c.sage} />
        <Text variant="bodyMd" color="sage">
          {t('memoryBook.add')}
        </Text>
      </Pressable>

      <BottomSheet visible={open} onClose={() => setOpen(false)}>
        <Text variant="headingLg" color="forest" style={styles.sheetTitle}>
          {t('memoryBook.add')}
        </Text>
        <View style={styles.field}>
          <Input
            label={t('memoryBook.yourName')}
            value={author}
            onChangeText={setAuthor}
            placeholder={t('memoryBook.yourNamePlaceholder')}
          />
        </View>
        <View style={styles.field}>
          <Input
            label={t('memoryBook.text')}
            value={text}
            onChangeText={setText}
            placeholder={t('memoryBook.textPlaceholder')}
            multiline
            maxLength={1000}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
          {photos.map((uri, i) => (
            <Image key={i} source={{ uri }} style={styles.thumb} contentFit="cover" />
          ))}
          <Pressable style={styles.addPhoto} onPress={pickPhoto}>
            <Icon name="camera" size={22} color={c.sage} />
          </Pressable>
        </ScrollView>

        <Button
          label={t('memoryBook.submit')}
          onPress={() => add.mutate()}
          disabled={!canSubmit}
          loading={add.isPending}
          fullWidth
        />
      </BottomSheet>

      <FullscreenGallery
        visible={!!viewer}
        photos={viewer?.photos ?? []}
        initialIndex={viewer?.index ?? 0}
        onClose={() => setViewer(null)}
      />
    </View>
  )
}

function MemoryCard({ memory, onOpenPhoto }: { memory: Memory; onOpenPhoto: (index: number) => void }) {
  const styles = useThemedStyles(makeStyles)
  return (
    <Card padding="md" style={styles.card}>
      <View style={styles.cardHead}>
        <Avatar name={memory.authorName} size={32} />
        <View style={styles.cardMeta}>
          <Text variant="headingMd" color="ink">
            {memory.authorName}
          </Text>
          <Text variant="caption" color="light">
            {formatDate(memory.createdAt)}
          </Text>
        </View>
      </View>
      <Text variant="bodyMd" color="ink" style={styles.cardText}>
        {memory.text}
      </Text>
      {memory.photos.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardPhotos}>
          {memory.photos.map((uri, i) => (
            <Pressable key={i} onPress={() => onOpenPhoto(i)}>
              <Image source={{ uri }} style={styles.cardThumb} contentFit="cover" />
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </Card>
  )
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  empty: { marginBottom: spacing.sm },
  card: { marginBottom: spacing.sm },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  cardMeta: { flex: 1 },
  cardText: { lineHeight: 24 },
  cardPhotos: { gap: spacing.sm, marginTop: spacing.sm },
  cardThumb: { width: 72, height: 72, borderRadius: radii.md },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  sheetTitle: { marginBottom: spacing.md },
  field: { marginBottom: spacing.md },
  photoRow: { gap: spacing.sm, marginBottom: spacing.lg, alignItems: 'center' },
  thumb: { width: 64, height: 64, borderRadius: radii.md },
  addPhoto: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: c.stone,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.parchment,
  },
})
