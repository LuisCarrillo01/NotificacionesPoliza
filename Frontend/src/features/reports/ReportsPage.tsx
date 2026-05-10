import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'
import { ApiError, getReportById } from '../../lib/api'
import type { Report } from '../../types/api'
import { ErrorAlert } from '../../shared/components/ErrorAlert'
import { LoadingBlock } from '../../shared/components/LoadingBlock'
import { PageHeader } from '../../shared/components/PageHeader'

export function ReportsPage() {
  const { reportId: routeReportId } = useParams()
  const { token } = useAuth()
  const navigate = useNavigate()
  const [reportIdInput, setReportIdInput] = useState(routeReportId ?? '')
  const [report, setReport] = useState<Report | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!routeReportId || !token) {
      return
    }

    async function loadReport() {
      const activeToken = token
      const activeReportId = routeReportId

      if (!activeToken || !activeReportId) {
        return
      }

      setIsLoading(true)
      setErrorMessage('')

      try {
        setReport(await getReportById(activeReportId, activeToken))
      } catch (error) {
        setReport(null)

        if (error instanceof ApiError) {
          setErrorMessage(error.message)
        } else {
          setErrorMessage('No fue posible obtener el informe solicitado.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    void loadReport()
  }, [routeReportId, token])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!reportIdInput.trim()) {
      return
    }

    navigate(`/app/reports/${reportIdInput.trim()}`)
  }

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Consulta puntual"
        title="Informes de validacion"
        description="El backend expone consulta por ID de informe; esta vista te permite resolverlo de forma manual."
      />

      <section className="panel-card">
        <form className="toolbar-card inline-form" onSubmit={handleSubmit}>
          <label className="field-group grow-field">
            <span>ID del informe</span>
            <input
              value={reportIdInput}
              onChange={(event) => setReportIdInput(event.target.value)}
              placeholder="UUID del informe"
            />
          </label>
          <button type="submit" className="primary-button">
            Consultar informe
          </button>
        </form>
      </section>

      {errorMessage ? <ErrorAlert message={errorMessage} /> : null}

      {isLoading ? (
        <LoadingBlock title="Cargando informe" description="Consultando documento emitido por el agente." />
      ) : routeReportId && report ? (
        <section className="panel-card report-card">
          <div className="section-heading">
            <div>
              <h3>{report.reportCode}</h3>
              <p>Validacion asociada: {report.validationId}</p>
            </div>
          </div>

          <div className="report-grid">
            <article>
              <h4 className="subsection-title">Resumen ejecutivo</h4>
              <p>{report.executiveSummary}</p>
            </article>
            <article>
              <h4 className="subsection-title">Motivo de decision</h4>
              <p>{report.decisionReason}</p>
            </article>
            <article>
              <h4 className="subsection-title">Analisis de cobertura</h4>
              <p>{report.coverageAnalysis ?? 'Sin analisis detallado.'}</p>
            </article>
            <article>
              <h4 className="subsection-title">Analisis de preexistencias</h4>
              <p>{report.preexistingConditionsAnalysis ?? 'Sin preexistencias relevantes.'}</p>
            </article>
            <article>
              <h4 className="subsection-title">Accion sugerida</h4>
              <p>{report.suggestedAction ?? 'Sin accion sugerida adicional.'}</p>
            </article>
            <article>
              <h4 className="subsection-title">Fecha de generacion</h4>
              <p>{new Date(report.generatedAt).toLocaleString()}</p>
            </article>
          </div>
        </section>
      ) : (
        <section className="panel-card">
          <div className="feedback-box feedback-info">
            Introduce un identificador de informe para consultar el documento almacenado en el backend.
          </div>
        </section>
      )}
    </section>
  )
}
