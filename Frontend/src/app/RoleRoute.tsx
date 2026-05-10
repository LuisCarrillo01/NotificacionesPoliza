import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'
import type { UserRole } from '../types/api'

type RoleRouteProps = {
  allowedRoles: UserRole[]
  children: ReactNode
  redirectTo?: string
}

export function RoleRoute({ allowedRoles, children, redirectTo = '/app' }: RoleRouteProps) {
  const { user } = useAuth()

  if (!user) {
    return null
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}
