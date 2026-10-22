import { executorApi, tokenStorage } from '@pamyat/api'
import { colors, FlameLoader } from '@pamyat/ui'
import { Redirect } from 'expo-router'
import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'

const NOT_EXECUTOR = 'Вы не в списке исполнителей'

/** Гейт: есть вход и номер в списке исполнителей → приложение, иначе вход. */
export default function Index() {
  const [target, setTarget] = useState<'/login' | '/(tabs)' | null>(null)

  useEffect(() => {
    const check = async () => {
      const token = await tokenStorage.getAccess()
      if (!token) return '/login' as const
      try {
        await executorApi.profile()
        return '/(tabs)' as const
      } catch (e) {
        // без списка исполнителей — на вход; сбой сети не выкидывает из приложения
        return e instanceof Error && e.message === NOT_EXECUTOR ? '/login' : '/(tabs)'
      }
    }
    void check().then(setTarget)
  }, [])

  if (!target) {
    return (
      <View style={styles.center}>
        <FlameLoader size={34} />
      </View>
    )
  }
  return <Redirect href={target} />
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
  },
})
