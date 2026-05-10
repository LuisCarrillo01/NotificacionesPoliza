import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'
import { ApiError, getNotificationById, getReportByValidationId, markNotificationAsRead } from '../../lib/api'
import type { Notification } from '../../types/api'
import { ErrorAlert } from '../../shared/components/ErrorAlert'
import { LoadingBlock } from '../../shared/components/LoadingBlock'
import { PageHeader } from '../../shared/components/PageHeader'
import { StatusBadge } from '../../shared/components/StatusBadge'
import { getStatusTone } from '../../shared/utils/statusTone'

export function NotificationDetailPage() {
  const { notificationId = '' } = useParams()
  const { token } = useAuth()
  const navigate = useNavigate()
  const [notification, setNotification] = useState<Notification | null>(null)
  const [relatedReportId, setRelatedReportId] = useState<string | null>(null)
  const [reportLookupFinished, setReportLookupFinished] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResolvingReport, setIsResolvingReport] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!token || !notificationId) {
      return
    }

    async function loadNotification() {
      const activeToken = token

      if (!activeToken) {
        return
      }

      setIsLoading(true)
      setErrorMessage('')
      setRelatedReportId(null)
      setReportLookupFinished(false)

      try {
        const loadedNotification = await getNotificationById(notificationId, activeToken)
        setNotification(loadedNotification)

        try {
          const relatedReport = await getReportByValidationId(loadedNotification.validationId, activeToken)
          setRelatedReportId(relatedReport.id)
        } catch (error) {
          if (error instanceof ApiError && error.status === 404) {
            setRelatedReportId(null)
          } else {
            throw error
          }
        } finally {
          setReportLookupFinished(true)
        }
      } catch (error) {
        setRelatedReportId(null)
        setReportLookupFinished(false)
        if (error instanceof ApiError) {
          setErrorMessage(error.message)
        } else {
          setErrorMessage('No fue posible consultar la notificacion.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    void loadNotification()
  }, [notificationId, token])

  async function handleMarkAsRead() {
    if (!token || !notification) {
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      setNotification(await markNotificationAsRead(notification.id, token))
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('No fue posible marcar la notificacion como leida.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleOpenReport() {
    if (!token || !notification) {
      return
    }

    if (relatedReportId) {
      navigate(`/app/reports/${relatedReportId}`)
      return
    }

    setIsResolvingReport(true)
    setErrorMessage('')

    try {
      const report = await getReportByValidationId(notification.validationId, token)
      setRelatedReportId(report.id)
      setReportLookupFinished(true)
      navigate(`/app/reports/${report.id}`)
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setRelatedReportId(null)
        setReportLookupFinished(true)
      } else if (error instanceof ApiError) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('No fue posible resolver el informe asociado a esta validacion.')
      }
    } finally {
      setIsResolvingReport(false)
    }
  }

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Lectura individual"
        title="Detalle de notificacion"
        description="Revision del mensaje emitido por el flujo de validacion."
      />

      {errorMessage ? <ErrorAlert message={errorMessage} /> : null}

      {isLoading || !notification ? (
        <LoadingBlock title="Cargando notificacion" description="Obteniendo detalle de la bandeja." />
      ) : (
        <div className="content-grid two-columns">
          <section className="panel-card">
            <div className="section-heading">
              <div>
                <h3>{notification.title}</h3>
                <p>{notification.notificationType}</p>
              </div>
              <StatusBadge tone={getStatusTone(notification.notificationStatus)}>
                {notification.notificationStatus}
              </StatusBadge>
            </div>

            <p className="message-block">{notification.message}</p>

            <dl className="details-grid single-column-grid">
              <div>
                <dt>Canal</dt>
                <dd>{notification.channel}</dd>
              </div>
              <div>
                <dt>Generada</dt>
                <dd>{new Date(notification.generatedAt).toLocaleString()}</dd>
              </div>
              <div>
                <dt>Enviada</dt>
                <dd>{notification.sentAt ? new Date(notification.sentAt).toLocaleString() : 'Pendiente'}</dd>
              </div>
              <div>
                <dt>Leida</dt>
                <dd>{notification.readAt ? new Date(notification.readAt).toLocaleString() : 'No leida'}</dd>
              </div>
              <div>
                <dt>Validacion</dt>
                <dd>{notification.validationId}</dd>
              </div>
            </dl>

            <button
              type="button"
              className="primary-button"
              disabled={isSubmitting || notification.notificationStatus === 'leida'}
              onClick={handleMarkAsRead}
            >
              {isSubmitting ? 'Actualizando...' : 'Marcar como leida'}
            </button>
          </section>

          <section className="panel-card">
            <div className="section-heading">
              <div>
                <h3>Siguiente paso</h3>
                <p>
                  {relatedReportId
                    ? 'Ya existe un informe asociado a esta validacion.'
                    : 'Si el informe aun no existe o no se puede resolver, puedes ir al modulo de informes.'}
                </p>
              </div>
            </div>

            <div className="feedback-box feedback-info">
              {relatedReportId
                ? 'Puedes abrir directamente el informe generado para esta validacion.'
                : reportLookupFinished
                  ? 'Todavia no se encontro un informe asociado a esta validacion.'
                  : 'Resolviendo si existe un informe asociado a esta validacion.'}
            </div>

            {relatedReportId ? (
              <button type="button" className="primary-button link-button" onClick={handleOpenReport}>
                {isResolvingReport ? 'Abriendo informe...' : 'Ver informe'}
              </button>
            ) : !reportLookupFinished ? (
              <button
                type="button"
                className="primary-button link-button"
                onClick={handleOpenReport}
                disabled={isResolvingReport}
              >
                {isResolvingReport ? 'Buscando informe...' : 'Ver informe'}
              </button>
            ) : (
              <Link className="secondary-button link-button" to="/app/reports">
                Ir a informes
              </Link>
            )}
          </section>
        </div>
      )}
    </section>
  )
}
