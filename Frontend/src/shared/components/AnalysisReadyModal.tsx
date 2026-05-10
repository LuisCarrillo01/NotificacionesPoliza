import { Link } from 'react-router-dom'

type AnalysisReadyModalProps = {
  isOpen: boolean
  caseCode: string
  reportId: string
  onClose: () => void
}

export function AnalysisReadyModal({ isOpen, caseCode, reportId, onClose }: AnalysisReadyModalProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="analysis-modal-overlay" role="presentation">
      <div
        className="analysis-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="analysis-modal-title"
        aria-describedby="analysis-modal-description"
      >
        <span className="eyebrow">Proceso completado</span>
        <h3 id="analysis-modal-title">La emergencia ya fue analizada</h3>
        <p id="analysis-modal-description" className="analysis-modal-copy">
          El caso <strong>{caseCode}</strong> ya tiene una validacion completada. Puedes abrir el informe generado ahora mismo.
        </p>

        <div className="analysis-modal-actions">
          <Link className="primary-button link-button" to={`/app/reports/${reportId}`} onClick={onClose}>
            Ver informe
          </Link>
          <button type="button" className="secondary-button" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
