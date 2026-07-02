import { Button, Card, colors, spacing, Text, TopBar, useToast } from '@pamyat/ui'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useGrave } from '../../src/hooks/queries'

export default function QrScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const showToast = useToast()
  const { graveId } = useLocalSearchParams<{ graveId: string }>()
  const { data: grave } = useGrave(graveId ?? '')

  const url = `https://pamyat.app/g/${graveId}`

  return (
    <View style={styles.root}>
      <TopBar title={t('qr.title')} onBack={() => router.back()} />
      <View style={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Card padding="lg" style={styles.qrCard}>
          {grave ? (
            <Text variant="headingLg" color="forest" center style={styles.name}>
              {grave.fullName}
            </Text>
          ) : null}
          <View style={styles.qrBox}>
            <QRCode value={url} size={220} color={colors.forest} backgroundColor={colors.white} />
          </View>
        </Card>

        <Text variant="bodyMd" color="muted" center style={styles.hint}>
          {t('qr.hint')}
        </Text>

        <Button label={t('qr.save')} variant="secondary" onPress={() => showToast(t('qr.saved'), 'success')} fullWidth />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  content: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xl, alignItems: 'center', gap: spacing.lg },
  qrCard: { alignItems: 'center', gap: spacing.lg },
  name: {},
  qrBox: { padding: spacing.sm, backgroundColor: colors.white, borderRadius: 12 },
  hint: { maxWidth: 300 },
})
