import { profileApi, type PlanInfo, type SubscriptionPlan } from '@pamyat/api'
import { Badge, Button, Card, useColors, useThemedStyles, type ThemeColors, Icon, Skeleton, spacing, Text, TopBar, typography, useToast } from '@pamyat/ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { queryKeys, useProfile } from '../src/hooks/queries'

export default function SubscriptionScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const styles = useThemedStyles(makeStyles)
  const showToast = useToast()
  const qc = useQueryClient()
  const { data: profile } = useProfile()
  const { data: plans, isLoading } = useQuery({ queryKey: ['plans'], queryFn: () => profileApi.plans() })

  const change = useMutation({
    mutationFn: (plan: SubscriptionPlan) => profileApi.changePlan(plan),
    onSuccess: sub => {
      void qc.invalidateQueries({ queryKey: queryKeys.profile })
      showToast(t('subscription.changed', { plan: sub.planName }), 'success')
    },
  })

  const restore = async () => {
    await profileApi.restoreSubscription()
    showToast(t('subscription.restore'), 'success')
  }

  const currentPlan = profile?.subscription.plan

  return (
    <View style={styles.root}>
      <TopBar title={t('subscription.title')} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="bodyMd" color="muted" center style={styles.description}>
          {t('subscription.description')}
        </Text>

        {isLoading ? (
          <>
            <Skeleton width="100%" height={220} radius={12} />
            <View style={{ height: spacing.lg }} />
            <Skeleton width="100%" height={220} radius={12} />
          </>
        ) : (
          (plans ?? []).map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrent={plan.id === currentPlan}
              changing={change.isPending && change.variables === plan.id}
              onChoose={() => change.mutate(plan.id)}
            />
          ))
        )}

        <Button label={t('subscription.restore')} variant="ghost" onPress={restore} />
        <View style={{ height: insets.bottom + spacing.lg }} />
      </ScrollView>
    </View>
  )
}

function PlanCard({
  plan,
  isCurrent,
  changing,
  onChoose,
}: {
  plan: PlanInfo
  isCurrent: boolean
  changing: boolean
  onChoose: () => void
}) {
  const { t } = useTranslation()
  const c = useColors()
  const styles = useThemedStyles(makeStyles)
  const featured = plan.featured
  return (
    <View style={styles.planWrap}>
      {featured && !isCurrent ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{t('subscription.popular')}</Text>
        </View>
      ) : null}
      <Card variant={featured ? 'featured' : 'default'} padding="lg">
        <View style={styles.planHeader}>
          <Text variant="headingLg" color={featured ? 'cream' : 'forest'}>
            {plan.name}
          </Text>
          {isCurrent ? <Badge label={t('subscription.current')} variant="success" /> : null}
        </View>
        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: featured ? c.sageXL : c.forest }]}>{`${plan.price} ₽`}</Text>
        </View>
        <Text variant="bodySm" style={{ color: featured ? 'rgba(250,247,242,0.6)' : c.light }}>
          {plan.periodNote}
        </Text>
        <View style={styles.features}>
          {plan.features.map(f => (
            <View key={f} style={styles.feature}>
              <Icon name="checkCircle" size={16} color={featured ? c.sageL : c.sage} weight="fill" />
              <Text variant="bodySm" color={featured ? 'cream' : 'ink'} style={styles.featureText}>
                {f}
              </Text>
            </View>
          ))}
        </View>
        <Button
          label={isCurrent ? t('subscription.yourPlan') : t('subscription.choose')}
          variant={featured ? 'primary' : 'secondary'}
          onPress={onChoose}
          disabled={isCurrent}
          loading={changing}
          fullWidth
        />
      </Card>
    </View>
  )
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: c.cream },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  description: { maxWidth: 280, alignSelf: 'center', marginBottom: spacing.xl },
  planWrap: { marginBottom: spacing.lg, paddingTop: spacing.sm },
  badge: {
    position: 'absolute',
    top: -6,
    alignSelf: 'center',
    zIndex: 1,
    backgroundColor: c.sage,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  badgeText: { ...typography.caption, color: c.white, fontFamily: 'DMSans_500Medium' },
  planHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceRow: { marginTop: spacing.sm },
  price: { ...typography.priceDisplay },
  features: { marginVertical: spacing.md, gap: spacing.sm },
  feature: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  featureText: { flex: 1 },
})
