import { useState, useEffect, type FormEvent } from 'react'
import { useAuth } from '../../contexts/useAuth'
import {
  ApiError,
  createPatient,
  createPolicy,
  listInsurers,
  createPreexistingCondition,
  getPatientByDocument,
} from '../../lib/api'
import type { Patient, Insurer } from '../../types/api'
import { ErrorAlert } from '../../shared/components/ErrorAlert'
import { PageHeader } from '../../shared/components/PageHeader'
import { PREDEFINED_PLANS } from '../../shared/constants/plans'

export function NewPatientPage() {
  const { token, user } = useAuth()
  const [patientLookup, setPatientLookup] = useState({ documentType: 'cedula', documentNumber: '' })
  const [patient, setPatient] = useState<Patient | null>(null)
  const [insurers, setInsurers] = useState<Insurer[]>([])
  
  const [submitLoading, setSubmitLoading] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  
  const [showPolicyModal, setShowPolicyModal] = useState(false)
  const [policySubmitLoading, setPolicySubmitLoading] = useState(false)
  const [policyForm, setPolicyForm] = useState({
    insurerId: '',
    selectedPlanId: '',
  })

  const [showPreexistingModal, setShowPreexistingModal] = useState(false)
  const [preexistingSubmitLoading, setPreexistingSubmitLoading] = useState(false)
  const [preexistingForm, setPreexistingForm] = useState({
    conditionName: '',
    description: '',
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

  if (user?.role !== 'registrador_emergencia') {
    return (
      <section className="page-stack">
        <PageHeader
          eyebrow="Acceso restringido"
          title="Solo registro hospitalario"
          description="Este formulario solo esta disponible para usuarios que crean pacientes."
        />
      </section>
    )
  }

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

      setPatient(createdPatient)
      setFeedbackMessage('Paciente registrado exitosamente.')
      setShowPreexistingModal(true)
      
      // Limpiar formulario para nuevo registro potencial
      setPatientLookup({ documentType: 'cedula', documentNumber: '' })
      setPatientForm({
        firstName: '',
        lastName: '',
        birthDate: '',
        gender: '',
        phoneNumber: '',
        emailAddress: '',
        address: '',
      })
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        // El paciente ya existe, vamos a cargarlo
        try {
          const existingPatient = await getPatientByDocument(patientLookup.documentType, patientLookup.documentNumber, token)
          setPatient(existingPatient)
          setFeedbackMessage('Este paciente ya estaba registrado. Puedes continuar agregando preexistencias o pólizas.')
          setShowPreexistingModal(true)
          
          setPatientLookup({ documentType: 'cedula', documentNumber: '' })
          setPatientForm({
            firstName: '', lastName: '', birthDate: '', gender: '', phoneNumber: '', emailAddress: '', address: '',
          })
        } catch (lookupError) {
          setErrorMessage('El paciente existe pero no pudo ser recuperado.')
        }
      } else if (error instanceof ApiError) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('No se pudo registrar el paciente. Verifica los datos ingresados.')
      }
    } finally {
      setSubmitLoading(false)
    }
  }

  async function handleCreatePreexisting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token || !patient) return
    
    setPreexistingSubmitLoading(true)
    try {
      await createPreexistingCondition(patient.id, {
        conditionName: preexistingForm.conditionName,
        description: preexistingForm.description,
      }, token)
      
      setShowPreexistingModal(false)
      setFeedbackMessage('Preexistencia registrada. Puedes asignarle una póliza opcionalmente.')
      setShowPolicyModal(true)
      
      setPreexistingForm({ conditionName: '', description: '' })
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('No se pudo registrar la preexistencia.')
      }
    } finally {
      setPreexistingSubmitLoading(false)
    }
  }

  function handleSkipPreexisting() {
      setShowPreexistingModal(false)
      setFeedbackMessage('Paciente registrado. Puedes asignarle una póliza opcionalmente.')
      setShowPolicyModal(true)
  }

  async function handleCreatePolicy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token || !patient) return
    
    const plan = PREDEFINED_PLANS.find(p => p.id === policyForm.selectedPlanId)
    if (!plan) return

    const generatedPolicyNumber = `POL-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`

    setPolicySubmitLoading(true)
    try {
      await createPolicy({
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
      
      setShowPolicyModal(false)
      setFeedbackMessage('Poliza asignada correctamente. Puedes registrar otro paciente.')
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
        eyebrow="Registro hospitalario"
        title="Crear paciente"
        description="Ingresa los datos para registrar un nuevo paciente en el sistema."
      />

      {feedbackMessage ? <div className="feedback-box feedback-success">{feedbackMessage}</div> : null}
      {errorMessage ? <ErrorAlert message={errorMessage} /> : null}

      <div className="panel-card" style={{ maxWidth: '800px' }}>
        <div className="section-heading">
          <div>
            <h3>Datos personales</h3>
            <p>Llena los datos para guardar el paciente en la base de datos.</p>
          </div>
        </div>

        <form className="stack-form" onSubmit={handleCreatePatient}>
          <div className="split-grid">
            <label className="field-group">
              <span>Tipo de documento</span>
              <input value="cedula" disabled />
            </label>
            <label className="field-group">
              <span>Numero de cedula</span>
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

          <div style={{ marginTop: '1.5rem' }}>
            <button type="submit" className="primary-button" disabled={submitLoading}>
              {submitLoading ? 'Registrando paciente...' : 'Guardar paciente'}
            </button>
          </div>
        </form>
      </div>

      {showPreexistingModal && patient ? (
        <div className="analysis-modal-overlay">
          <div className="analysis-modal-card">
            <h3>Declaracion de preexistencias</h3>
            <p className="analysis-modal-copy">
              ¿El paciente <strong>{patient.firstName} {patient.lastName}</strong> tiene alguna condicion preexistente?
            </p>
            <form className="stack-form" onSubmit={handleCreatePreexisting}>
              <label className="field-group">
                <span>Enfermedad o condicion</span>
                <input
                  value={preexistingForm.conditionName}
                  onChange={(e) => setPreexistingForm(curr => ({ ...curr, conditionName: e.target.value }))}
                  required
                  placeholder="Ej: Hipertension, Diabetes, Asma"
                />
              </label>
              <label className="field-group">
                <span>Descripcion o notas (opcional)</span>
                <textarea
                  value={preexistingForm.description}
                  onChange={(e) => setPreexistingForm(curr => ({ ...curr, description: e.target.value }))}
                  rows={3}
                />
              </label>
              <div className="analysis-modal-actions" style={{ marginTop: '1rem' }}>
                <button type="submit" className="primary-button" disabled={preexistingSubmitLoading}>
                  {preexistingSubmitLoading ? 'Guardando...' : 'Guardar preexistencia'}
                </button>
                <button type="button" className="secondary-button" onClick={handleSkipPreexisting} disabled={preexistingSubmitLoading}>
                  No tiene / Omitir
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

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
