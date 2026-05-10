const { executeQuery } = require('../../config/database');

async function findPreexistingConditionsByPatientId(patientId) {
  const queryResult = await executeQuery(
    'SELECT * FROM preexistencias WHERE paciente_id = $1 ORDER BY created_at DESC',
    [patientId]
  );

  return queryResult.rows;
}

module.exports = {
  findPreexistingConditionsByPatientId
};
