import type { Service } from '@pamyat/api'
import { BottomSheet, Button, GroupedRow, GroupedSection, Icon, SectionLabel, Skeleton, spacing, Text, TopBar, useColors, useThemedStyles, type ThemeColors } from '@pamyat/ui'
import { useOrderDraftStore } from '@pamyat/store'
import { formatPrice } from '@pamyat/utils'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, View } from 'react-native'

import { useServices } from '../../src/hooks/queries'

export default function CatalogScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { data: services, isLoading } = useServices()
  const { graveName, cemeteryName, selectService } = useOrderDraftStore()
  const [detail, setDetail] = useState<Service | null>(null)
  const c = useColors()
  const styles = useThemedStyles(makeStyles)

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
            <GroupedSection style={styles.group}>
              {quick.map((s, i) => (
                <ServiceRow key={s.id} service={s} onPress={() => setDetail(s)} position={pos(i, quick.length)} />
              ))}
            </GroupedSection>

            <SectionLabel>{t('catalog.major')}</SectionLabel>
            <GroupedSection style={styles.group}>
              {major.map((s, i) => (
                <ServiceRow key={s.id} service={s} onPress={() => setDetail(s)} position={pos(i, major.length)} />
              ))}
            </GroupedSection>
          </>
        )}
      </ScrollView>

      <BottomSheet visible={!!detail} onClose={() => setDetail(null)}>
        {detail ? (
          <View style={styles.detail}>
            <View style={styles.detailHeader}>
              <Icon name={detail.icon} size={28} color={c.sage} />
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

/** Положение строки в группе по индексу. */
function pos(i: number, total: number): 'first' | 'middle' | 'last' | 'single' {
  if (total <= 1) return 'single'
  if (i === 0) return 'first'
  if (i === total - 1) return 'last'
  return 'middle'
}

function ServiceRow({
  service,
  onPress,
  position,
}: {
  service: Service
  onPress: () => void
  position: 'first' | 'middle' | 'last' | 'single'
}) {
  const { t } = useTranslation()
  return (
    <GroupedRow
      icon={service.icon}
      title={service.name}
      subtitle={service.description}
      right={
        <Text variant="headingMd" color="forest">
          {t('catalog.priceFrom', { price: formatPrice(service.priceFrom) })}
        </Text>
      }
      onPress={onPress}
      position={position}
    />
  )
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: c.cream },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  context: { marginBottom: spacing.lg },
  skeletons: { gap: spacing.sm },
  group: { marginBottom: spacing.lg },
  detail: { gap: spacing.md, paddingBottom: spacing.md },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  detailDesc: {},
  detailPrice: {},
})
