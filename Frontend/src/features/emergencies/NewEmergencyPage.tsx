import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'
import {
  ApiError,
  createEmergency,
  createPatient,
  createPolicy,
  getPatientByDocument,
  listInsurers,
  listPoliciesByPatient,
  listPreexistingConditionsByPatient,
} from '../../lib/api'
import type { Patient, Policy, PreexistingCondition, Insurer } from '../../types/api'
import { EmptyState } from '../../shared/components/EmptyState'
import { ErrorAlert } from '../../shared/components/ErrorAlert'
import { PageHeader } from '../../shared/components/PageHeader'
import { StatusBadge } from '../../shared/components/StatusBadge'
import { getStatusTone } from '../../shared/utils/statusTone'
import { PREDEFINED_PLANS } from '../../shared/constants/plans'

const emergencyTypes = ['cardiaca', 'respiratoria', 'trauma', 'neurologica', 'general']
const priorityLevels = ['alta', 'media', 'critica']

export function NewEmergencyPage() {
  const { token, user } = useAuth()
  const navigate = useNavigate()
  const [patientLookup, setPatientLookup] = useState({ documentType: 'cedula', documentNumber: '' })
  const [patient, setPatient] = useState<Patient | null>(null)
  const [policies, setPolicies] = useState<Policy[]>([])
  const [insurers, setInsurers] = useState<Insurer[]>([])
  const [preexistingConditions, setPreexistingConditions] = useState<PreexistingCondition[]>([])
  const [selectedPolicyNumber, setSelectedPolicyNumber] = useState('')
  const [createPatientMode, setCreatePatientMode] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const [showPolicyModal, setShowPolicyModal] = useState(false)
  const [policySubmitLoading, setPolicySubmitLoading] = useState(false)
  const [policyForm, setPolicyForm] = useState({
    insurerId: '',
    selectedPlanId: '',
  })

  const [patientForm, setPatientForm] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    gender: '',
    phoneNumber: '',
    emailAddress: '',
    address: '',
  })
  const [emergencyForm, setEmergencyForm] = useState({
    emergencyType: 'cardiaca',
    priorityLevel: 'critica',
    admissionDate: '',
    initialDescription: '',
    observations: '',
  })

  const canSubmitEmergency = useMemo(() => {
    return Boolean(patient && selectedPolicyNumber && emergencyForm.admissionDate)
  }, [emergencyForm.admissionDate, patient, selectedPolicyNumber])

  useEffect(() => {
    if (token && user?.role === 'registrador_emergencia') {
      listInsurers(token)
        .then((data) => {
          setInsurers(data)
          if (data.length > 0) {
            setPolicyForm((prev) => ({ ...prev, insurerId: data[0].id }))
          }
        })
        .catch(console.error)
    }
  }, [token, user])

  if (user?.role !== 'registrador_emergencia') {
    return (
      <section className="page-stack">
        <PageHeader
          eyebrow="Acceso restringido"
          title="Solo registro hospitalario"
          description="Este formulario solo esta disponible para usuarios que crean emergencias."
        />
      </section>
    )
  }

  async function hydratePatientContext(foundPatient: Patient, activeToken: string) {
    const [patientPolicies, conditions] = await Promise.all([
      listPoliciesByPatient(foundPatient.id, activeToken),
      listPreexistingConditionsByPatient(foundPatient.id, activeToken),
    ])

    setPatient(foundPatient)
    setPolicies(patientPolicies)
    setPreexistingConditions(conditions)
    setSelectedPolicyNumber(patientPolicies[0]?.policyNumber ?? '')
  }

  async function handlePatientLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!token) {
      return
    }

    setSearchLoading(true)
    setFeedbackMessage('')
    setErrorMessage('')
    setCreatePatientMode(false)

    try {
      const foundPatient = await getPatientByDocument(
        patientLookup.documentType,
        patientLookup.documentNumber,
        token,
      )

      await hydratePatientContext(foundPatient, token)
      setFeedbackMessage('Paciente encontrado y contexto cargado correctamente.')
    } catch (error) {
      setPatient(null)
      setPolicies([])
      setPreexistingConditions([])
      setSelectedPolicyNumber('')

      if (error instanceof ApiError && error.status === 404) {
        setCreatePatientMode(true)
        setFeedbackMessage('No existe un paciente con ese documento. Puedes registrarlo aqui mismo.')
      } else if (error instanceof ApiError) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('No fue posible consultar el paciente.')
      }
    } finally {
      setSearchLoading(false)
    }
  }

  async function handleCreatePatient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!token) {
      return
    }

    setSubmitLoading(true)
    setErrorMessage('')
    setFeedbackMessage('')

    try {
      const createdPatient = await createPatient(
        {
          documentType: patientLookup.documentType,
          documentNumber: patientLookup.documentNumber,
          ...patientForm,
        },
        token,
      )

      setCreatePatientMode(false)
      await hydratePatientContext(createdPatient, token)
      setFeedbackMessage('Paciente registrado. Puedes asignarle una poliza opcionalmente.')
      setShowPolicyModal(true)
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('No se pudo registrar el paciente.')
      }
    } finally {
      setSubmitLoading(false)
    }
  }

  async function handleCreateEmergency(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!token || !patient) {
      return
    }

    setSubmitLoading(true)
    setErrorMessage('')
    setFeedbackMessage('')

    try {
      const createdEmergency = await createEmergency(
        {
          patientDocumentType: patient.documentType,
          patientDocumentNumber: patient.documentNumber,
          policyNumber: selectedPolicyNumber,
          ...emergencyForm,
        },
        token,
      )

      navigate(`/app/emergencies/${createdEmergency.id}/review`)
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('No se pudo registrar la emergencia.')
      }
    } finally {
      setSubmitLoading(false)
    }
  }

  async function handleCreatePolicy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token || !patient) return

    const plan = PREDEFINED_PLANS.find(p => p.id === policyForm.selectedPlanId)
    if (!plan) return

    const generatedPolicyNumber = `POL-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`

    setPolicySubmitLoading(true)
    try {
      const createdPolicy = await createPolicy({
        insurerId: policyForm.insurerId,
        patientId: patient.id,
        policyNumber: generatedPolicyNumber,
        type: plan.type,
        status: 'vigente',
        planName: plan.name,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        coverages: plan.coverages
      }, token)

      setPolicies(prev => [...prev, createdPolicy])
      setSelectedPolicyNumber(createdPolicy.policyNumber)
      setShowPolicyModal(false)
      setFeedbackMessage('Poliza asignada correctamente. Ya puedes continuar con la emergencia.')
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('No se pudo crear la poliza.')
      }
    } finally {
      setPolicySubmitLoading(false)
    }
  }

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Ingreso hospitalario"
        title="Nueva emergencia"
        description="Primero valida o registra al paciente, luego selecciona la poliza y crea el caso clinico."
      />

      {feedbackMessage ? <div className="feedback-box feedback-success">{feedbackMessage}</div> : null}
      {errorMessage ? <ErrorAlert message={errorMessage} /> : null}

      <div className="content-grid two-columns">
        <section className="panel-card">
          <div className="section-heading">
            <div>
              <h3>1. Buscar paciente por documento</h3>
              <p>Este paso usa el endpoint de consulta por documento del backend.</p>
            </div>
          </div>

          <form className="stack-form" onSubmit={handlePatientLookup}>
            <div className="split-grid">
              <label className="field-group">
                <span>Tipo de documento</span>
                <input value="cedula" disabled />
              </label>

              <label className="field-group">
                <span>Numero</span>
                <input
                  value={patientLookup.documentNumber}
                  onChange={(event) => {
                    const val = event.target.value.replace(/\D/g, '').slice(0, 10);
                    setPatientLookup((current) => ({ ...current, documentNumber: val }))
                  }}
                  placeholder="Ej: 1712345678"
                  pattern="\d{10}"
                  title="La cedula debe tener exactamente 10 digitos numericos"
                  required
                />
              </label>
            </div>

            <button type="submit" className="primary-button" disabled={searchLoading}>
              {searchLoading ? 'Buscando paciente...' : 'Buscar paciente'}
            </button>
          </form>

          {createPatientMode ? (
            <form className="stack-form nested-form" onSubmit={handleCreatePatient}>
              <div className="section-heading compact-heading">
                <div>
                  <h3>Registrar paciente</h3>
                  <p>El backend permite crearlo antes de registrar la emergencia.</p>
                </div>
              </div>

              <div className="split-grid">
                <label className="field-group">
                  <span>Nombres</span>
                  <input
                    value={patientForm.firstName}
                    onChange={(event) =>
                      setPatientForm((current) => ({ ...current, firstName: event.target.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, '') }))
                    }
                    minLength={2}
                    maxLength={50}
                    title="Solo se permiten letras y espacios"
                    required
                  />
                </label>
                <label className="field-group">
                  <span>Apellidos</span>
                  <input
                    value={patientForm.lastName}
                    onChange={(event) =>
                      setPatientForm((current) => ({ ...current, lastName: event.target.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, '') }))
                    }
                    minLength={2}
                    maxLength={50}
                    title="Solo se permiten letras y espacios"
                    required
                  />
                </label>
              </div>

              <div className="split-grid">
                <label className="field-group">
                  <span>Fecha de nacimiento</span>
                  <input
                    type="date"
                    value={patientForm.birthDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(event) =>
                      setPatientForm((current) => ({ ...current, birthDate: event.target.value }))
                    }
                    required
                  />
                </label>
                <label className="field-group">
                  <span>Genero</span>
                  <select
                    value={patientForm.gender}
                    onChange={(event) =>
                      setPatientForm((current) => ({ ...current, gender: event.target.value }))
                    }
                    required
                  >
                    <option value="" disabled>Seleccione genero</option>
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                    <option value="otro">Otro</option>
                  </select>
                </label>
              </div>

              <div className="split-grid">
                <label className="field-group">
                  <span>Telefono</span>
                  <input
                    value={patientForm.phoneNumber}
                    onChange={(event) => {
                      const val = event.target.value.replace(/\D/g, '').slice(0, 10);
                      setPatientForm((current) => ({ ...current, phoneNumber: val }))
                    }}
                    placeholder="Ej: 0912345678"
                    pattern="\d{7,10}"
                    title="El telefono debe tener entre 7 y 10 digitos numericos"
                  />
                </label>
                <label className="field-group">
                  <span>Correo</span>
                  <input
                    type="email"
                    value={patientForm.emailAddress}
                    onChange={(event) =>
                      setPatientForm((current) => ({ ...current, emailAddress: event.target.value }))
                    }
                  />
                </label>
              </div>

              <label className="field-group">
                <span>Direccion</span>
                <textarea
                  value={patientForm.address}
                  onChange={(event) =>
                    setPatientForm((current) => ({ ...current, address: event.target.value }))
                  }
                  rows={3}
                />
              </label>

              <button type="submit" className="secondary-button" disabled={submitLoading}>
                {submitLoading ? 'Registrando paciente...' : 'Guardar paciente'}
              </button>
            </form>
          ) : null}
        </section>

        <section className="panel-card">
          <div className="section-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3>2. Contexto del paciente</h3>
              <p>Polizas y preexistencias cargadas a partir del paciente seleccionado.</p>
            </div>
            {patient && (
              <button type="button" className="secondary-button" onClick={() => setShowPolicyModal(true)}>
                Asignar poliza
              </button>
            )}
          </div>

          {!patient ? (
            <EmptyState
              title="Sin paciente activo"
              description="Busca un paciente para cargar su contexto antes de crear la emergencia."
            />
          ) : (
            <div className="stack-list">
              <article className="detail-card">
                <div className="list-card-row">
                  <strong>
                    {patient.firstName} {patient.lastName}
                  </strong>
                  <StatusBadge tone="info">{patient.documentType}</StatusBadge>
                </div>
                <p>
                  {patient.documentNumber} · {patient.birthDate}
                </p>
              </article>

              <div>
                <h4 className="subsection-title">Polizas encontradas</h4>
                {policies.length === 0 ? (
                  <EmptyState
                    title="Sin polizas asociadas"
                    description="No existe una poliza para este paciente. La emergencia no podra registrarse aun."
                  />
                ) : (
                  <div className="stack-list compact-stack">
                    {policies.map((policy) => (
                      <label key={policy.id} className="selection-card">
                        <input
                          type="radio"
                          name="policyNumber"
                          checked={selectedPolicyNumber === policy.policyNumber}
                          onChange={() => setSelectedPolicyNumber(policy.policyNumber)}
                        />
                        <div>
                          <div className="list-card-row">
                            <strong>{policy.policyNumber}</strong>
                            <StatusBadge tone={getStatusTone(policy.policyStatus)}>
                              {policy.policyStatus}
                            </StatusBadge>
                          </div>
                          <p>
                            {policy.planName ?? 'Sin plan'} · {policy.policyType} · {policy.startDate} a{' '}
                            {policy.endDate}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="subsection-title">Preexistencias</h4>
                {preexistingConditions.length === 0 ? (
                  <p className="muted-text">No hay preexistencias registradas para este paciente.</p>
                ) : (
                  <div className="stack-list compact-stack">
                    {preexistingConditions.map((condition) => (
                      <article key={condition.id} className="detail-card compact-card">
                        <div className="list-card-row">
                          <strong>{condition.conditionName}</strong>
                          <StatusBadge tone={condition.isActive ? 'warning' : 'neutral'}>
                            {condition.isActive ? 'activa' : 'inactiva'}
                          </StatusBadge>
                        </div>
                        <p>{condition.description ?? 'Sin descripcion adicional.'}</p>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="panel-card">
        <div className="section-heading">
          <div>
            <h3>3. Registrar la emergencia</h3>
            <p>Cuando el paciente y la poliza esten listos, crea el caso para enviarlo al flujo.</p>
          </div>
        </div>

        <div className="feedback-box feedback-info">
          El codigo del caso sera generado automaticamente al registrar la emergencia.
        </div>

        <form className="stack-form" onSubmit={handleCreateEmergency}>
          <div className="split-grid tri-grid">
            <label className="field-group">
              <span>Tipo de emergencia</span>
              <select
                value={emergencyForm.emergencyType}
                onChange={(event) =>
                  setEmergencyForm((current) => ({ ...current, emergencyType: event.target.value }))
                }
              >
                {emergencyTypes.map((emergencyType) => (
                  <option key={emergencyType} value={emergencyType}>
                    {emergencyType}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-group">
              <span>Prioridad</span>
              <select
                value={emergencyForm.priorityLevel}
                onChange={(event) =>
                  setEmergencyForm((current) => ({ ...current, priorityLevel: event.target.value }))
                }
              >
                {priorityLevels.map((priorityLevel) => (
                  <option key={priorityLevel} value={priorityLevel}>
                    {priorityLevel}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="field-group">
            <span>Fecha y hora de ingreso</span>
            <input
              type="datetime-local"
              value={emergencyForm.admissionDate}
              onChange={(event) =>
                setEmergencyForm((current) => ({ ...current, admissionDate: event.target.value }))
              }
              required
            />
          </label>

          <label className="field-group">
            <span>Descripcion inicial</span>
            <textarea
              value={emergencyForm.initialDescription}
              onChange={(event) =>
                setEmergencyForm((current) => ({ ...current, initialDescription: event.target.value }))
              }
              rows={4}
              placeholder="Paciente con dolor toracico intenso."
            />
          </label>

          <label className="field-group">
            <span>Observaciones</span>
            <textarea
              value={emergencyForm.observations}
              onChange={(event) =>
                setEmergencyForm((current) => ({ ...current, observations: event.target.value }))
              }
              rows={3}
              placeholder="Ingreso por emergencia."
            />
          </label>

          <button type="submit" className="primary-button" disabled={!canSubmitEmergency || submitLoading}>
            {submitLoading ? 'Guardando emergencia...' : 'Registrar emergencia'}
          </button>
        </form>
      </section>

      {showPolicyModal && (
        <div className="analysis-modal-overlay" role="presentation">
          <div className="analysis-modal-card" style={{ maxWidth: '500px' }} role="dialog" aria-modal="true">
            <span className="eyebrow">Paso opcional</span>
            <h3>Asignar poliza al paciente</h3>
            <p className="analysis-modal-copy">
              Ingresa los detalles de la poliza para <strong>{patient?.firstName} {patient?.lastName}</strong>. Si el paciente no tiene poliza o no la conoces en este momento, puedes omitir este paso.
            </p>

            <form className="stack-form" onSubmit={handleCreatePolicy} style={{ marginTop: '1.5rem' }}>
              <label className="field-group">
                <span>Aseguradora</span>
                <select
                  value={policyForm.insurerId}
                  onChange={(e) => setPolicyForm(curr => ({ ...curr, insurerId: e.target.value }))}
                  required
                >
                  <option value="" disabled>Seleccionar aseguradora</option>
                  {insurers.map(ins => (
                    <option key={ins.id} value={ins.id}>{ins.name}</option>
                  ))}
                </select>
              </label>
              <div className="split-grid">
                <label className="field-group">
                  <span>Plan</span>
                  <select
                    value={policyForm.selectedPlanId}
                    onChange={(e) => setPolicyForm(curr => ({ ...curr, selectedPlanId: e.target.value }))}
                    required
                  >
                    <option value="" disabled>Seleccionar un plan</option>
                    {PREDEFINED_PLANS.map(plan => (
                      <option key={plan.id} value={plan.id}>{plan.name}</option>
                    ))}
                  </select>
                </label>
              </div>

              {policyForm.selectedPlanId && (
                <div style={{ fontSize: '0.875rem', backgroundColor: 'var(--surface-color)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '0.5rem' }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', fontWeight: 600, color: 'var(--text-color)' }}>Detalle de coberturas:</h4>
                  <ul style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-color)' }}>
                    {PREDEFINED_PLANS.find(p => p.id === policyForm.selectedPlanId)?.coverages.map((cov, idx) => (
                      <li key={idx} style={{ marginBottom: '0.25rem' }}>
                        <div><strong>{cov.coverageType}</strong>: {cov.coveragePercentage}% (Monto Max: ${cov.maximumAmount})</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-color)', opacity: 0.8 }}>
                          {cov.description} · <strong>Aplica en emergencia:</strong> {cov.appliesToEmergency ? 'Sí' : 'No'}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="analysis-modal-actions" style={{ marginTop: '2rem' }}>
                <button type="submit" className="primary-button" disabled={policySubmitLoading}>
                  {policySubmitLoading ? 'Guardando...' : 'Asignar poliza'}
                </button>
                <button type="button" className="secondary-button" onClick={() => setShowPolicyModal(false)}>
                  Omitir paso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
