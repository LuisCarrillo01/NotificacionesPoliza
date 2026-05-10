const AppError = require('../../shared/errors/AppError');
const reportsRepository = require('./reports.repository');

function mapReportRecord(reportRecord) {
  return {
    id: reportRecord.id,
    validationId: reportRecord.validacion_id,
    reportCode: reportRecord.codigo_informe,
    executiveSummary: reportRecord.resumen_ejecutivo,
    coverageAnalysis: reportRecord.analisis_cobertura,
    preexistingConditionsAnalysis: reportRecord.analisis_preexistencias,
    decisionReason: reportRecord.motivo_decision,
    suggestedAction: reportRecord.accion_sugerida,
    generatedAt: reportRecord.fecha_generacion,
    contentJson: reportRecord.contenido_json,
    createdAt: reportRecord.created_at,
    updatedAt: reportRecord.updated_at
  };
}

async function getReportById(reportId) {
  const reportRecord = await reportsRepository.findReportById(reportId);

  if (!reportRecord) {
    throw new AppError('Report not found', 404);
  }

  return mapReportRecord(reportRecord);
}

async function getReportByValidationId(validationId) {
  const reportRecord = await reportsRepository.findReportByValidationId(validationId);

  if (!reportRecord) {
    throw new AppError('Report not found for validation', 404);
  }

  return mapReportRecord(reportRecord);
}

module.exports = {
  getReportById,
  getReportByValidationId
};
