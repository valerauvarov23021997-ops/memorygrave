import { tokenStorage } from '@pamyat/api'
import { useAuthStore } from '@pamyat/store'
import { colors, FlameLoader } from '@pamyat/ui'
import { Redirect } from 'expo-router'
import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { appStorage } from '../src/lib/storage'

type Route = '/onboarding' | '/(auth)/phone' | '/(tabs)'

/** Стартовый роутинг: онбординг → авторизация → приложение. */
export default function Index() {
  const [target, setTarget] = useState<Route | null>(null)
  const setStatus = useAuthStore(s => s.setStatus)

  useEffect(() => {
    async function bootstrap() {
      const seen = await appStorage.isOnboardingSeen()
      if (!seen) {
        setTarget('/onboarding')
        return
      }
      const token = await tokenStorage.getAccess()
      if (token) {
        setStatus('authenticated')
        setTarget('/(tabs)')
      } else {
        setStatus('unauthenticated')
        setTarget('/(auth)/phone')
      }
    }
    void bootstrap()
  }, [setStatus])

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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
})
