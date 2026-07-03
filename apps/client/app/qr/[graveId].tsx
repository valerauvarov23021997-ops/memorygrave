import { Button, Card, useColors, useThemedStyles, type ThemeColors, spacing, Text, TopBar } from '@pamyat/ui'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Share, StyleSheet, View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useGrave } from '../../src/hooks/queries'

export default function QrScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const c = useColors()
  const styles = useThemedStyles(makeStyles)
  const { graveId } = useLocalSearchParams<{ graveId: string }>()
  const { data: grave } = useGrave(graveId ?? '')

  // Deep link открывает страницу памяти прямо в приложении (схема pamyat://).
  const url = `pamyat://grave/${graveId}`

  const onShare = async () => {
    try {
      await Share.share({ message: t('qr.shareMessage', { name: grave?.fullName ?? '', url }) })
    } catch {
      // пользователь мог закрыть окно шэринга — не ошибка
    }
  }

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
            <QRCode value={url} size={220} color={c.forest} backgroundColor={c.white} />
          </View>
        </Card>

        <Text variant="bodyMd" color="muted" center style={styles.hint}>
          {t('qr.hint')}
        </Text>

        <Button label={t('qr.share')} variant="secondary" onPress={() => void onShare()} fullWidth />
      </View>
    </View>
  )
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: c.cream },
  content: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xl, alignItems: 'center', gap: spacing.lg },
  qrCard: { alignItems: 'center', gap: spacing.lg },
  name: {},
  qrBox: { padding: spacing.sm, backgroundColor: c.white, borderRadius: 12 },
  hint: { maxWidth: 300 },
})
