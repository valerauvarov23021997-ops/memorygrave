import { profileApi } from '@pamyat/api'
import {
  Avatar,
  BottomSheet,
  Button,
  Divider,
  Icon,
  Input,
  radii,
  SectionLabel,
  Skeleton,
  spacing,
  Text,
  typography,
  useColors,
  useThemedStyles,
  useToast,
  type ThemeColors,
} from '@pamyat/ui'
import { formatDate } from '@pamyat/utils'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { queryKeys, useProfile } from '../../src/hooks/queries'
import { useAuthActions } from '../../src/hooks/useAuthActions'
import { links } from '../../src/lib/links'

export default function ProfileScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const showToast = useToast()
  const c = useColors()
  const styles = useThemedStyles(makeStyles)
  const qc = useQueryClient()
  const { logout } = useAuthActions()
  const { data, isLoading } = useProfile()

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)

  const save = useMutation({
    mutationFn: () => profileApi.update({ name: name.trim(), avatarUrl: avatar ?? undefined }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.profile })
      showToast(t('profile.saved'), 'success')
      setEditing(false)
    },
  })

  const openEdit = () => {
    setName(data?.name ?? '')
    setAvatar(data?.avatarUrl ?? null)
    setEditing(true)
  }

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) return
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsEditing: true, aspect: [1, 1] })
    if (!result.canceled && result.assets[0]) setAvatar(result.assets[0].uri)
  }

  const onLogout = async () => {
    await logout()
    router.replace('/(auth)/phone')
  }

  const openLink = async (url: string) => {
    try {
      await Linking.openURL(url)
    } catch {
      showToast(t('profile.linkError'), 'error')
    }
  }

  return (
    <View style={styles.root}>
    <ScrollView
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl }]}
    >
      {isLoading || !data ? (
        <Skeleton width="100%" height={64} radius={10} />
      ) : (
        <Pressable style={styles.userRow} onPress={openEdit}>
          <Avatar name={data.name} size={40} imageUri={data.avatarUrl} />
          <View style={styles.userInfo}>
            <Text variant="headingLg" color="forest">
              {data.name}
            </Text>
            <Text variant="bodySm" color="muted">
              {data.phone}
            </Text>
          </View>
          <View style={styles.editIcon}>
            <Icon name="edit" size={20} color={c.sage} />
          </View>
        </Pressable>
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
            <Button label={t('profile.manage')} variant="light" onPress={() => router.push('/subscription')} />
          </View>
        </LinearGradient>
      ) : null}

      <SectionLabel>{t('profile.mine')}</SectionLabel>
      <ProfileRow icon="saved" label={t('profile.savedGraves')} onPress={() => router.push('/(tabs)/saved')} />
      <ProfileRow icon="bell" label={t('profile.memorialDates')} onPress={() => router.push('/dates')} />
      <ProfileRow icon="orders" label={t('profile.orderHistory')} onPress={() => router.push('/(tabs)/orders')} />

      <Divider />

      <SectionLabel>{t('profile.help')}</SectionLabel>
      <ProfileRow icon="support" label={t('profile.support')} onPress={() => openLink(links.support)} />
      <ProfileRow icon="lock" label={t('profile.terms')} onPress={() => openLink(links.terms)} />
      <ProfileRow icon="lock" label={t('profile.privacy')} onPress={() => openLink(links.privacy)} />

      <Button label={t('profile.logout')} variant="ghost" onPress={onLogout} />
    </ScrollView>

      <BottomSheet visible={editing} onClose={() => setEditing(false)}>
        <Text variant="headingLg" color="forest" style={styles.editTitle}>
          {t('profile.editTitle')}
        </Text>
        <Pressable style={styles.avatarEdit} onPress={pickAvatar}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatarImg} contentFit="cover" />
          ) : (
            <Avatar name={name || ' '} size={72} />
          )}
          <Text variant="bodySm" color="sage" style={styles.changePhoto}>
            {t('profile.changePhoto')}
          </Text>
        </Pressable>
        <View style={styles.editField}>
          <Input label={t('profile.name')} value={name} onChangeText={setName} placeholder={t('profile.namePlaceholder')} />
        </View>
        <Button
          label={t('profile.saveProfile')}
          onPress={() => save.mutate()}
          disabled={name.trim().length === 0}
          loading={save.isPending}
          fullWidth
        />
      </BottomSheet>
    </View>
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
    userRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 48 },
    userInfo: { flex: 1 },
    editIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    subscription: { borderRadius: radii.lg, padding: spacing.md, marginVertical: spacing.lg, gap: 2 },
    subLabel: { ...typography.sectionLabel, color: c.sageL },
    subValid: { ...typography.bodySm, color: 'rgba(250,247,242,0.7)' },
    manageBtn: { alignSelf: 'flex-start', marginTop: spacing.sm },
    editTitle: { marginBottom: spacing.md },
    avatarEdit: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
    avatarImg: { width: 72, height: 72, borderRadius: 36 },
    changePhoto: {},
    editField: { marginBottom: spacing.md },
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
