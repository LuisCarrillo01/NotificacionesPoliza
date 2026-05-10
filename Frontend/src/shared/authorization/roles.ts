import type { UserRole } from '../../types/api'

export const emergencyAccessRoles: UserRole[] = [
  'registrador_emergencia',
  'receptor_admisiones',
]

export function canAccessEmergencies(role: UserRole) {
  return emergencyAccessRoles.includes(role)
}
