import { tokenStorage } from '@pamyat/api'
import { colors } from '@pamyat/ui'
import { Redirect } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

/** Гейт: есть токен → приложение, иначе вход. */
export default function Index() {
  const [target, setTarget] = useState<'/login' | '/(tabs)' | null>(null)

  useEffect(() => {
    void tokenStorage.getAccess().then(token => setTarget(token ? '/(tabs)' : '/login'))
  }, [])

  if (!target) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.forest} />
      </View>
    )
  }
  return <Redirect href={target} />
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
})
