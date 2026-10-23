import { authApi, config, executorApi } from '@pamyat/api'
import { Button, colors, FlameLogo, Input, spacing, Text, TopBar, useToast } from '@pamyat/ui'
import { formatPhoneMask, isPhoneComplete, normalizePhoneDigits, toE164 } from '@pamyat/utils'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, StyleSheet, View } from 'react-native'

const CODE_LENGTH = 6

export default function LoginScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const showToast = useToast()
  const [digits, setDigits] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  // токен для Start-ссылки бота; пусто — бот уже знает этот номер и прислал код сам
  const [tgToken, setTgToken] = useState('')
  const [loading, setLoading] = useState(false)

  const requestCode = async () => {
    if (!isPhoneComplete(digits)) return
    setLoading(true)
    try {
      const res = await authApi.sendCode(toE164(digits))
      setTgToken(res.tgToken ?? '')
      setCode('')
      setStep('code')
    } catch {
      showToast(t('common.error'), 'error')
    } finally {
      setLoading(false)
    }
  }

  const openTelegram = () => {
    const url = tgToken ? `https://t.me/${config.tgBot}?start=${tgToken}` : 'https://t.me'
    void Linking.openURL(url)
  }

  const verify = async () => {
    setLoading(true)
    try {
      await executorApi.claim(toE164(digits), code)
      router.replace('/(tabs)')
    } catch (e) {
      const notExecutor = e instanceof Error && e.message === 'not_executor'
      showToast(notExecutor ? t('auth.notExecutor') : t('auth.badCode'), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.root}>
      <TopBar
        onBack={
          step === 'code'
            ? () => {
                setStep('phone')
              }
            : undefined
        }
      />
      <View style={styles.content}>
        <View style={styles.brand}>
          <FlameLogo size={84} />
        </View>
        <Text variant="displayMd" color="forest" center>
          {t('auth.title')}
        </Text>
        <Text variant="bodyMd" color="muted" center style={styles.subtitle}>
          {step === 'phone' ? t('auth.subtitle') : t('auth.codeSubtitle')}
        </Text>

        {step === 'phone' ? (
          <>
            <View style={styles.field}>
              <Input
                value={formatPhoneMask(digits)}
                onChangeText={text => {
                  setDigits(normalizePhoneDigits(text))
                }}
                placeholder={t('auth.phonePlaceholder')}
                keyboardType="phone-pad"
                autoFocus
                leftElement={<Text style={styles.flag}>🇷🇺</Text>}
              />
            </View>
            <Button
              label={t('auth.getCode')}
              onPress={requestCode}
              disabled={!isPhoneComplete(digits)}
              loading={loading}
              fullWidth
            />
          </>
        ) : (
          <>
            {config.tgBot ? (
              <View style={styles.tg}>
                <Button
                  label={tgToken ? t('auth.tgButton') : t('auth.tgOpen')}
                  variant="secondary"
                  onPress={openTelegram}
                  fullWidth
                />
              </View>
            ) : null}
            <View style={styles.field}>
              <Input
                value={code}
                onChangeText={text => {
                  setCode(text.replace(/\D/g, '').slice(0, CODE_LENGTH))
                }}
                placeholder={t('auth.codePlaceholder')}
                keyboardType="number-pad"
                autoFocus
              />
            </View>
            <Button
              label={t('auth.verify')}
              onPress={verify}
              disabled={code.length < CODE_LENGTH}
              loading={loading}
              fullWidth
            />
          </>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  brand: { alignItems: 'center', marginBottom: spacing.lg },
  subtitle: { marginTop: spacing.sm },
  tg: { marginTop: spacing.xl },
  field: { marginTop: spacing.lg, marginBottom: spacing.lg },
  flag: { fontSize: 18, marginRight: spacing.sm },
})
