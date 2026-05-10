import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'
import { ApiError, cancelEmergency, getEmergencyById, getEmergencyValidation, triggerValidation } from '../../lib/api'
import type { Emergency, EmergencyValidation } from '../../types/api'
import { ErrorAlert } from '../../shared/components/ErrorAlert'
import { LoadingBlock } from '../../shared/components/LoadingBlock'
import { PageHeader } from '../../shared/components/PageHeader'
import { StatusBadge } from '../../shared/components/StatusBadge'
import { getStatusTone } from '../../shared/utils/statusTone'

export function EmergencyReviewPage() {
  const { emergencyId = '' } = useParams()
  const { token, user } = useAuth()
  const navigate = useNavigate()
  const [emergency, setEmergency] = useState<Emergency | null>(null)
  const [validation, setValidation] = useState<EmergencyValidation | null>(null)
  const [cancellationReason, setCancellationReason] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmittingValidation, setIsSubmittingValidation] = useState(false)
  const [isSubmittingCancellation, setIsSubmittingCancellation] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!token || !emergencyId) {
      return
    }

    async function loadEmergencyReview() {
      const activeToken = token

      if (!activeToken) {
        return
      }

      setIsLoading(true)
      setErrorMessage('')
      setFeedbackMessage('')

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
      } catch (error) {
        setValidation(null)
        if (error instanceof ApiError) {
          setErrorMessage(error.message)
        } else {
          setErrorMessage('No fue posible cargar la revision de la emergencia.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    void loadEmergencyReview()
  }, [emergencyId, token])

  const canActOnEmergency = useMemo(() => {
    return user?.role === 'registrador_emergencia' && emergency?.emergencyStatus === 'registrada' && !validation
  }, [emergency?.emergencyStatus, user?.role, validation])

  async function handleValidate() {
    if (!token || !emergency) {
      return
    }

    setIsSubmittingValidation(true)
    setErrorMessage('')
    setFeedbackMessage('')

    try {
      await triggerValidation(emergency.id, token)
      navigate(`/app/emergencies/${emergency.id}`)
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('No fue posible enviar la emergencia a validacion.')
      }
    } finally {
      setIsSubmittingValidation(false)
    }
  }

  async function handleCancel() {
    if (!token || !emergency) {
      return
    }

    setIsSubmittingCancellation(true)
    setErrorMessage('')
    setFeedbackMessage('')

    try {
      const cancelledEmergency = await cancelEmergency(emergency.id, token, cancellationReason.trim() || undefined)
      setEmergency(cancelledEmergency)
      setFeedbackMessage('La emergencia fue cancelada correctamente.')
      navigate(`/app/emergencies/${cancelledEmergency.id}`)
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('No fue posible cancelar la emergencia.')
      }
    } finally {
      setIsSubmittingCancellation(false)
    }
  }

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Revision previa"
        title="Confirmar emergencia"
        description="Revisa el caso antes de enviarlo a validacion o cancelarlo si el registro fue incorrecto."
      />

      {feedbackMessage ? <div className="feedback-box feedback-success">{feedbackMessage}</div> : null}
      {errorMessage ? <ErrorAlert message={errorMessage} /> : null}

      {isLoading || !emergency ? (
        <LoadingBlock title="Cargando revision" description="Recuperando la emergencia recien creada." />
      ) : (
        <div className="content-grid two-columns">
          <section className="panel-card">
            <div className="section-heading">
              <div>
                <h3>{emergency.caseCode}</h3>
                <p>Confirma que el paciente, la poliza y la informacion clinica sean correctos.</p>
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
                  <StatusBadge tone={getStatusTone(emergency.priorityLevel)}>{emergency.priorityLevel}</StatusBadge>
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
          </section>

          <section className="panel-card">
            <div className="section-heading">
              <div>
                <h3>Decidir siguiente paso</h3>
                <p>Una vez que valides, el agente tomara el caso. Si hubo un error, cancela el registro antes de continuar.</p>
              </div>
            </div>

            {validation ? (
              <div className="feedback-box feedback-info">
                Esta emergencia ya tiene una validacion asociada. Usa el detalle del caso para seguir el proceso.
              </div>
            ) : emergency.emergencyStatus === 'cancelada' ? (
              <div className="feedback-box feedback-info">
                Esta emergencia ya fue cancelada y no admite nuevas acciones operativas.
              </div>
            ) : null}

            <label className="field-group">
              <span>Motivo de cancelacion</span>
              <textarea
                value={cancellationReason}
                onChange={(event) => setCancellationReason(event.target.value)}
                rows={4}
                placeholder="Ejemplo: Registro duplicado o poliza incorrecta."
                disabled={!canActOnEmergency || isSubmittingValidation || isSubmittingCancellation}
              />
            </label>

            <div className="split-grid">
              <button
                type="button"
                className="primary-button"
                disabled={!canActOnEmergency || isSubmittingValidation || isSubmittingCancellation}
                onClick={handleValidate}
              >
                {isSubmittingValidation ? 'Enviando...' : 'Validar ahora'}
              </button>

              <button
                type="button"
                className="secondary-button"
                disabled={!canActOnEmergency || isSubmittingValidation || isSubmittingCancellation}
                onClick={handleCancel}
              >
                {isSubmittingCancellation ? 'Cancelando...' : 'Cancelar registro'}
              </button>
            </div>

            <Link className="text-link" to={`/app/emergencies/${emergency.id}`}>
              Ver detalle completo
            </Link>
          </section>
        </div>
      )}
    </section>
  )
}
