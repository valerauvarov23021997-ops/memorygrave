import * as Phosphor from 'phosphor-react-native'
import React from 'react'
import type { ColorValue } from 'react-native'

import { useColors } from '../theme/ThemeProvider'
import { iconAliases, icons, type IconName, type PhosphorIconName } from '../tokens/icons'
import { iconSizes } from '../tokens/spacing'

interface IconProps {
  /**
   * Семантическое имя из маппинга (icons) либо прямое имя Phosphor.
   * Допускаем произвольную строку — иконки услуг приходят из API строкой.
   */
  name: IconName | PhosphorIconName | (string & {})
  size?: number
  // Навигация передаёт ColorValue; Phosphor понимает только строку
  color?: ColorValue
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone'
}

/**
 * Единая точка для иконок. Разрешает семантическое имя (icons-маппинг)
 * либо прямое имя Phosphor. Stroke-width по умолчанию — regular (1.5px визуально).
 */
export function Icon({ name, size = iconSizes.inline, color, weight = 'regular' }: IconProps) {
  const c = useColors()
  const resolved = typeof color === 'string' ? color : c.sage
  const direct: string = name in icons ? icons[name as IconName] : name
  const phosphorName = iconAliases[direct] ?? direct
  const registry = Phosphor as unknown as Record<string, React.ComponentType<Phosphor.IconProps>>
  // Неизвестное имя раньше давало пустое место — теперь нейтральная замена и след в логах
  const Component = registry[phosphorName] ?? registry.Circle
  if (!registry[phosphorName]) console.warn(`[Icon] нет иконки «${name}» в Phosphor`)
  if (!Component) return null
  return <Component size={size} color={resolved} weight={weight} />
}
