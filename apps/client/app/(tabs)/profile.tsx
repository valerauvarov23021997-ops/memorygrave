import {
  Avatar,
  Button,
  Chip,
  Divider,
  Icon,
  SectionLabel,
  Skeleton,
  spacing,
  Text,
  typography,
  useColors,
  useTheme,
  useThemedStyles,
  useToast,
  type ThemeColors,
  type ThemeMode,
} from '@pamyat/ui'
import { formatDate } from '@pamyat/utils'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useProfile } from '../../src/hooks/queries'
import { useAuthActions } from '../../src/hooks/useAuthActions'

export default function ProfileScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const showToast = useToast()
  const c = useColors()
  const styles = useThemedStyles(makeStyles)
  const { mode, setMode } = useTheme()
  const { logout } = useAuthActions()
  const { data, isLoading } = useProfile()

  const onLogout = async () => {
    await logout()
    router.replace('/(auth)/phone')
  }

  const modes: { key: ThemeMode; label: string }[] = [
    { key: 'light', label: t('profile.themeLight') },
    { key: 'dark', label: t('profile.themeDark') },
    { key: 'system', label: t('profile.themeSystem') },
  ]

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl }]}
    >
      {isLoading || !data ? (
        <Skeleton width="100%" height={64} radius={10} />
      ) : (
        <View style={styles.userRow}>
          <Avatar name={data.name} size={40} imageUri={data.avatarUrl} />
          <View style={styles.userInfo}>
            <Text variant="headingLg" color="forest">
              {data.name}
            </Text>
            <Text variant="bodySm" color="muted">
              {data.phone}
            </Text>
          </View>
          <Pressable hitSlop={8}>
            <Icon name="edit" size={20} color={c.sage} />
          </Pressable>
        </View>
      )}

      {data ? (
        <LinearGradient
          colors={[c.forest, c.moss]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.subscription}
        >
          <Text style={styles.subLabel}>{t('profile.subscription').toUpperCase()}</Text>
          <Text variant="headingLg" color="cream">
            {data.subscription.planName}
          </Text>
          {data.subscription.validUntil ? (
            <Text style={styles.subValid}>
              {t('profile.validUntil', { date: formatDate(data.subscription.validUntil) })}
            </Text>
          ) : null}
          <View style={styles.manageBtn}>
            <Button label={t('profile.manage')} variant="secondary" onPress={() => router.push('/subscription')} />
          </View>
        </LinearGradient>
      ) : null}

      <SectionLabel>{t('profile.appearance')}</SectionLabel>
      <View style={styles.themeRow}>
        {modes.map(m => (
          <Chip key={m.key} label={m.label} active={mode === m.key} onPress={() => setMode(m.key)} />
        ))}
      </View>

      <SectionLabel>{t('profile.mine')}</SectionLabel>
      <ProfileRow icon="saved" label={t('profile.savedGraves')} onPress={() => router.push('/(tabs)/saved')} />
      <ProfileRow icon="bell" label={t('profile.memorialDates')} onPress={() => router.push('/reminders/grave-1')} />
      <ProfileRow icon="orders" label={t('profile.orderHistory')} onPress={() => router.push('/(tabs)/orders')} />

      <Divider />

      <SectionLabel>{t('profile.help')}</SectionLabel>
      <ProfileRow icon="support" label={t('profile.support')} onPress={() => showToast('t.me/pamyat_support', 'info')} />
      <ProfileRow icon="lock" label={t('profile.terms')} onPress={() => showToast(t('profile.terms'), 'info')} />

      <Button label={t('profile.logout')} variant="ghost" onPress={onLogout} />
    </ScrollView>
  )
}

function ProfileRow({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  const c = useColors()
  const styles = useThemedStyles(makeStyles)
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Icon name={icon} size={20} color={c.sage} />
      <Text variant="bodyMd" color="ink" style={styles.rowLabel}>
        {label}
      </Text>
      <Icon name="chevronRight" size={18} color={c.light} />
    </Pressable>
  )
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.cream },
    content: { paddingHorizontal: spacing.lg },
    userRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    userInfo: { flex: 1 },
    subscription: { borderRadius: 10, padding: spacing.md, marginVertical: spacing.lg, gap: 2 },
    subLabel: { ...typography.sectionLabel, color: c.sageL },
    subValid: { ...typography.bodySm, color: 'rgba(250,247,242,0.7)' },
    manageBtn: { alignSelf: 'flex-start', marginTop: spacing.sm },
    themeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minHeight: 48,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.linen,
    },
    rowLabel: { flex: 1 },
  })
