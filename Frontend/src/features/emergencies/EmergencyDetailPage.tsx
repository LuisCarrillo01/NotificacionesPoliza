import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'
import { ApiError, getEmergencyById, getEmergencyValidation, triggerValidation } from '../../lib/api'
import type { Emergency, EmergencyValidation } from '../../types/api'
import { ErrorAlert } from '../../shared/components/ErrorAlert'
import { LoadingBlock } from '../../shared/components/LoadingBlock'
import { PageHeader } from '../../shared/components/PageHeader'
import { StatusBadge } from '../../shared/components/StatusBadge'
import { getStatusTone } from '../../shared/utils/statusTone'

export function EmergencyDetailPage() {
  const { emergencyId = '' } = useParams()
  const { token } = useAuth()
  const [emergency, setEmergency] = useState<Emergency | null>(null)
  const [validation, setValidation] = useState<EmergencyValidation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [validationMessage, setValidationMessage] = useState('')

  useEffect(() => {
    if (!token || !emergencyId) {
      return
    }

    async function loadEmergency() {
      const activeToken = token

      if (!activeToken) {
        return
      }

      setIsLoading(true)
      setErrorMessage('')
      setValidationMessage('')

      try {
        const [loadedEmergency, loadedValidation] = await Promise.all([
          getEmergencyById(emergencyId, activeToken),
          getEmergencyValidation(emergencyId, activeToken).catch((error) => {
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
        setIsLoading(false)
      }
    }

    void loadEmergency()
  }, [emergencyId, token])

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

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Detalle del caso"
        title="Emergencia medica"
        description="Vista operativa del caso, lista para lanzar el proceso de validacion."
      />

      {feedbackMessage ? <div className="feedback-box feedback-success">{feedbackMessage}</div> : null}
      {errorMessage ? <ErrorAlert message={errorMessage} /> : null}

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

            <button
              type="button"
              className="primary-button"
              disabled={isSubmitting || emergency.emergencyStatus === 'en_validacion'}
              onClick={handleTriggerValidation}
            >
              {isSubmitting ? 'Enviando validacion...' : 'Enviar a validacion'}
            </button>
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

                {validation.reportId ? (
                  <Link className="primary-button link-button" to={`/app/reports/${validation.reportId}`}>
                    Ver informe
                  </Link>
                ) : (
                  <div className="feedback-box feedback-info">
                    El informe aun no esta disponible para esta validacion.
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state compact-empty">
                <h3>Sin validacion disponible</h3>
                <p>{validationMessage || 'Cuando dispares la validacion, aqui veras el estado real del proceso.'}</p>
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
