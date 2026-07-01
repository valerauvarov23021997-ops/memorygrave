import { authApi, tokenStorage } from '@pamyat/api'
import { useAuthStore } from '@pamyat/store'
import { toE164 } from '@pamyat/utils'
import { useCallback } from 'react'

/** Действия авторизации: отправка кода, проверка, выход. */
export function useAuthActions() {
  const setAuth = useAuthStore(s => s.setAuth)
  const clearAuth = useAuthStore(s => s.clearAuth)

  const sendCode = useCallback((phoneRaw: string) => authApi.sendCode(toE164(phoneRaw)), [])

  const verifyCode = useCallback(
    async (phoneRaw: string, code: string) => {
      const tokens = await authApi.verifyCode(toE164(phoneRaw), code)
      await tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken)
      setAuth(tokens.user.id, tokens.user.phone, tokens.user.name)
      return tokens
    },
    [setAuth]
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      await tokenStorage.clear()
      clearAuth()
    }
  }, [clearAuth])

  return { sendCode, verifyCode, logout }
}
