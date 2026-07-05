import { config } from '@pamyat/api'
import { Button, Card, radii, useThemedStyles, type ThemeColors, haptics, spacing, Text, TopBar, typography, useToast } from '@pamyat/ui'
import { formatPhoneMask } from '@pamyat/utils'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, Pressable, StyleSheet, TextInput, View } from 'react-native'
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
  const { phone, tg, tgs } = useLocalSearchParams<{ phone: string; tg?: string; tgs?: string }>()

  // Вход через Telegram-бота. Токен — нужен первый Start;
  // sent — чат уже связан и код улетел автоматически.
  const [tgToken, setTgToken] = useState(tg ?? '')
  const [tgSent, setTgSent] = useState(tgs === '1')
  const viaTelegram = Boolean(config.tgBot && (tgToken || tgSent))

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
    const res = await sendCode(phone)
    setTgToken(res.tgToken ?? '')
    setTgSent(Boolean(res.tgSent))
    setSeconds(RESEND_SECONDS)
  }

  const openTelegram = () => {
    // связанный чат — просто открываем Telegram; первый раз — Start-ссылка бота
    const url = tgSent ? 'https://t.me' : `https://t.me/${config.tgBot}?start=${tgToken}`
    void Linking.openURL(url)
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
          {tgSent
            ? t('auth.tgSentSubtitle')
            : viaTelegram
              ? t('auth.tgSubtitle', { phone: formatPhoneMask(phone ?? '') })
              : t('auth.smsSubtitle', { phone: formatPhoneMask(phone ?? '') })}
        </Text>

        {viaTelegram ? (
          <Pressable style={styles.tgButton} onPress={openTelegram}>
            <Text style={styles.tgLabel}>{tgSent ? t('auth.tgOpen') : t('auth.tgButton')}</Text>
          </Pressable>
        ) : null}

        <Pressable style={styles.cells} onPress={() => inputRef.current?.focus()}>
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
        </Pressable>

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
            {tgSent ? t('auth.tgSentHint') : viaTelegram ? t('auth.tgHint') : t('auth.autofillHint')}
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
  // фирменная кнопка Telegram: цвет мессенджера, высота как у Button
  tgButton: {
    marginTop: spacing.lg,
    height: 52,
    borderRadius: radii.full,
    backgroundColor: '#2AABEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tgLabel: { ...typography.headingMd, color: c.white },
  cells: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xl },
  cell: {
    flex: 1,
    height: 48,
    borderRadius: radii.md,
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
