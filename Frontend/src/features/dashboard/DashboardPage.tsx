import {
  Activity,
  BellRing,
  ChevronRight,
  FileSearch,
  ShieldAlert,
  Stethoscope,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'
import { ApiError, listEmergencies, listPendingNotifications } from '../../lib/api'
import type { Emergency, Notification } from '../../types/api'
import { EmptyState } from '../../shared/components/EmptyState'
import { ErrorAlert } from '../../shared/components/ErrorAlert'
import { LoadingBlock } from '../../shared/components/LoadingBlock'
import { PageHeader } from '../../shared/components/PageHeader'
import { canAccessEmergencies } from '../../shared/authorization/roles'
import { StatusBadge } from '../../shared/components/StatusBadge'
import { getStatusTone } from '../../shared/utils/statusTone'

export function DashboardPage() {
  const { token, user } = useAuth()
  const [emergencies, setEmergencies] = useState<Emergency[]>([])
  const [pendingNotifications, setPendingNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const showEmergencies = user ? canAccessEmergencies(user.role) : false

  useEffect(() => {
    if (!token) {
      return
    }

    async function loadDashboard() {
      const activeToken = token

      if (!activeToken) {
        return
      }

      setIsLoading(true)
      setErrorMessage('')

      try {
        const [emergencyData, notificationData] = await Promise.all([
          showEmergencies ? listEmergencies(activeToken) : Promise.resolve([]),
          listPendingNotifications(activeToken),
        ])

        setEmergencies(emergencyData)
        setPendingNotifications(notificationData)
      } catch (error) {
        if (error instanceof ApiError) {
          setErrorMessage(error.message)
        } else {
          setErrorMessage('No se pudo cargar el panel principal.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    void loadDashboard()
  }, [showEmergencies, token])

  if (!user) {
    return null
  }

  const criticalEmergencies = emergencies.filter((item) => item.priorityLevel === 'critica').length

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Resumen operativo"
        title="Panel de coordinacion"
        description="Visibilidad inmediata sobre casos activos, validaciones en curso y notificaciones pendientes."
      />

      {errorMessage ? <ErrorAlert message={errorMessage} /> : null}

      {isLoading ? (
        <LoadingBlock title="Cargando actividad" description="Consultando emergencias y bandeja pendiente." />
      ) : (
        <>
          <div className="metrics-grid">
            {showEmergencies ? (
              <article className="metric-card accent-card">
                <div className="metric-icon metric-icon-primary">
                  <Stethoscope size={20} aria-hidden="true" />
                </div>
                <span className="metric-label">Emergencias visibles</span>
                <strong>{emergencies.length}</strong>
                <p>Total de casos listados para tu sesion actual.</p>
              </article>
            ) : (
              <article className="metric-card accent-card">
                <div className="metric-icon metric-icon-primary">
                  <FileSearch size={20} aria-hidden="true" />
                </div>
                <span className="metric-label">Informes y decisiones</span>
                <strong>{pendingNotifications.length}</strong>
                <p>Validaciones pendientes de revisar desde tu bandeja.</p>
              </article>
            )}
            <article className="metric-card">
              <div className="metric-icon metric-icon-secondary">
                <BellRing size={20} aria-hidden="true" />
              </div>
              <span className="metric-label">Pendientes por leer</span>
              <strong>{pendingNotifications.length}</strong>
              <p>Notificaciones listas para seguimiento.</p>
            </article>
            {showEmergencies ? (
              <article className="metric-card">
                <div className="metric-icon metric-icon-danger">
                  <ShieldAlert size={20} aria-hidden="true" />
                </div>
                <span className="metric-label">Prioridad critica</span>
                <strong>{criticalEmergencies}</strong>
                <p>Casos que requieren lectura inmediata.</p>
              </article>
            ) : (
              <article className="metric-card">
                <div className="metric-icon metric-icon-danger">
                  <BellRing size={20} aria-hidden="true" />
                </div>
                <span className="metric-label">Estado de seguimiento</span>
                <strong>{pendingNotifications.length > 0 ? 'Activo' : 'Al dia'}</strong>
                <p>Consulta notificaciones e informes sin entrar al modulo clinico.</p>
              </article>
            )}
          </div>

          <div className="content-grid two-columns">
            <section className="panel-card">
              <div className="section-heading">
                <div>
                  <h3>Accesos rapidos</h3>
                  <p>Atajos a las acciones mas comunes segun el flujo del backend.</p>
                </div>
              </div>

              <div className="action-grid">
                {user.role === 'registrador_emergencia' ? (
                  <Link className="action-card action-card-rich" to="/app/emergencies/new">
                    <div className="action-card-head">
                      <div className="feature-icon-wrap">
                        <Activity size={20} aria-hidden="true" />
                      </div>
                      <ChevronRight size={18} aria-hidden="true" />
                    </div>
                    <strong>Registrar emergencia</strong>
                    <span>Crear un caso usando documento del paciente y numero de poliza.</span>
                  </Link>
                ) : null}
                {showEmergencies ? (
                  <Link className="action-card action-card-rich" to="/app/emergencies">
                    <div className="action-card-head">
                      <div className="feature-icon-wrap">
                        <ShieldAlert size={20} aria-hidden="true" />
                      </div>
                      <ChevronRight size={18} aria-hidden="true" />
                    </div>
                    <strong>Revisar emergencias</strong>
                    <span>Consulta estado, prioridad y detalle del caso.</span>
                  </Link>
                ) : null}
                <Link className="action-card action-card-rich" to="/app/notifications">
                  <div className="action-card-head">
                    <div className="feature-icon-wrap">
                      <BellRing size={20} aria-hidden="true" />
                    </div>
                    <ChevronRight size={18} aria-hidden="true" />
                  </div>
                  <strong>Abrir bandeja</strong>
                  <span>Lee y marca notificaciones operativas.</span>
                </Link>
                <Link className="action-card action-card-rich" to="/app/reports">
                  <div className="action-card-head">
                    <div className="feature-icon-wrap">
                      <FileSearch size={20} aria-hidden="true" />
                    </div>
                    <ChevronRight size={18} aria-hidden="true" />
                  </div>
                  <strong>{showEmergencies ? 'Buscar informe' : 'Revisar informes'}</strong>
                  <span>
                    {showEmergencies
                      ? 'Consulta un informe cuando tengas su identificador.'
                      : 'Accede a informes generados desde las validaciones notificadas.'}
                  </span>
                </Link>
              </div>
            </section>

            <section className="panel-card">
              <div className="section-heading">
                <div>
                  <h3>Ultimas notificaciones pendientes</h3>
                  <p>Vista rapida de la bandeja con foco en lectura inmediata.</p>
                </div>
                <Link className="text-link" to="/app/notifications">
                  Ver todo
                </Link>
              </div>

              {pendingNotifications.length === 0 ? (
                <EmptyState
                  title="Sin pendientes"
                  description="No hay notificaciones pendientes o no leidas para este usuario."
                />
              ) : (
                <div className="stack-list">
                  {pendingNotifications.slice(0, 4).map((notification) => (
                    <Link
                      key={notification.id}
                      className="list-card"
                      to={`/app/notifications/${notification.id}`}
                    >
                      <div className="list-card-row">
                        <strong>{notification.title}</strong>
                        <StatusBadge tone={getStatusTone(notification.notificationStatus)}>
                          {notification.notificationStatus}
                        </StatusBadge>
                      </div>
                      <p>{notification.message}</p>
                      <span className="meta-text">
                        Generada: {new Date(notification.generatedAt).toLocaleString()}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </section>
  )
}
