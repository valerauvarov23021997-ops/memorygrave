import React from 'react'
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { radii, spacing } from '../tokens/spacing'
import { useColors, useThemedStyles } from '../theme/ThemeProvider'
import { type ThemeColors } from '../tokens/colors'
import { Avatar } from './Avatar'
import { Icon } from './Icon'
import { Text } from './Text'

/** Положение строки в группе — управляет скруглениями и рамками. */
export type GroupedPosition = 'first' | 'middle' | 'last' | 'single'

interface GroupedRowProps {
  title: string
  subtitle?: string
  /** Имя иконки слева (в мягком квадрате). */
  icon?: string
  iconColor?: string
  iconBg?: string
  /** Вместо иконки — аватар с инициалами/фото. */
  avatarName?: string
  avatarUri?: string | null
  /** Кастомный элемент справа (цена, бейдж). Заменяет шеврон. */
  right?: React.ReactNode
  /** Серифный заголовок — для имён людей. */
  serif?: boolean
  chevron?: boolean
  onPress?: () => void
  position?: GroupedPosition
  style?: StyleProp<ViewStyle>
}

/**
 * Строка группированного списка в духе iOS: белая панель,
 * волосяные разделители, скругления по краям группы.
 * Используется внутри GroupedSection или самостоятельно в FlatList
 * с вычисленным position.
 */
export function GroupedRow({
  title,
  subtitle,
  icon,
  iconColor,
  iconBg,
  avatarName,
  avatarUri,
  right,
  serif = false,
  chevron = true,
  onPress,
  position = 'middle',
  style,
}: GroupedRowProps) {
  const c = useColors()
  const styles = useThemedStyles(makeStyles)

  const shape: ViewStyle = {
    borderTopLeftRadius: position === 'first' || position === 'single' ? radii.lg : 0,
    borderTopRightRadius: position === 'first' || position === 'single' ? radii.lg : 0,
    borderBottomLeftRadius: position === 'last' || position === 'single' ? radii.lg : 0,
    borderBottomRightRadius: position === 'last' || position === 'single' ? radii.lg : 0,
    borderBottomWidth: position === 'first' || position === 'middle' ? StyleSheet.hairlineWidth : 0,
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, shape, pressed && onPress ? styles.pressed : null, style]}
    >
      {avatarName != null ? (
        <Avatar name={avatarName} size={40} imageUri={avatarUri} />
      ) : icon ? (
        <View style={[styles.iconWrap, iconBg ? { backgroundColor: iconBg } : null]}>
          <Icon name={icon} size={18} color={iconColor ?? c.sage} />
        </View>
      ) : null}
      <View style={styles.body}>
        <Text
          variant={serif ? 'headingLg' : 'bodyMd'}
          color={serif ? 'forest' : 'ink'}
          numberOfLines={1}
          style={!serif ? styles.titleSans : undefined}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text variant="bodySm" color="muted" numberOfLines={1} style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ?? (chevron && onPress ? <Icon name="chevronRight" size={16} color={c.light} /> : null)}
    </Pressable>
  )
}

/** Обёртка группы для статичных экранов: тень и рамка вокруг набора строк. */
export function GroupedSection({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const styles = useThemedStyles(makeStyles)
  return <View style={[styles.section, style]}>{children}</View>
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    section: {
      borderRadius: radii.lg,
      backgroundColor: c.white,
      borderWidth: 1,
      borderColor: c.linen,
      // Тень мягкая, как у карточек
      shadowColor: c.forest,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 1,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minHeight: 60,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: c.white,
      borderBottomColor: c.linen,
    },
    pressed: { backgroundColor: c.parchment },
    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: radii.sm,
      backgroundColor: c.sageXL + '55',
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: { flex: 1, minWidth: 0 },
    titleSans: { fontFamily: 'DMSans_500Medium' },
    subtitle: { marginTop: 1 },
  })
