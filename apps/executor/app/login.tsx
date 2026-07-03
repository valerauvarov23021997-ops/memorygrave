import { authApi, tokenStorage } from '@pamyat/api'
import { Button, colors, FlameLogo, Input, spacing, Text, TopBar, useToast } from '@pamyat/ui'
import { formatPhoneMask, isPhoneComplete, normalizePhoneDigits, toE164 } from '@pamyat/utils'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'

export default function LoginScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const showToast = useToast()
  const [digits, setDigits] = useState('')
  const [loading, setLoading] = useState(false)

  const onLogin = async () => {
    if (!isPhoneComplete(digits)) return
    setLoading(true)
    try {
      // В мок-режиме код не требуется — сразу авторизуем исполнителя.
      await authApi.sendCode(toE164(digits))
      const tokens = await authApi.verifyCode(toE164(digits), '000000')
      await tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken)
      router.replace('/(tabs)')
    } catch {
      showToast(t('common.error'), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.root}>
      <TopBar />
      <View style={styles.content}>
        <View style={styles.brand}>
          <FlameLogo size={84} />
        </View>
        <Text variant="displayMd" color="forest" center>
          {t('auth.title')}
        </Text>
        <Text variant="bodyMd" color="muted" center style={styles.subtitle}>
          {t('auth.subtitle')}
        </Text>
        <View style={styles.field}>
          <Input
            value={formatPhoneMask(digits)}
            onChangeText={text => setDigits(normalizePhoneDigits(text))}
            placeholder={t('auth.phonePlaceholder')}
            keyboardType="phone-pad"
            autoFocus
            leftElement={<Text style={styles.flag}>🇷🇺</Text>}
          />
        </View>
        <Button label={t('auth.getCode')} onPress={onLogin} disabled={!isPhoneComplete(digits)} loading={loading} fullWidth />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  brand: { alignItems: 'center', marginBottom: spacing.lg },
  subtitle: { marginTop: spacing.sm },
  field: { marginTop: spacing.xl, marginBottom: spacing.lg },
  flag: { fontSize: 18, marginRight: spacing.sm },
})
