import * as Phosphor from 'phosphor-react-native'
import React from 'react'

import { colors } from '../tokens/colors'
import { icons, type IconName, type PhosphorIconName } from '../tokens/icons'
import { iconSizes } from '../tokens/spacing'

interface IconProps {
  /** Семантическое имя из маппинга либо прямое имя Phosphor. */
  name: IconName | PhosphorIconName
  size?: number
  color?: string
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone'
}

/**
 * Единая точка для иконок. Разрешает семантическое имя (icons-маппинг)
 * либо прямое имя Phosphor. Stroke-width по умолчанию — regular (1.5px визуально).
 */
export function Icon({ name, size = iconSizes.inline, color = colors.sage, weight = 'regular' }: IconProps) {
  const phosphorName = (name in icons ? icons[name as IconName] : name) as PhosphorIconName
  const Component = (Phosphor as Record<string, React.ComponentType<Phosphor.IconProps>>)[phosphorName]
  if (!Component) return null
  return <Component size={size} color={color} weight={weight} />
}
