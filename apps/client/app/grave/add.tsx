import { gravesApi, type CreateGraveInput } from '@pamyat/api'
import {
  BottomSheet,
  Button,
  Card,
  colors,
  Icon,
  Input,
  spacing,
  Text,
  TopBar,
  useToast,
} from '@pamyat/ui'
import { validateFullName } from '@pamyat/utils'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useCemeteries } from '../../src/hooks/queries'

export default function AddGraveScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const showToast = useToast()
  const qc = useQueryClient()
  const { data: cemeteries } = useCemeteries()

  const [fullName, setFullName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [deathDate, setDeathDate] = useState('')
  const [cemeteryId, setCemeteryId] = useState<string | null>(null)
  const [plot, setPlot] = useState('')
  const [biography, setBiography] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [sheetOpen, setSheetOpen] = useState(false)

  const cemeteryName = cemeteries?.find(c => c.id === cemeteryId)?.name

  const mutation = useMutation({
    mutationFn: (input: CreateGraveInput) => gravesApi.create(input),
    onSuccess: grave => {
      void qc.invalidateQueries({ queryKey: ['graves'] })
      showToast(t('addGrave.success'), 'success')
      router.replace(`/grave/${grave.id}`)
    },
    onError: () => showToast(t('common.error'), 'error'),
  })

  const onSubmit = () => {
    const nameError = validateFullName(fullName)
    if (nameError) return setError(nameError)
    if (!cemeteryId) return setError(t('addGrave.cemetery'))
    setError(undefined)
    mutation.mutate({
      fullName: fullName.trim(),
      birthDate: birthDate || null,
      deathDate: deathDate || null,
      cemeteryId,
      plot: plot || null,
      biography: biography || null,
      photos: [],
    })
  }

  return (
    <View style={styles.root}>
      <TopBar title={t('addGrave.title')} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card variant="success" padding="md" style={styles.banner}>
          <Text variant="bodySm" color="success">
            {t('addGrave.banner')}
          </Text>
        </Card>

        <View style={styles.field}>
          <Input
            label={t('addGrave.fullName')}
            required
            value={fullName}
            onChangeText={setFullName}
            placeholder={t('addGrave.fullNamePlaceholder')}
            error={error}
          />
        </View>

        <View style={styles.dates}>
          <View style={styles.dateCol}>
            <Input label={t('addGrave.birthDate')} value={birthDate} onChangeText={setBirthDate} placeholder="ГГГГ-ММ-ДД" />
          </View>
          <View style={styles.dateCol}>
            <Input label={t('addGrave.deathDate')} value={deathDate} onChangeText={setDeathDate} placeholder="ГГГГ-ММ-ДД" />
          </View>
        </View>

        <Pressable style={styles.field} onPress={() => setSheetOpen(true)}>
          <Input
            label={t('addGrave.cemetery')}
            required
            value={cemeteryName ?? ''}
            onChangeText={() => {}}
            placeholder={t('addGrave.cemeteryPlaceholder')}
            editable={false}
            rightElement={<Icon name="chevronRight" size={18} color={colors.light} />}
          />
        </Pressable>

        <View style={styles.field}>
          <Input label={t('addGrave.plot')} value={plot} onChangeText={setPlot} placeholder={t('addGrave.plotPlaceholder')} />
        </View>

        <View style={styles.field}>
          <Input
            label={t('addGrave.biography')}
            value={biography}
            onChangeText={setBiography}
            placeholder={t('addGrave.biographyPlaceholder')}
            multiline
            maxLength={1000}
          />
        </View>

        <Button label={t('addGrave.submit')} onPress={onSubmit} loading={mutation.isPending} fullWidth />
        <View style={{ height: insets.bottom + spacing.xl }} />
      </ScrollView>

      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)}>
        <Text variant="headingLg" color="forest" style={styles.sheetTitle}>
          {t('addGrave.cemetery')}
        </Text>
        {(cemeteries ?? []).map(c => (
          <Pressable
            key={c.id}
            style={styles.cemeteryRow}
            onPress={() => {
              setCemeteryId(c.id)
              setSheetOpen(false)
            }}
          >
            <Text variant="bodyMd" color="ink">
              {c.name}
            </Text>
            <Text variant="bodySm" color="light">
              {c.cityName}
            </Text>
          </Pressable>
        ))}
      </BottomSheet>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  banner: { marginBottom: spacing.lg },
  field: { marginBottom: spacing.lg },
  dates: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  dateCol: { flex: 1 },
  sheetTitle: { marginBottom: spacing.md },
  cemeteryRow: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.linen,
  },
})
