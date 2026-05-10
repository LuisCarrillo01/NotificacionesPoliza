import { BellDot, Clock3, Inbox } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'
import { ApiError, listNotifications, listPendingNotifications } from '../../lib/api'
import type { Notification } from '../../types/api'
import { EmptyState } from '../../shared/components/EmptyState'
import { ErrorAlert } from '../../shared/components/ErrorAlert'
import { LoadingBlock } from '../../shared/components/LoadingBlock'
import { PageHeader } from '../../shared/components/PageHeader'
import { StatusBadge } from '../../shared/components/StatusBadge'
import { getStatusTone } from '../../shared/utils/statusTone'

export function NotificationsPage() {
  const { token } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<'all' | 'pending'>('pending')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!token) {
      return
    }

    async function loadNotifications() {
      const activeToken = token

      if (!activeToken) {
        return
      }

      setIsLoading(true)
      setErrorMessage('')

      try {
        const data =
          filter === 'pending'
            ? await listPendingNotifications(activeToken)
            : await listNotifications(activeToken)
        setNotifications(data)
      } catch (error) {
        if (error instanceof ApiError) {
          setErrorMessage(error.message)
        } else {
          setErrorMessage('No se pudo cargar la bandeja de notificaciones.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    void loadNotifications()
  }, [filter, token])

  const groupedNotifications = useMemo(() => {
    return notifications.reduce<Record<string, Notification[]>>((accumulator, notification) => {
      const key = notification.notificationType

      if (!accumulator[key]) {
        accumulator[key] = []
      }

      accumulator[key].push(notification)
      return accumulator
    }, {})
  }, [notifications])

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Bandeja interna"
        title="Notificaciones"
        description="Consulta eventos enviados por el agente y controla el estado de lectura."
      />

      <div className="panel-card filter-row">
        <div className="inline-context">
          <div className="feature-icon-wrap feature-icon-soft">
            <Inbox size={18} aria-hidden="true" />
          </div>
          <div>
            <strong>Bandeja operativa</strong>
            <p className="meta-text">Filtra eventos por estado de lectura.</p>
          </div>
        </div>
        <div className="segmented-control" role="tablist" aria-label="Filtros de notificaciones">
          <button
            type="button"
            className={filter === 'pending' ? 'segment-active' : 'segment'}
            onClick={() => setFilter('pending')}
          >
            Pendientes
          </button>
          <button
            type="button"
            className={filter === 'all' ? 'segment-active' : 'segment'}
            onClick={() => setFilter('all')}
          >
            Todas
          </button>
        </div>
      </div>

      {errorMessage ? <ErrorAlert message={errorMessage} /> : null}

      {isLoading ? (
        <LoadingBlock title="Cargando bandeja" description="Consultando notificaciones disponibles para este usuario." />
      ) : notifications.length === 0 ? (
        <EmptyState
          title="No hay notificaciones"
          description="La bandeja esta vacia para el filtro seleccionado."
        />
      ) : (
        <div className="stack-list">
          {Object.entries(groupedNotifications).map(([group, groupNotifications]) => (
            <section key={group} className="panel-card">
              <div className="section-heading">
                <div>
                  <h3>{group}</h3>
                  <p>{groupNotifications.length} elementos en este grupo.</p>
                </div>
                <div className="feature-icon-wrap feature-icon-soft">
                  <BellDot size={18} aria-hidden="true" />
                </div>
              </div>

              <div className="stack-list compact-stack">
                {groupNotifications.map((notification) => (
                  <Link
                    key={notification.id}
                    to={`/app/notifications/${notification.id}`}
                    className="list-card"
                  >
                    <div className="list-card-row">
                      <div className="inline-context inline-context-start">
                        <div className="feature-icon-wrap feature-icon-soft">
                          <Clock3 size={16} aria-hidden="true" />
                        </div>
                        <strong>{notification.title}</strong>
                      </div>
                      <StatusBadge tone={getStatusTone(notification.notificationStatus)}>
                        {notification.notificationStatus}
                      </StatusBadge>
                    </div>
                    <p>{notification.message}</p>
                    <span className="meta-text">Generada: {new Date(notification.generatedAt).toLocaleString()}</span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  )
}
