import type { Service } from '@pamyat/api'
import { BottomSheet, Button, colors, Divider, Icon, SectionLabel, Skeleton, spacing, Text, TopBar } from '@pamyat/ui'
import { useOrderDraftStore } from '@pamyat/store'
import { formatPrice } from '@pamyat/utils'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'

import { useServices } from '../../src/hooks/queries'

export default function CatalogScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { data: services, isLoading } = useServices()
  const { graveName, cemeteryName, selectService } = useOrderDraftStore()
  const [detail, setDetail] = useState<Service | null>(null)

  const quick = services?.filter(s => s.category === 'quick') ?? []
  const major = services?.filter(s => s.category === 'major') ?? []

  const choose = (service: Service) => {
    selectService({
      id: service.id,
      name: service.name,
      icon: service.icon,
      priceFrom: service.priceFrom,
      fixedPrice: service.fixedPrice,
    })
    setDetail(null)
    router.push('/order/form')
  }

  return (
    <View style={styles.root}>
      <TopBar title={t('grave.orderCare')} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="bodySm" color="muted" style={styles.context}>
          {[graveName, cemeteryName].filter(Boolean).join(' · ')}
        </Text>

        {isLoading ? (
          <View style={styles.skeletons}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} width="100%" height={56} radius={10} />
            ))}
          </View>
        ) : (
          <>
            <SectionLabel>{t('catalog.quick')}</SectionLabel>
            {quick.map(s => (
              <ServiceRow key={s.id} service={s} onPress={() => setDetail(s)} />
            ))}

            <Divider />
            <SectionLabel>{t('catalog.major')}</SectionLabel>
            {major.map(s => (
              <ServiceRow key={s.id} service={s} onPress={() => setDetail(s)} />
            ))}
          </>
        )}
      </ScrollView>

      <BottomSheet visible={!!detail} onClose={() => setDetail(null)}>
        {detail ? (
          <View style={styles.detail}>
            <View style={styles.detailHeader}>
              <Icon name={detail.icon} size={28} color={colors.sage} />
              <Text variant="headingLg" color="forest">
                {detail.name}
              </Text>
            </View>
            <Text variant="bodyMd" color="muted" style={styles.detailDesc}>
              {detail.description}
            </Text>
            <Text variant="priceDisplay" color="forest" style={styles.detailPrice}>
              {detail.fixedPrice ? formatPrice(detail.priceFrom) : t('catalog.priceFrom', { price: formatPrice(detail.priceFrom) })}
            </Text>
            <Button label={t('catalog.select')} onPress={() => choose(detail)} fullWidth />
          </View>
        ) : null}
      </BottomSheet>
    </View>
  )
}

function ServiceRow({ service, onPress }: { service: Service; onPress: () => void }) {
  const { t } = useTranslation()
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Icon name={service.icon} size={20} color={colors.sage} />
      <View style={styles.rowBody}>
        <Text variant="headingMd" color="ink">
          {service.name}
        </Text>
        <Text variant="bodySm" color="muted" numberOfLines={1}>
          {service.description}
        </Text>
      </View>
      <Text variant="headingMd" color="forest">
        {t('catalog.priceFrom', { price: formatPrice(service.priceFrom) })}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  context: { marginBottom: spacing.lg },
  skeletons: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 56, paddingVertical: spacing.sm },
  rowBody: { flex: 1 },
  detail: { gap: spacing.md, paddingBottom: spacing.md },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  detailDesc: {},
  detailPrice: {},
})
