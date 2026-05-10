import { createContext } from 'react'
import type { AuthenticatedUser, LoginPayload } from '../types/api'

export type AuthContextValue = {
  user: AuthenticatedUser | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (payload: LoginPayload) => Promise<void>
  logout: () => void
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
