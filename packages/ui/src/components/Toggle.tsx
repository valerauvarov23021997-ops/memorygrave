import React from 'react'
import { Switch } from 'react-native'

import { colors } from '../tokens/colors'

interface ToggleProps {
  value: boolean
  onValueChange: (value: boolean) => void
  disabled?: boolean
}

export function Toggle({ value, onValueChange, disabled }: ToggleProps) {
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ true: colors.sage, false: colors.stone }}
      thumbColor={colors.white}
      ios_backgroundColor={colors.stone}
    />
  )
}
