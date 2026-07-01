import { profileApi } from '@pamyat/api'
import { Button, Card, colors, Icon, spacing, Text, TopBar, typography, useToast } from '@pamyat/ui'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface Plan {
  id: string
  name: string
  price: string
  period: string
  features: string[]
  featured: boolean
  badge?: string
}

export default function SubscriptionScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const showToast = useToast()

  const plans: Plan[] = [
    {
      id: 'basic',
      name: 'Базовый',
      price: '0',
      period: t('subscription.forever'),
      features: ['Поиск захоронений', 'Разовые заказы и фотоотчёты'],
      featured: false,
    },
    {
      id: 'standard',
      name: 'Стандарт',
      price: '299',
      period: `${t('subscription.perMonth')} · до 3 захоронений`,
      features: ['Всё из базового', 'Напоминания о датах', 'Автозаказ к годовщинам', 'Приоритетные исполнители'],
      featured: true,
      badge: t('subscription.popular'),
    },
    {
      id: 'premium',
      name: 'Премиум',
      price: '699',
      period: `${t('subscription.perMonth')} · без ограничений`,
      features: ['Всё из стандарта', 'Персональный менеджер', 'Скидка 15% на услуги'],
      featured: false,
    },
  ]

  const restore = async () => {
    await profileApi.restoreSubscription()
    showToast(t('subscription.restore'), 'success')
  }

  return (
    <View style={styles.root}>
      <TopBar title={t('subscription.title')} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="bodyMd" color="muted" center style={styles.description}>
          {t('subscription.description')}
        </Text>

        {plans.map(plan => (
          <PlanCard key={plan.id} plan={plan} onChoose={() => showToast(`${t('subscription.choose')}: ${plan.name}`, 'success')} />
        ))}

        <Button label={t('subscription.restore')} variant="ghost" onPress={restore} />
        <View style={{ height: insets.bottom + spacing.lg }} />
      </ScrollView>
    </View>
  )
}

function PlanCard({ plan, onChoose }: { plan: Plan; onChoose: () => void }) {
  const { t } = useTranslation()
  const featured = plan.featured
  return (
    <View style={styles.planWrap}>
      {plan.badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{plan.badge}</Text>
        </View>
      ) : null}
      <Card variant={featured ? 'featured' : 'default'} padding="lg">
        <Text variant="headingLg" color={featured ? 'cream' : 'forest'}>
          {plan.name}
        </Text>
        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: featured ? colors.sageXL : colors.forest }]}>{`${plan.price} ₽`}</Text>
        </View>
        <Text variant="bodySm" style={{ color: featured ? 'rgba(250,247,242,0.6)' : colors.light }}>
          {plan.period}
        </Text>
        <View style={styles.features}>
          {plan.features.map(f => (
            <View key={f} style={styles.feature}>
              <Icon name="checkCircle" size={16} color={featured ? colors.sageL : colors.sage} weight="fill" />
              <Text variant="bodySm" color={featured ? 'cream' : 'ink'} style={styles.featureText}>
                {f}
              </Text>
            </View>
          ))}
        </View>
        <Button label={t('subscription.choose')} variant={featured ? 'primary' : 'secondary'} onPress={onChoose} fullWidth />
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  description: { maxWidth: 280, alignSelf: 'center', marginBottom: spacing.xl },
  planWrap: { marginBottom: spacing.lg, paddingTop: spacing.sm },
  badge: {
    position: 'absolute',
    top: -6,
    alignSelf: 'center',
    zIndex: 1,
    backgroundColor: colors.sage,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  badgeText: { ...typography.caption, color: colors.white, fontFamily: 'DMSans_500Medium' },
  priceRow: { marginTop: spacing.sm },
  price: { ...typography.priceDisplay },
  features: { marginVertical: spacing.md, gap: spacing.sm },
  feature: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  featureText: { flex: 1 },
})
