import React, { useState } from 'react'
import {
  type KeyboardTypeOptions,
  StyleSheet,
  TextInput,
  View,
  type ViewStyle,
} from 'react-native'

import { colors } from '../tokens/colors'
import { radii, spacing } from '../tokens/spacing'
import { typography } from '../tokens/typography'
import { Text } from './Text'

interface InputProps {
  label?: string
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  error?: string
  keyboardType?: KeyboardTypeOptions
  secureTextEntry?: boolean
  maxLength?: number
  multiline?: boolean
  rightElement?: React.ReactNode
  leftElement?: React.ReactNode
  editable?: boolean
  autoFocus?: boolean
  required?: boolean
}

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  keyboardType,
  secureTextEntry,
  maxLength,
  multiline,
  rightElement,
  leftElement,
  editable = true,
  autoFocus,
  required,
}: InputProps) {
  const [focused, setFocused] = useState(false)
  const filled = value.length > 0

  const fieldStyle: ViewStyle[] = [
    styles.field,
    multiline && styles.multiline,
    filled && !error && styles.filled,
    focused && !error && styles.active,
    !!error && styles.error,
  ].filter(Boolean) as ViewStyle[]

  return (
    <View>
      {label ? (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {required ? <Text style={styles.asterisk}> *</Text> : null}
        </View>
      ) : null}
      <View style={fieldStyle}>
        {leftElement}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.light}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          maxLength={maxLength}
          multiline={multiline}
          editable={editable}
          autoFocus={autoFocus}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.textInput, multiline && styles.textInputMultiline]}
        />
        {rightElement}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  labelRow: { flexDirection: 'row', marginBottom: spacing.xs },
  label: { ...typography.label, color: colors.forest },
  asterisk: { ...typography.label, color: colors.error },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.parchment,
    borderWidth: 1,
    borderColor: colors.linen,
  },
  multiline: { minHeight: 80, alignItems: 'flex-start', paddingVertical: spacing.md },
  active: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.sage },
  filled: { backgroundColor: colors.white, borderColor: colors.linen },
  error: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.error },
  textInput: { flex: 1, ...typography.bodyMd, color: colors.ink, paddingVertical: spacing.md },
  textInputMultiline: { textAlignVertical: 'top' },
  errorText: { ...typography.caption, color: colors.error, marginTop: spacing.xs },
})
