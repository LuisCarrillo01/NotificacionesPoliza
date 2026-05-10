const { executeQuery } = require('../../config/database');

async function createEmergency(emergencyData) {
  const queryText = `
    INSERT INTO emergencias (
      paciente_id,
      hospital_id,
      poliza_id,
      usuario_registro_id,
      codigo_caso,
      tipo_emergencia,
      prioridad,
      estado,
      fecha_ingreso,
      descripcion_inicial,
      observaciones
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `;

  const queryParams = [
    emergencyData.patientId,
    emergencyData.hospitalId,
    emergencyData.policyId,
    emergencyData.registeredByUserId,
    emergencyData.caseCode,
    emergencyData.emergencyType,
    emergencyData.priorityLevel,
    emergencyData.emergencyStatus,
    emergencyData.admissionDate,
    emergencyData.initialDescription,
    emergencyData.observations
  ];

  const queryResult = await executeQuery(queryText, queryParams);
  return queryResult.rows[0];
}

async function findLatestCaseCodeByDatePrefix(datePrefix) {
  const queryText = `
    SELECT codigo_caso
    FROM emergencias
    WHERE codigo_caso LIKE $1
    ORDER BY codigo_caso DESC
    LIMIT 1
  `;

  const queryResult = await executeQuery(queryText, [`EM-${datePrefix}-%`]);
  return queryResult.rows[0]?.codigo_caso || null;
}

async function findEmergencyById(emergencyId) {
  const queryResult = await executeQuery('SELECT * FROM emergencias WHERE id = $1 LIMIT 1', [emergencyId]);
  return queryResult.rows[0] || null;
}

async function findEmergenciesByHospitalId(hospitalId) {
  const queryResult = await executeQuery(
    'SELECT * FROM emergencias WHERE hospital_id = $1 ORDER BY fecha_ingreso DESC',
    [hospitalId]
  );

  return queryResult.rows;
}

async function updateEmergencyStatus(emergencyId, emergencyStatus, client = null) {
  const queryResult = await executeQuery(
    'UPDATE emergencias SET estado = $2 WHERE id = $1 RETURNING *',
    [emergencyId, emergencyStatus],
    client
  );

  return queryResult.rows[0] || null;
}

async function cancelEmergency(emergencyId, observations, emergencyStatus) {
  const queryResult = await executeQuery(
    'UPDATE emergencias SET estado = $2, observaciones = $3, updated_at = now() WHERE id = $1 RETURNING *',
    [emergencyId, emergencyStatus, observations]
  );

  return queryResult.rows[0] || null;
}

module.exports = {
  createEmergency,
  findLatestCaseCodeByDatePrefix,
  findEmergencyById,
  findEmergenciesByHospitalId,
  updateEmergencyStatus,
  cancelEmergency
};
