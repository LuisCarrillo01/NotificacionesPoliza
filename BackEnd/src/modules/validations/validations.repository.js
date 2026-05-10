const { executeQuery } = require('../../config/database');

async function createValidation(validationData, client = null) {
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
  ], client);

  return queryResult.rows[0];
}

async function findValidationById(validationId, client = null) {
  const queryResult = await executeQuery('SELECT * FROM validaciones WHERE id = $1 LIMIT 1', [validationId], client);
  return queryResult.rows[0] || null;
}

async function findLatestValidationByEmergencyId(emergencyId, client = null) {
  const queryResult = await executeQuery(
    'SELECT * FROM validaciones WHERE emergencia_id = $1 ORDER BY fecha_solicitud DESC, created_at DESC LIMIT 1',
    [emergencyId],
    client
  );
  return queryResult.rows[0] || null;
}

async function updateValidationProcessingStatus(validationId, processStatus, payloadSummary = null, client = null) {
  const queryText = `
    UPDATE validaciones
    SET estado_proceso = $2,
        payload_resumen = COALESCE($3, payload_resumen)
    WHERE id = $1
    RETURNING *
  `;

  const queryResult = await executeQuery(queryText, [validationId, processStatus, payloadSummary], client);
  return queryResult.rows[0] || null;
}

async function completeValidation(validationId, validationResult, client = null) {
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
  ], client);

  return queryResult.rows[0] || null;
}

async function resetValidationForRetry(validationId, payloadSummary, client = null) {
  const queryText = `
    UPDATE validaciones
    SET estado_proceso = $2,
        decision = NULL,
        requiere_revision_manual = false,
        fecha_solicitud = now(),
        fecha_respuesta = NULL,
        motor_version = NULL,
        payload_resumen = $3,
        error_detalle = NULL,
        updated_at = now()
    WHERE id = $1
    RETURNING *
  `;

  const queryResult = await executeQuery(
    queryText,
    [validationId, 'procesando', payloadSummary],
    client
  );

  return queryResult.rows[0] || null;
}

module.exports = {
  createValidation,
  findValidationById,
  findLatestValidationByEmergencyId,
  updateValidationProcessingStatus,
  completeValidation,
  resetValidationForRetry
};
