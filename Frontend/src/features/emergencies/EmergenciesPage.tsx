import { ClipboardPlus, Search, ShieldAlert } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'
import { ApiError, listEmergencies } from '../../lib/api'
import type { Emergency } from '../../types/api'
import { EmptyState } from '../../shared/components/EmptyState'
import { ErrorAlert } from '../../shared/components/ErrorAlert'
import { LoadingBlock } from '../../shared/components/LoadingBlock'
import { PageHeader } from '../../shared/components/PageHeader'
import { StatusBadge } from '../../shared/components/StatusBadge'
import { getStatusTone } from '../../shared/utils/statusTone'

export function EmergenciesPage() {
  const { token } = useAuth()
  const [emergencies, setEmergencies] = useState<Emergency[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!token) {
      return
    }

    async function loadEmergencies() {
      const activeToken = token

      if (!activeToken) {
        return
      }

      setIsLoading(true)
      setErrorMessage('')

      try {
        setEmergencies(await listEmergencies(activeToken))
      } catch (error) {
        if (error instanceof ApiError) {
          setErrorMessage(error.message)
        } else {
          setErrorMessage('No se pudo consultar el historial de emergencias.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    void loadEmergencies()
  }, [token])

  const filteredEmergencies = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    if (!normalizedSearch) {
      return emergencies
    }

    return emergencies.filter(
      (emergency) =>
        emergency.caseCode.toLowerCase().includes(normalizedSearch) ||
        emergency.emergencyType.toLowerCase().includes(normalizedSearch) ||
        emergency.priorityLevel.toLowerCase().includes(normalizedSearch),
    )
  }, [emergencies, search])

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Casos hospitalarios"
        title="Emergencias registradas"
        description="Consulta el flujo operativo y entra al detalle de cada caso para disparar la validacion."
      />

      <div className="panel-card toolbar-card">
        <label className="field-group grow-field field-with-icon">
          <span>Buscar por codigo, tipo o prioridad</span>
          <div className="input-shell">
            <Search size={18} aria-hidden="true" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="EM-0001, cardiaca, critica"
          />
          </div>
        </label>
        <Link className="primary-button" to="/app/emergencies/new">
          <ClipboardPlus size={18} aria-hidden="true" />
          Nueva emergencia
        </Link>
      </div>

      {errorMessage ? <ErrorAlert message={errorMessage} /> : null}

      {isLoading ? (
        <LoadingBlock title="Consultando casos" description="Recuperando emergencias visibles para tu hospital." />
      ) : filteredEmergencies.length === 0 ? (
        <EmptyState
          title="Sin emergencias visibles"
          description="Todavia no hay casos para este usuario o el filtro no devolvio resultados."
        />
      ) : (
        <section className="panel-card table-panel">
          <div className="mobile-card-list">
            {filteredEmergencies.map((emergency) => (
              <article key={emergency.id} className="mobile-entity-card">
                <div className="mobile-entity-head">
                  <div className="mobile-entity-title">
                    <div className="feature-icon-wrap feature-icon-soft">
                      <ShieldAlert size={18} aria-hidden="true" />
                    </div>
                    <div>
                      <strong>{emergency.caseCode}</strong>
                      <p>{emergency.emergencyType}</p>
                    </div>
                  </div>
                  <StatusBadge tone={getStatusTone(emergency.emergencyStatus)}>
                    {emergency.emergencyStatus}
                  </StatusBadge>
                </div>

                <div className="mobile-entity-grid">
                  <div>
                    <span className="meta-text">Prioridad</span>
                    <StatusBadge tone={getStatusTone(emergency.priorityLevel)}>
                      {emergency.priorityLevel}
                    </StatusBadge>
                  </div>
                  <div>
                    <span className="meta-text">Ingreso</span>
                    <strong>{new Date(emergency.admissionDate).toLocaleString()}</strong>
                  </div>
                </div>

                <Link className="text-link" to={`/app/emergencies/${emergency.id}`}>
                  Ver detalle
                </Link>
              </article>
            ))}
          </div>

          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Codigo</th>
                  <th>Tipo</th>
                  <th>Prioridad</th>
                  <th>Estado</th>
                  <th>Ingreso</th>
                  <th>Accion</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmergencies.map((emergency) => (
                  <tr key={emergency.id}>
                    <td>{emergency.caseCode}</td>
                    <td>{emergency.emergencyType}</td>
                    <td>
                      <StatusBadge tone={getStatusTone(emergency.priorityLevel)}>
                        {emergency.priorityLevel}
                      </StatusBadge>
                    </td>
                    <td>
                      <StatusBadge tone={getStatusTone(emergency.emergencyStatus)}>
                        {emergency.emergencyStatus}
                      </StatusBadge>
                    </td>
                    <td>{new Date(emergency.admissionDate).toLocaleString()}</td>
                    <td>
                      <Link className="text-link" to={`/app/emergencies/${emergency.id}`}>
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </section>
  )
}
