import React from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, { FadeIn } from 'react-native-reanimated'

import { type ThemeColors } from '../tokens/colors'
import { radii, spacing } from '../tokens/spacing'
import { useColors, useThemedStyles } from '../theme/ThemeProvider'
import { Button } from './Button'
import { Icon } from './Icon'
import { Text } from './Text'

interface EmptyStateProps {
  icon: string
  title: string
  subtitle?: string
  actionLabel?: string
  onAction?: () => void
}

/**
 * Единое «пустое состояние»: мягкий круглый значок, заголовок Playfair,
 * подсказка и опциональное действие. Спокойный, «дорогой» вид.
 */
export function EmptyState({ icon, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  const c = useColors()
  const styles = useThemedStyles(makeStyles)
  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.wrap}>
      <View style={styles.badge}>
        <Icon name={icon} size={30} color={c.sage} />
      </View>
      <Text variant="headingLg" color="forest" center style={styles.title}>
        {title}
      </Text>
      {subtitle ? (
        <Text variant="bodySm" color="muted" center style={styles.subtitle}>
          {subtitle}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button label={actionLabel} variant="secondary" onPress={onAction} />
        </View>
      ) : null}
    </Animated.View>
  )
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, gap: spacing.sm },
    badge: {
      width: 76,
      height: 76,
      borderRadius: radii.full,
      backgroundColor: c.parchment,
      borderWidth: 1,
      borderColor: c.linen,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    title: { marginTop: spacing.xs },
    subtitle: { maxWidth: 240 },
    action: { marginTop: spacing.lg },
  })
