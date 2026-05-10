const { executeQuery } = require('../../config/database');

async function createValidation(validationData) {
  const queryText = `
    INSERT INTO validaciones (
      emergencia_id,
      estado_proceso,
      fecha_solicitud,
      payload_resumen
    )
    VALUES ($1, $2, now(), $3)
    RETURNING *
  `;

  const queryResult = await executeQuery(queryText, [
    validationData.emergencyId,
    validationData.processStatus,
    validationData.payloadSummary
  ]);

  return queryResult.rows[0];
}

async function findValidationById(validationId) {
  const queryResult = await executeQuery('SELECT * FROM validaciones WHERE id = $1 LIMIT 1', [validationId]);
  return queryResult.rows[0] || null;
}

async function findLatestValidationByEmergencyId(emergencyId) {
  const queryResult = await executeQuery(
    'SELECT * FROM validaciones WHERE emergencia_id = $1 ORDER BY fecha_solicitud DESC, created_at DESC LIMIT 1',
    [emergencyId]
  );
  return queryResult.rows[0] || null;
}

async function updateValidationProcessingStatus(validationId, processStatus, payloadSummary = null) {
  const queryText = `
    UPDATE validaciones
    SET estado_proceso = $2,
        payload_resumen = COALESCE($3, payload_resumen)
    WHERE id = $1
    RETURNING *
  `;

  const queryResult = await executeQuery(queryText, [validationId, processStatus, payloadSummary]);
  return queryResult.rows[0] || null;
}

async function completeValidation(validationId, validationResult) {
  const queryText = `
    UPDATE validaciones
    SET estado_proceso = $2,
        decision = $3,
        requiere_revision_manual = $4,
        fecha_respuesta = now(),
        motor_version = $5,
        payload_resumen = $6,
        error_detalle = $7
    WHERE id = $1
    RETURNING *
  `;

  const queryResult = await executeQuery(queryText, [
    validationId,
    validationResult.processStatus,
    validationResult.decision,
    validationResult.requiresManualReview,
    validationResult.engineVersion,
    validationResult.payloadSummary,
    validationResult.errorDetails
  ]);

  return queryResult.rows[0] || null;
}

module.exports = {
  createValidation,
  findValidationById,
  findLatestValidationByEmergencyId,
  updateValidationProcessingStatus,
  completeValidation
};
