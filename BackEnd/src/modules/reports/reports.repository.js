const { executeQuery } = require('../../config/database');

async function createValidationReport(reportData) {
  const queryText = `
    INSERT INTO informes_validacion (
      validacion_id,
      codigo_informe,
      resumen_ejecutivo,
      analisis_cobertura,
      analisis_preexistencias,
      motivo_decision,
      accion_sugerida,
      fecha_generacion,
      contenido_json
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, now()), $9)
    ON CONFLICT (validacion_id)
    DO UPDATE SET
      codigo_informe = EXCLUDED.codigo_informe,
      resumen_ejecutivo = EXCLUDED.resumen_ejecutivo,
      analisis_cobertura = EXCLUDED.analisis_cobertura,
      analisis_preexistencias = EXCLUDED.analisis_preexistencias,
      motivo_decision = EXCLUDED.motivo_decision,
      accion_sugerida = EXCLUDED.accion_sugerida,
      fecha_generacion = EXCLUDED.fecha_generacion,
      contenido_json = EXCLUDED.contenido_json,
      updated_at = now()
    RETURNING *
  `;

  const queryParams = [
    reportData.validationId,
    reportData.reportCode,
    reportData.executiveSummary,
    reportData.coverageAnalysis,
    reportData.preexistingConditionsAnalysis,
    reportData.decisionReason,
    reportData.suggestedAction,
    reportData.generatedAt,
    reportData.contentJson
  ];

  const queryResult = await executeQuery(queryText, queryParams);
  return queryResult.rows[0];
}

async function findReportById(reportId) {
  const queryResult = await executeQuery('SELECT * FROM informes_validacion WHERE id = $1 LIMIT 1', [reportId]);
  return queryResult.rows[0] || null;
}

async function findReportByValidationId(validationId) {
  const queryResult = await executeQuery(
    'SELECT * FROM informes_validacion WHERE validacion_id = $1 ORDER BY fecha_generacion DESC LIMIT 1',
    [validationId]
  );
  return queryResult.rows[0] || null;
}

module.exports = {
  createValidationReport,
  findReportById,
  findReportByValidationId
};
