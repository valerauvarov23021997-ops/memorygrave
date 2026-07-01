import React from 'react'
import { Switch } from 'react-native'

import { colors } from '../tokens/colors'
import { haptics } from '../utils/haptics'

interface ToggleProps {
  value: boolean
  onValueChange: (value: boolean) => void
  disabled?: boolean
}

export function Toggle({ value, onValueChange, disabled }: ToggleProps) {
  return (
    <Switch
      value={value}
      onValueChange={next => {
        haptics.light()
        onValueChange(next)
      }}
      disabled={disabled}
      trackColor={{ true: colors.sage, false: colors.stone }}
      thumbColor={colors.white}
      ios_backgroundColor={colors.stone}
    />
  )
}
