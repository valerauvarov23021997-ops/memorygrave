import { membersApi, type Member, type MemberRole } from '@pamyat/api'
import { Avatar, Badge, Button, Card, useColors, useThemedStyles, type ThemeColors, Icon, SectionLabel, Skeleton, spacing, Text, TopBar } from '@pamyat/ui'
import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, Share, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function InviteScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const c = useColors()
  const styles = useThemedStyles(makeStyles)
  const { graveId } = useLocalSearchParams<{ graveId: string }>()
  const [inviting, setInviting] = useState(false)

  const { data: members, isLoading } = useQuery({
    queryKey: ['members', graveId],
    queryFn: () => membersApi.list(graveId ?? ''),
  })

  const onInvite = async () => {
    setInviting(true)
    try {
      const { url } = await membersApi.inviteLink(graveId ?? '')
      await Share.share({ message: `Присоединяйтесь к странице памяти в приложении «Память»: ${url}`, url })
    } catch {
      // пользователь мог закрыть окно шэринга — не ошибка
    } finally {
      setInviting(false)
    }
  }

  return (
    <View style={styles.root}>
      <TopBar title={t('invite.title')} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card variant="surface" padding="lg" style={styles.hero}>
          <Icon name="saved" size={28} color={c.sage} />
          <Text variant="bodyMd" color="muted" center style={styles.heroText}>
            {t('invite.subtitle')}
          </Text>
        </Card>

        <SectionLabel>{t('invite.members')}</SectionLabel>
        {isLoading ? (
          <Skeleton width="100%" height={64} radius={12} />
        ) : (
          members?.map(m => <MemberRow key={m.id} member={m} />)
        )}

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
          <Button label={t('invite.inviteBtn')} onPress={onInvite} loading={inviting} fullWidth />
        </View>
      </ScrollView>
    </View>
  )
}

function MemberRow({ member }: { member: Member }) {
  const { t } = useTranslation()
  const styles = useThemedStyles(makeStyles)
  const role = roleBadge(member.role, t)
  return (
    <Card padding="md" style={styles.row}>
      <View style={styles.rowInner}>
        <Avatar name={member.name} size={40} imageUri={member.avatarUrl} />
        <Text variant="headingMd" color="ink" style={styles.name}>
          {member.name}
        </Text>
        <Badge label={role.label} variant={role.variant} />
      </View>
    </Card>
  )
}

function roleBadge(role: MemberRole, t: (k: string) => string) {
  switch (role) {
    case 'owner':
      return { label: t('invite.roleOwner'), variant: 'success' as const }
    case 'editor':
      return { label: t('invite.roleEditor'), variant: 'info' as const }
    case 'viewer':
    default:
      return { label: t('invite.roleViewer'), variant: 'neutral' as const }
  }
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: c.cream },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  hero: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  heroText: { maxWidth: 260 },
  row: { marginBottom: spacing.sm },
  rowInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  name: { flex: 1 },
  footer: { marginTop: spacing.lg },
})
