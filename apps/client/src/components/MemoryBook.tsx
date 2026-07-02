import { memoriesApi, type Memory } from '@pamyat/api'
import {
  Avatar,
  BottomSheet,
  Button,
  Card,
  colors,
  Icon,
  Input,
  SectionLabel,
  spacing,
  Text,
  useToast,
} from '@pamyat/ui'
import { formatDate } from '@pamyat/utils'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, View } from 'react-native'

import { useProfile } from '../hooks/queries'

/** Книга воспоминаний: истории близких о человеке + форма добавления. */
export function MemoryBook({ graveId }: { graveId: string }) {
  const { t } = useTranslation()
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

  const add = useMutation({
    mutationFn: () =>
      memoriesApi.add({ graveId, authorName: author.trim() || profile?.name || 'Аноним', text: text.trim() }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['memories', graveId] })
      showToast(t('memoryBook.added'), 'success')
      setOpen(false)
      setText('')
    },
  })

  const openForm = () => {
    setAuthor(profile?.name ?? '')
    setOpen(true)
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
        memories?.map(m => <MemoryCard key={m.id} memory={m} />)
      )}

      <Pressable style={styles.addRow} onPress={openForm}>
        <Icon name="plus" size={20} color={colors.sage} />
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
        <Button
          label={t('memoryBook.submit')}
          onPress={() => add.mutate()}
          disabled={!canSubmit}
          loading={add.isPending}
          fullWidth
        />
      </BottomSheet>
    </View>
  )
}

function MemoryCard({ memory }: { memory: Memory }) {
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
    </Card>
  )
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  empty: { marginBottom: spacing.sm },
  card: { marginBottom: spacing.sm },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  cardMeta: { flex: 1 },
  cardText: { lineHeight: 24 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  sheetTitle: { marginBottom: spacing.md },
  field: { marginBottom: spacing.md },
})
