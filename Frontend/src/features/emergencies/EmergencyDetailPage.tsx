import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { env } from '../../config/env'
import { useAuth } from '../../contexts/useAuth'
import { ApiError, getEmergencyById, getEmergencyValidation, retryValidation, triggerValidation } from '../../lib/api'
import type { Emergency, EmergencyValidation } from '../../types/api'
import { AnalysisReadyModal } from '../../shared/components/AnalysisReadyModal'
import { ErrorAlert } from '../../shared/components/ErrorAlert'
import { LoadingBlock } from '../../shared/components/LoadingBlock'
import { PageHeader } from '../../shared/components/PageHeader'
import { StatusBadge } from '../../shared/components/StatusBadge'
import { getStatusTone } from '../../shared/utils/statusTone'

const VISUAL_RETRY_TIMEOUT_MINUTES = env.validationRetryTimeoutMinutes

function getAnalysisModalStorageKey(emergencyId: string) {
  return `analysis-modal-seen:${emergencyId}`
}

export function EmergencyDetailPage() {
  const { emergencyId = '' } = useParams()
  const { token, user } = useAuth()
  const [emergency, setEmergency] = useState<Emergency | null>(null)
  const [validation, setValidation] = useState<EmergencyValidation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRetryingValidation, setIsRetryingValidation] = useState(false)
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [validationMessage, setValidationMessage] = useState('')

  const canTriggerValidation =
    user?.role === 'registrador_emergencia' &&
    emergency?.emergencyStatus === 'registrada' &&
    !validation

  const shouldPollForUpdates =
    emergency?.emergencyStatus === 'en_validacion' ||
    (Boolean(validation) && validation?.processStatus !== 'completada' && emergency?.emergencyStatus !== 'cancelada')

  const validationRequestTimestamp = validation?.requestDate ? new Date(validation.requestDate).getTime() : null
  const validationAgeInMinutes = validationRequestTimestamp
    ? (Date.now() - validationRequestTimestamp) / 60000
    : 0
  const isValidationFailed = validation?.processStatus === 'fallida'
  const isValidationTimedOutVisually =
    validation?.processStatus === 'procesando' && validationAgeInMinutes >= VISUAL_RETRY_TIMEOUT_MINUTES
  const canRetryValidation = Boolean(validation) && (isValidationFailed || isValidationTimedOutVisually)

  const loadEmergencyState = useCallback(
    async (options?: { showLoading?: boolean }) => {
      if (!token || !emergencyId) {
        return
      }

      const showLoading = options?.showLoading ?? false

      if (showLoading) {
        setIsLoading(true)
      }

      setErrorMessage('')
      setValidationMessage('')

      try {
        const [loadedEmergency, loadedValidation] = await Promise.all([
          getEmergencyById(emergencyId, token),
          getEmergencyValidation(emergencyId, token).catch((error) => {
            if (error instanceof ApiError && error.status === 404) {
              return null
            }

            throw error
          }),
        ])

        setEmergency(loadedEmergency)
        setValidation(loadedValidation)

        if (!loadedValidation) {
          setValidationMessage('Aun no hay una validacion registrada para esta emergencia.')
        }
      } catch (error) {
        setValidation(null)
        if (error instanceof ApiError) {
          setErrorMessage(error.message)
        } else {
          setErrorMessage('No se pudo cargar el detalle de la emergencia.')
        }
      } finally {
        if (showLoading) {
          setIsLoading(false)
        }
      }
    },
    [emergencyId, token]
  )

  useEffect(() => {
    if (!emergencyId || !validation?.reportId || validation.processStatus !== 'completada') {
      return
    }

    const storageKey = getAnalysisModalStorageKey(emergencyId)
    const wasAlreadySeen = window.sessionStorage.getItem(storageKey)

    if (!wasAlreadySeen) {
      setIsAnalysisModalOpen(true)
      window.sessionStorage.setItem(storageKey, 'true')
    }
  }, [emergencyId, validation])

  function handleCloseAnalysisModal() {
    setIsAnalysisModalOpen(false)
  }

  useEffect(() => {
    if (!token || !emergencyId) {
      return
    }

    void loadEmergencyState({ showLoading: true })
  }, [emergencyId, loadEmergencyState, token])

  useEffect(() => {
    if (!token || !emergencyId || !shouldPollForUpdates) {
      return
    }

    const intervalId = window.setInterval(() => {
      void loadEmergencyState()
    }, 5000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [emergencyId, loadEmergencyState, shouldPollForUpdates, token])

  async function handleTriggerValidation() {
    if (!token || !emergency) {
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')
    setFeedbackMessage('')

    try {
      const createdValidation = await triggerValidation(emergency.id, token)
      setValidation({ ...createdValidation, reportId: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
      setValidationMessage('La validacion fue creada. El informe aparecera cuando el agente complete el proceso.')
      setEmergency((current) =>
        current ? { ...current, emergencyStatus: 'en_validacion', updatedAt: new Date().toISOString() } : current,
      )
      setFeedbackMessage('Validacion creada y enviada al agente. El caso pasa a en_validacion.')
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('No fue posible iniciar la validacion.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRetryValidation() {
    if (!token || !validation) {
      return
    }

    setIsRetryingValidation(true)
    setErrorMessage('')
    setFeedbackMessage('')

    try {
      const retriedValidation = await retryValidation(validation.id, token)
      setValidation({
        ...retriedValidation,
        reportId: null,
        createdAt: validation.createdAt,
        updatedAt: new Date().toISOString(),
      })
      setValidationMessage('La validacion fue reenviada al agente y seguira actualizandose automaticamente.')
      setFeedbackMessage('Se reenvio la validacion al agente.')
      await loadEmergencyState()
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('No fue posible reintentar la validacion.')
      }
    } finally {
      setIsRetryingValidation(false)
    }
  }

  return (
    <section className="page-stack">
      {validation?.reportId && emergency ? (
        <AnalysisReadyModal
          isOpen={isAnalysisModalOpen}
          caseCode={emergency.caseCode}
          reportId={validation.reportId}
          onClose={handleCloseAnalysisModal}
        />
      ) : null}

      <PageHeader
        eyebrow="Detalle del caso"
        title="Emergencia medica"
        description="Vista operativa del caso, con estado real de la validacion y acceso al informe cuando exista."
      />

      {feedbackMessage ? <div className="feedback-box feedback-success">{feedbackMessage}</div> : null}
      {errorMessage ? <ErrorAlert message={errorMessage} /> : null}
      {shouldPollForUpdates ? (
        <div className="feedback-box feedback-info">
          Actualizando estado automaticamente mientras el caso sigue en analisis. No necesitas recargar la pagina para
          saber si ya se genero el informe.
        </div>
      ) : null}
      {emergency?.emergencyStatus === 'cancelada' ? (
        <div className="feedback-box feedback-info">
          Esta emergencia fue cancelada por el registrador y ya no admite envio a validacion.
        </div>
      ) : null}

      {isLoading || !emergency ? (
        <LoadingBlock title="Cargando caso" description="Recuperando detalle de la emergencia seleccionada." />
      ) : (
        <div className="content-grid two-columns">
          <section className="panel-card">
            <div className="section-heading">
              <div>
                <h3>{emergency.caseCode}</h3>
                <p>Informacion estructurada del caso y metadatos devueltos por el backend.</p>
              </div>
              <StatusBadge tone={getStatusTone(emergency.emergencyStatus)}>
                {emergency.emergencyStatus}
              </StatusBadge>
            </div>

            <dl className="details-grid">
              <div>
                <dt>Tipo</dt>
                <dd>{emergency.emergencyType}</dd>
              </div>
              <div>
                <dt>Prioridad</dt>
                <dd>
                  <StatusBadge tone={getStatusTone(emergency.priorityLevel)}>
                    {emergency.priorityLevel}
                  </StatusBadge>
                </dd>
              </div>
              <div>
                <dt>Fecha de ingreso</dt>
                <dd>{new Date(emergency.admissionDate).toLocaleString()}</dd>
              </div>
              <div>
                <dt>Paciente</dt>
                <dd>{emergency.patientId}</dd>
              </div>
              <div>
                <dt>Poliza</dt>
                <dd>{emergency.policyId}</dd>
              </div>
              <div>
                <dt>Hospital</dt>
                <dd>{emergency.hospitalId}</dd>
              </div>
            </dl>

            <div className="narrative-block">
              <h4 className="subsection-title">Descripcion inicial</h4>
              <p>{emergency.initialDescription ?? 'Sin descripcion inicial.'}</p>
            </div>

            <div className="narrative-block">
              <h4 className="subsection-title">Observaciones</h4>
              <p>{emergency.observations ?? 'Sin observaciones adicionales.'}</p>
            </div>

            {canTriggerValidation ? (
              <button
                type="button"
                className="primary-button"
                disabled={isSubmitting}
                onClick={handleTriggerValidation}
              >
                {isSubmitting ? 'Enviando validacion...' : 'Enviar a validacion'}
              </button>
            ) : null}
          </section>

          <section className="panel-card">
            <div className="section-heading">
              <div>
                <h3>Estado del proceso</h3>
                <p>La validacion se crea desde el frontend y luego el agente responde via callback.</p>
              </div>
            </div>

            {validation ? (
              <>
                <dl className="details-grid single-column-grid">
                  <div>
                    <dt>Validacion</dt>
                    <dd>{validation.id}</dd>
                  </div>
                  <div>
                    <dt>Estado del proceso</dt>
                    <dd>
                      <StatusBadge tone={getStatusTone(validation.processStatus)}>
                        {validation.processStatus}
                      </StatusBadge>
                    </dd>
                  </div>
                  <div>
                    <dt>Solicitud</dt>
                    <dd>{new Date(validation.requestDate).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt>Motor</dt>
                    <dd>{validation.engineVersion ?? 'Pendiente de respuesta del agente'}</dd>
                  </div>
                  <div>
                    <dt>Decision</dt>
                    <dd>{validation.decision ?? 'Pendiente'}</dd>
                  </div>
                  <div>
                    <dt>Respuesta</dt>
                    <dd>{validation.responseDate ? new Date(validation.responseDate).toLocaleString() : 'Pendiente'}</dd>
                  </div>
                </dl>

                {validation.processStatus === 'procesando' && !isValidationTimedOutVisually ? (
                  <div className="feedback-box feedback-info">
                    La validacion sigue en analisis. Cuando el agente responda, esta vista mostrara el resultado y el
                    acceso al informe automaticamente.
                  </div>
                ) : null}

                {isValidationTimedOutVisually ? (
                  <div className="feedback-box feedback-warning">
                    La validacion lleva mas de {VISUAL_RETRY_TIMEOUT_MINUTES} minutos en procesamiento. Puedes
                    reintentarlo sobre la misma validacion.
                  </div>
                ) : null}

                {isValidationFailed ? (
                  <div className="feedback-box feedback-danger">
                    <strong>La validacion fallo.</strong>
                    <br />
                    {validation.errorDetails ?? 'No se recibio detalle tecnico del error.'}
                    <br />
                    Puedes reintentar el envio usando la misma validacion para no perder el historial del caso.
                  </div>
                ) : null}

                {canRetryValidation ? (
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={isRetryingValidation}
                    onClick={handleRetryValidation}
                  >
                    {isRetryingValidation ? 'Reintentando validacion...' : 'Reintentar validacion'}
                  </button>
                ) : null}

                {validation.reportId ? (
                  <Link className="primary-button link-button" to={`/app/reports/${validation.reportId}`}>
                    Ver informe
                  </Link>
                ) : (
                  <div className="feedback-box feedback-info">
                    El informe aun no esta disponible para esta validacion. Se habilitara automaticamente cuando el
                    backend reciba el resultado final del agente.
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state compact-empty">
                <h3>Sin validacion disponible</h3>
                <p>
                  {validationMessage ||
                    'Cuando dispares la validacion, aqui veras el estado real del proceso y el informe aparecera en esta misma pantalla.'}
                </p>
              </div>
            )}

            <div className="feedback-box feedback-info">
              Esta vista consulta la validacion mas reciente por `emergencyId` y habilita `Ver informe` cuando ya existe un reporte asociado.
            </div>
          </section>
        </div>
      )}
    </section>
  )
}
