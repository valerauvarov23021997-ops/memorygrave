import { Button, useColors, useThemedStyles, type ThemeColors, Divider, Icon, Input, spacing, Text, TopBar, typography } from '@pamyat/ui'
import { formatPhoneMask, isPhoneComplete, normalizePhoneDigits } from '@pamyat/utils'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useToast } from '@pamyat/ui'
import { useAuthActions } from '../../src/hooks/useAuthActions'

export default function PhoneScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const c = useColors()
  const styles = useThemedStyles(makeStyles)
  const showToast = useToast()
  const { sendCode } = useAuthActions()

  const [digits, setDigits] = useState('')
  const [loading, setLoading] = useState(false)
  const complete = isPhoneComplete(digits)

  const onSubmit = async () => {
    if (!complete) return
    setLoading(true)
    try {
      await sendCode(digits)
      router.push({ pathname: '/(auth)/sms', params: { phone: digits } })
    } catch {
      showToast(t('auth.codeSendError'), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.root}>
      <TopBar />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
      >
        <Text variant="displayMd" color="forest">
          {t('auth.title')}
        </Text>
        <Text variant="bodyMd" color="muted" style={styles.subtitle}>
          {t('auth.subtitle')}
        </Text>

        <View style={styles.field}>
          <Input
            value={formatPhoneMask(digits)}
            onChangeText={text => setDigits(normalizePhoneDigits(text))}
            placeholder="+7 (___) ___-__-__"
            keyboardType="phone-pad"
            autoFocus
            leftElement={<Text style={styles.flag}>🇷🇺</Text>}
          />
        </View>

        <Button
          label={t('auth.getCode')}
          onPress={onSubmit}
          disabled={!complete}
          loading={loading}
          fullWidth
        />

        <View style={styles.dividerRow}>
          <View style={styles.line} />
          <Text variant="bodySm" color="light" style={styles.orText}>
            {t('auth.orVia')}
          </Text>
          <View style={styles.line} />
        </View>

        <View style={styles.socials}>
          <Pressable style={[styles.social, styles.apple]}>
            <Icon name="User" size={20} color={c.white} />
            <Text style={styles.appleLabel}>{t('auth.apple')}</Text>
          </Pressable>
          <Pressable style={[styles.social, styles.google]}>
            <Text style={styles.googleG}>G</Text>
            <Text variant="bodyMd" color="ink">
              {t('auth.google')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Divider />
        <Text variant="caption" color="light" center>
          {t('auth.disclaimer')}
        </Text>
      </View>
    </View>
  )
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: c.cream },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  subtitle: { marginTop: spacing.sm },
  field: { marginTop: spacing.xl, marginBottom: spacing.lg },
  flag: { fontSize: 18, marginRight: spacing.sm },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.xl },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: c.linen },
  orText: { marginHorizontal: spacing.md },
  socials: { flexDirection: 'row', gap: spacing.md },
  social: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: c.linen,
  },
  apple: { backgroundColor: c.ink, borderColor: c.ink },
  appleLabel: { ...typography.bodyMd, color: c.white },
  google: { backgroundColor: c.white },
  googleG: { ...typography.headingMd, color: c.info },
  footer: { paddingHorizontal: spacing.lg },
})
