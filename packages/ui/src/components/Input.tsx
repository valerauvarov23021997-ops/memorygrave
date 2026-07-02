import React, { useState } from 'react'
import {
  type KeyboardTypeOptions,
  StyleSheet,
  TextInput,
  View,
  type ViewStyle,
} from 'react-native'

import { type ThemeColors } from '../tokens/colors'
import { radii, spacing } from '../tokens/spacing'
import { typography } from '../tokens/typography'
import { useColors, useThemedStyles } from '../theme/ThemeProvider'
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
  const c = useColors()
  const styles = useThemedStyles(makeStyles)
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
          <Text color="forest" style={styles.label}>
            {label}
          </Text>
          {required ? (
            <Text color="error" style={styles.label}>
              {' *'}
            </Text>
          ) : null}
        </View>
      ) : null}
      <View style={fieldStyle}>
        {leftElement}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={c.light}
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
      {error ? (
        <Text color="error" style={styles.errorText}>
          {error}
        </Text>
      ) : null}
    </View>
  )
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    labelRow: { flexDirection: 'row', marginBottom: spacing.xs },
    label: { ...typography.label },
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 52,
      paddingHorizontal: spacing.md,
      borderRadius: radii.md,
      backgroundColor: c.parchment,
      borderWidth: 1,
      borderColor: c.linen,
    },
    multiline: { minHeight: 80, alignItems: 'flex-start', paddingVertical: spacing.md },
    active: { backgroundColor: c.white, borderWidth: 1.5, borderColor: c.sage },
    filled: { backgroundColor: c.white, borderColor: c.linen },
    error: { backgroundColor: c.white, borderWidth: 1.5, borderColor: c.error },
    textInput: { flex: 1, ...typography.bodyMd, color: c.ink, paddingVertical: spacing.md },
    textInputMultiline: { textAlignVertical: 'top' },
    errorText: { ...typography.caption, marginTop: spacing.xs },
  })
