import * as Phosphor from 'phosphor-react-native'
import React from 'react'

import { icons, type IconName, type PhosphorIconName } from '../tokens/icons'
import { iconSizes } from '../tokens/spacing'
import { useColors } from '../theme/ThemeProvider'

interface IconProps {
  /**
   * Семантическое имя из маппинга (icons) либо прямое имя Phosphor.
   * Допускаем произвольную строку — иконки услуг приходят из API строкой.
   */
  name: IconName | PhosphorIconName | (string & {})
  size?: number
  color?: string
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone'
}

/**
 * Единая точка для иконок. Разрешает семантическое имя (icons-маппинг)
 * либо прямое имя Phosphor. Stroke-width по умолчанию — regular (1.5px визуально).
 */
export function Icon({ name, size = iconSizes.inline, color, weight = 'regular' }: IconProps) {
  const c = useColors()
  const resolved = color ?? c.sage
  const phosphorName: string = name in icons ? icons[name as IconName] : name
  const registry = Phosphor as unknown as Record<string, React.ComponentType<Phosphor.IconProps>>
  const Component = registry[phosphorName]
  if (!Component) return null
  return <Component size={size} color={resolved} weight={weight} />
}
