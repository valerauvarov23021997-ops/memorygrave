import type { AppNotification, NotificationType } from '@pamyat/api'
import { notificationsApi } from '@pamyat/api'
import { AnimatedListItem, EmptyState, Icon, spacing, Text, TopBar, useColors, useThemedStyles, type ThemeColors } from '@pamyat/ui'
import { pluralDays } from '@pamyat/utils'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, Pressable, StyleSheet, View } from 'react-native'

/** Сколько времени прошло, по-человечески: «сегодня», «вчера», «5 дней назад». */
function timeAgo(iso: string, t: (k: string, o?: Record<string, unknown>) => string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days <= 0) return t('notifications.today')
  if (days === 1) return t('notifications.yesterday')
  return t('notifications.daysAgo', { value: pluralDays(days) })
}

const typeIcon: Record<NotificationType, string> = {
  order: 'orders',
  date: 'bell',
  candle: 'candle',
  system: 'Sparkle',
}

export default function NotificationsScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const styles = useThemedStyles(makeStyles)
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['notifications'], queryFn: () => notificationsApi.list() })

  // Открыли центр — помечаем всё прочитанным (бейдж на колокольчике гаснет).
  useEffect(() => {
    return () => {
      void notificationsApi.markAllRead().then(() => {
        void qc.invalidateQueries({ queryKey: ['notifications'] })
      })
    }
  }, [qc])

  const onOpen = (n: AppNotification) => {
    if (n.orderId) router.push(`/order/${n.orderId}`)
    else if (n.graveId) router.push(`/grave/${n.graveId}`)
  }

  return (
    <View style={styles.root}>
      <TopBar title={t('notifications.title')} onBack={() => router.back()} />
      {!isLoading && (data?.length ?? 0) === 0 ? (
        <EmptyState icon="bell" title={t('notifications.empty')} subtitle={t('notifications.emptyHint')} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={n => n.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <AnimatedListItem index={index}>
              <NotificationRow notification={item} onPress={() => onOpen(item)} />
            </AnimatedListItem>
          )}
        />
      )}
    </View>
  )
}

function NotificationRow({ notification, onPress }: { notification: AppNotification; onPress: () => void }) {
  const { t } = useTranslation()
  const c = useColors()
  const styles = useThemedStyles(makeStyles)
  const tappable = !!notification.orderId || !!notification.graveId
  return (
    <Pressable style={styles.row} onPress={tappable ? onPress : undefined}>
      <View style={[styles.iconWrap, !notification.isRead && styles.iconUnread]}>
        <Icon name={typeIcon[notification.type]} size={18} color={notification.isRead ? c.muted : c.sage} />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text
            variant="bodyMd"
            color="ink"
            style={!notification.isRead ? styles.titleUnread : undefined}
            numberOfLines={1}
          >
            {notification.title}
          </Text>
          {!notification.isRead ? <View style={styles.dot} /> : null}
        </View>
        <Text variant="bodySm" color="muted" numberOfLines={2}>
          {notification.body}
        </Text>
        <Text variant="caption" color="light" style={styles.time}>
          {timeAgo(notification.createdAt, t)}
        </Text>
      </View>
      {tappable ? <Icon name="chevronRight" size={16} color={c.light} /> : null}
    </Pressable>
  )
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.cream },
    list: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.linen,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.parchment,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconUnread: { backgroundColor: c.successBg },
    body: { flex: 1 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    titleUnread: { fontFamily: 'DMSans_500Medium' },
    dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: c.sage },
    time: { marginTop: 2 },
  })
