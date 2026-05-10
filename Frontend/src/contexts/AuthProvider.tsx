import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getAuthenticatedUser, loginRequest } from '../lib/api'
import { clearStoredToken, getStoredToken, storeToken } from '../lib/storage'
import { AuthContext, type AuthContextValue } from './AuthContext'

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(() => getStoredToken())
  const [user, setUser] = useState<AuthContextValue['user']>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    clearStoredToken()
    setToken(null)
    setUser(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    const activeToken = getStoredToken()

    if (!activeToken) {
      setUser(null)
      return
    }

    const profile = await getAuthenticatedUser(activeToken)
    setToken(activeToken)
    setUser(profile)
  }, [])

  const login = useCallback<AuthContextValue['login']>(async (payload) => {
    const authentication = await loginRequest(payload)
    storeToken(authentication.token)
    setToken(authentication.token)
    setUser(authentication.user)
  }, [])

  useEffect(() => {
    async function bootstrapSession() {
      const storedToken = getStoredToken()

      if (!storedToken) {
        setIsLoading(false)
        return
      }

      try {
        const profile = await getAuthenticatedUser(storedToken)
        setToken(storedToken)
        setUser(profile)
      } catch {
        clearStoredToken()
        setToken(null)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    void bootstrapSession()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
      refreshProfile,
    }),
    [isLoading, login, logout, refreshProfile, token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
