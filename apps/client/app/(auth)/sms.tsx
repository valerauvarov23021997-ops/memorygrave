import { Button, Card, useThemedStyles, type ThemeColors, haptics, spacing, Text, TopBar, typography, useToast } from '@pamyat/ui'
import { formatPhoneMask } from '@pamyat/utils'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useAuthActions } from '../../src/hooks/useAuthActions'

const CODE_LENGTH = 6
const RESEND_SECONDS = 60

export default function SmsScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const styles = useThemedStyles(makeStyles)
  const showToast = useToast()
  const { verifyCode, sendCode } = useAuthActions()
  const { phone } = useLocalSearchParams<{ phone: string }>()

  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [seconds, setSeconds] = useState(RESEND_SECONDS)
  const inputRef = useRef<TextInput>(null)

  useEffect(() => {
    if (seconds <= 0) return
    const id = setTimeout(() => setSeconds(s => s - 1), 1000)
    return () => clearTimeout(id)
  }, [seconds])

  useEffect(() => {
    if (code.length === CODE_LENGTH) void submit(code)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  const submit = async (value: string) => {
    if (!phone) return
    setLoading(true)
    setError(false)
    try {
      await verifyCode(phone, value)
      haptics.success()
      router.replace('/(tabs)')
    } catch {
      haptics.error()
      setError(true)
      setCode('')
      showToast(t('auth.wrongCode'), 'error')
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    if (!phone || seconds > 0) return
    await sendCode(phone)
    setSeconds(RESEND_SECONDS)
  }

  const timeStr = `0:${String(seconds).padStart(2, '0')}`

  return (
    <View style={styles.root}>
      <TopBar onBack={() => router.back()} />
      <View style={styles.content}>
        <Text variant="displayMd" color="forest">
          {t('auth.smsTitle')}
        </Text>
        <Text variant="bodyMd" color="muted" style={styles.subtitle}>
          {t('auth.smsSubtitle', { phone: formatPhoneMask(phone ?? '') })}
        </Text>

        <View style={styles.cells}>
          {Array.from({ length: CODE_LENGTH }).map((_, i) => {
            const char = code[i] ?? ''
            const active = i === code.length
            return (
              <View
                key={i}
                style={[
                  styles.cell,
                  char ? styles.cellFilled : null,
                  active && !error ? styles.cellActive : null,
                  error ? styles.cellError : null,
                ]}
              >
                <Text style={styles.cellText}>{char}</Text>
              </View>
            )
          })}
          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={text => setCode(text.replace(/\D/g, '').slice(0, CODE_LENGTH))}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoFocus
            editable={!loading}
            maxLength={CODE_LENGTH}
            style={styles.hiddenInput}
          />
        </View>

        {seconds > 0 ? (
          <Text variant="bodyMd" color="muted" style={styles.timer}>
            {t('auth.resendIn', { time: timeStr })}
          </Text>
        ) : (
          <Button label={t('auth.resend')} variant="ghost" onPress={resend} />
        )}

        <Button label={t('auth.changeNumber')} variant="ghost" onPress={() => router.back()} />

        <Card variant="success" padding="md" style={styles.hint}>
          <Text variant="bodySm" color="success">
            {t('auth.autofillHint')}
          </Text>
        </Card>
      </View>

      <View style={{ height: insets.bottom }} />
    </View>
  )
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: c.cream },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  subtitle: { marginTop: spacing.sm },
  cells: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xl },
  cell: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: c.parchment,
    borderWidth: 1,
    borderColor: c.linen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellActive: { backgroundColor: c.white, borderWidth: 1.5, borderColor: c.sage },
  cellFilled: { backgroundColor: c.successBg, borderColor: c.sage },
  cellError: { backgroundColor: c.errorBg, borderColor: c.error },
  cellText: { ...typography.headingLg, color: c.forest },
  hiddenInput: { position: 'absolute', width: 1, height: 1, opacity: 0 },
  timer: { marginTop: spacing.lg, textAlign: 'center' },
  hint: { marginTop: spacing.xl },
})
