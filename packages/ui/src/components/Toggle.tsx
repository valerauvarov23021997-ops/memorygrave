import React from 'react'
import { Switch } from 'react-native'

import { useColors } from '../theme/ThemeProvider'

interface ToggleProps {
  value: boolean
  onValueChange: (value: boolean) => void
  disabled?: boolean
}

export function Toggle({ value, onValueChange, disabled }: ToggleProps) {
  const c = useColors()
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ true: c.sage, false: c.stone }}
      thumbColor="#FFFFFF"
      ios_backgroundColor={c.stone}
    />
  )
}
