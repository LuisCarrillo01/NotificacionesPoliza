const { executeQuery } = require('../../config/database');

async function findPoliciesByPatientId(patientId) {
  const queryResult = await executeQuery('SELECT * FROM polizas WHERE paciente_id = $1 ORDER BY created_at DESC', [patientId]);
  return queryResult.rows;
}

async function findPolicyById(policyId) {
  const queryResult = await executeQuery('SELECT * FROM polizas WHERE id = $1 LIMIT 1', [policyId]);
  return queryResult.rows[0] || null;
}

async function findPolicyByPatientIdAndPolicyNumber(patientId, policyNumber) {
  const queryResult = await executeQuery(
    `
      SELECT *
      FROM polizas
      WHERE paciente_id = $1 AND numero_poliza = $2
      LIMIT 1
    `,
    [patientId, policyNumber]
  );

  return queryResult.rows[0] || null;
}

async function findCoveragesByPolicyId(policyId) {
  const queryResult = await executeQuery('SELECT * FROM coberturas WHERE poliza_id = $1 ORDER BY created_at ASC', [policyId]);
  return queryResult.rows;
}

module.exports = {
  findPoliciesByPatientId,
  findPolicyById,
  findPolicyByPatientIdAndPolicyNumber,
  findCoveragesByPolicyId
};
