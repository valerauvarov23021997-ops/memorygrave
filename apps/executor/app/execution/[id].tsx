import { executorApi } from '@pamyat/api'
import { Button, Card, colors, Icon, SectionLabel, Skeleton, spacing, Text, Toggle, TopBar, useToast } from '@pamyat/ui'
import * as ImagePicker from 'expo-image-picker'
import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useExecutorOrder } from '../../src/hooks/queries'

type Step = 'details' | 'before' | 'work' | 'after' | 'done'
const MIN_PHOTOS = 2

export default function ExecutionScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const showToast = useToast()
  const { id } = useLocalSearchParams<{ id: string }>()
  const orderId = id ?? ''
  const { data: order, isLoading } = useExecutorOrder(orderId)

  const [step, setStep] = useState<Step>('details')
  const [before, setBefore] = useState<string[]>([])
  const [after, setAfter] = useState<string[]>([])
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState(false)

  if (isLoading || !order) {
    return (
      <View style={styles.root}>
        <TopBar title={t('execution.title')} onBack={() => router.back()} />
        <View style={styles.loading}>
          <Skeleton width="100%" height={120} radius={10} />
        </View>
      </View>
    )
  }

  const allChecked = order.executionSteps.every(s => checked[s])

  const openNavigator = () => {
    const c = order.coordinates
    const url = c
      ? Platform.select({
          ios: `http://maps.apple.com/?daddr=${c.latitude},${c.longitude}`,
          android: `geo:0,0?q=${c.latitude},${c.longitude}(${encodeURIComponent(order.cemeteryName)})`,
          default: `https://maps.google.com/?q=${c.latitude},${c.longitude}`,
        })
      : `https://maps.google.com/?q=${encodeURIComponent(order.address)}`
    void Linking.openURL(url as string)
  }

  const arrive = async () => {
    setBusy(true)
    try {
      await executorApi.arrive(orderId)
      setStep('before')
    } finally {
      setBusy(false)
    }
  }

  const pickPhoto = async (type: 'before' | 'after') => {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) {
      showToast(t('execution.photoHint'), 'error')
      return
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: false })
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri
      if (type === 'before') setBefore(prev => [...prev, uri])
      else setAfter(prev => [...prev, uri])
    }
  }

  const submitBefore = async () => {
    setBusy(true)
    try {
      await executorApi.uploadBefore(orderId, before)
      setStep('work')
    } finally {
      setBusy(false)
    }
  }

  const submitAfter = async () => {
    setBusy(true)
    try {
      await executorApi.uploadAfter(orderId, after)
      setStep('done')
    } finally {
      setBusy(false)
    }
  }

  const complete = async () => {
    setBusy(true)
    try {
      await executorApi.complete(orderId)
      showToast(t('execution.completed'), 'success')
      router.replace('/(tabs)')
    } finally {
      setBusy(false)
    }
  }

  return (
    <View style={styles.root}>
      <TopBar title={stepTitle(step, t)} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <StepIndicator step={step} />

        {step === 'details' ? (
          <View style={styles.section}>
            <Card variant="surface" padding="md">
              <Text variant="headingMd" color="ink">
                {order.serviceName}
              </Text>
              <Text variant="bodySm" color="muted">
                {`${order.cemeteryName}${order.plot ? ` · ${order.plot}` : ''}`}
              </Text>
              <Text variant="bodySm" color="light" style={styles.address}>
                {order.address}
              </Text>
            </Card>
            {order.notes ? (
              <>
                <SectionLabel>{t('execution.client')}</SectionLabel>
                <Text variant="bodyMd" color="ink">
                  {order.notes}
                </Text>
              </>
            ) : null}
            <Button label={t('execution.openNav')} variant="secondary" onPress={openNavigator} fullWidth />
            <Button label={t('execution.arrived')} onPress={arrive} loading={busy} fullWidth />
          </View>
        ) : null}

        {step === 'before' ? (
          <PhotoStep
            photos={before}
            onAdd={() => pickPhoto('before')}
            onSubmit={submitBefore}
            busy={busy}
            hint={t('execution.photoHint')}
            addLabel={t('execution.addPhoto')}
            countLabel={t('execution.photosCount', { count: before.length })}
            submitLabel={t('common.continue')}
          />
        ) : null}

        {step === 'work' ? (
          <View style={styles.section}>
            <SectionLabel>{t('execution.checklist')}</SectionLabel>
            {order.executionSteps.map(s => (
              <View key={s} style={styles.checkRow}>
                <Text variant="bodyMd" color="ink" style={styles.checkLabel}>
                  {s}
                </Text>
                <Toggle value={!!checked[s]} onValueChange={v => setChecked(prev => ({ ...prev, [s]: v }))} />
              </View>
            ))}
            <Button label={t('execution.finishWork')} onPress={() => setStep('after')} disabled={!allChecked} fullWidth />
          </View>
        ) : null}

        {step === 'after' ? (
          <PhotoStep
            photos={after}
            onAdd={() => pickPhoto('after')}
            onSubmit={submitAfter}
            busy={busy}
            hint={t('execution.photoHint')}
            addLabel={t('execution.addPhoto')}
            countLabel={t('execution.photosCount', { count: after.length })}
            submitLabel={t('common.continue')}
          />
        ) : null}

        {step === 'done' ? (
          <View style={styles.section}>
            <Card variant="success" padding="lg">
              <View style={styles.doneRow}>
                <Icon name="checkCircle" size={28} color={colors.success} weight="fill" />
                <Text variant="headingLg" color="success">
                  {order.serviceName}
                </Text>
              </View>
            </Card>
            <Button label={t('execution.complete')} onPress={complete} loading={busy} fullWidth />
          </View>
        ) : null}

        <View style={{ height: insets.bottom + spacing.lg }} />
      </ScrollView>
    </View>
  )
}

function PhotoStep({
  photos,
  onAdd,
  onSubmit,
  busy,
  hint,
  addLabel,
  countLabel,
  submitLabel,
}: {
  photos: string[]
  onAdd: () => void
  onSubmit: () => void
  busy: boolean
  hint: string
  addLabel: string
  countLabel: string
  submitLabel: string
}) {
  return (
    <View style={styles.section}>
      <Text variant="bodySm" color="muted">
        {hint}
      </Text>
      <View style={styles.grid}>
        {photos.map((uri, i) => (
          <Image key={i} source={{ uri }} style={styles.photo} contentFit="cover" />
        ))}
        <Pressable style={styles.addPhoto} onPress={onAdd}>
          <Icon name="camera" size={24} color={colors.sage} />
        </Pressable>
      </View>
      <Text variant="bodySm" color="light">
        {countLabel}
      </Text>
      <Button label={submitLabel} onPress={onSubmit} disabled={photos.length < MIN_PHOTOS} loading={busy} fullWidth />
    </View>
  )
}

function StepIndicator({ step }: { step: Step }) {
  const order: Step[] = ['details', 'before', 'work', 'after', 'done']
  const current = order.indexOf(step)
  return (
    <View style={styles.indicator}>
      {order.map((s, i) => (
        <View
          key={s}
          style={[styles.segment, { backgroundColor: i <= current ? colors.forest : colors.linen }]}
        />
      ))}
    </View>
  )
}

function stepTitle(step: Step, t: (k: string) => string): string {
  const map: Record<Step, string> = {
    details: t('execution.stepDetails'),
    before: t('execution.stepBefore'),
    work: t('execution.stepWork'),
    after: t('execution.stepAfter'),
    done: t('execution.stepDone'),
  }
  return map[step]
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  loading: { padding: spacing.lg },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  indicator: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.lg },
  segment: { flex: 1, height: 3, borderRadius: 2 },
  section: { gap: spacing.md },
  address: { marginTop: spacing.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  photo: { width: 100, height: 100, borderRadius: 8 },
  addPhoto: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.stone,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.parchment,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.linen,
  },
  checkLabel: { flex: 1 },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
})
