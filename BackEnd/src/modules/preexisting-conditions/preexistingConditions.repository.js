const { executeQuery } = require('../../config/database');

async function findPreexistingConditionsByPatientId(patientId) {
  const queryResult = await executeQuery(
    'SELECT * FROM preexistencias WHERE paciente_id = $1 ORDER BY created_at DESC',
    [patientId]
  );

  return queryResult.rows;
}

async function insertPreexistingCondition(patientId, conditionData) {
  const query = `
    INSERT INTO preexistencias 
      (paciente_id, codigo_cie, nombre_condicion, descripcion, fecha_diagnostico, activa)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const values = [
    patientId,
    conditionData.diagnosisCode || null,
    conditionData.conditionName,
    conditionData.description || null,
    conditionData.diagnosisDate || null,
    conditionData.isActive !== undefined ? conditionData.isActive : true
  ];
  
  const queryResult = await executeQuery(query, values);
  return queryResult.rows[0];
}

module.exports = {
  findPreexistingConditionsByPatientId,
  insertPreexistingCondition
};
