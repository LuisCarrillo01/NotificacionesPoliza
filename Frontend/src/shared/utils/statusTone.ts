type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

export function getStatusTone(status: string): StatusTone {
  switch (status) {
    case 'aprobado':
    case 'validada':
    case 'enviada':
    case 'leida':
      return 'success'
    case 'registrada':
    case 'pendiente':
    case 'procesando':
    case 'en_validacion':
      return 'info'
    case 'revision_manual':
    case 'media':
      return 'warning'
    case 'rechazado':
    case 'fallida':
    case 'critica':
      return 'danger'
    default:
      return 'neutral'
  }
}
