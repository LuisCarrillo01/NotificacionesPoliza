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

async function insertPolicy(policyData) {
  const queryResult = await executeQuery(
    `
      INSERT INTO polizas (aseguradora_id, paciente_id, numero_poliza, tipo, estado, plan_nombre, condiciones_generales, fecha_inicio, fecha_fin)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `,
    [
      policyData.insurerId,
      policyData.patientId,
      policyData.policyNumber,
      policyData.type,
      policyData.status,
      policyData.planName || null,
      policyData.generalConditions || null,
      policyData.startDate,
      policyData.endDate
    ]
  );
  return queryResult.rows[0];
}

async function insertCoverages(policyId, coverages) {
  if (!coverages || coverages.length === 0) return [];
  
  const insertedCoverages = [];
  for (const cov of coverages) {
    const res = await executeQuery(
      `
        INSERT INTO coberturas (poliza_id, tipo_cobertura, monto_maximo, porcentaje_cobertura, descripcion, aplica_emergencia)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `,
      [
        policyId,
        cov.coverageType,
        cov.maximumAmount || null,
        cov.coveragePercentage || null,
        cov.description || null,
        cov.appliesToEmergency || false
      ]
    );
    insertedCoverages.push(res.rows[0]);
  }
  return insertedCoverages;
}

async function findAllInsurers() {
  const queryResult = await executeQuery('SELECT id, codigo, nombre FROM aseguradoras WHERE activo = true ORDER BY nombre ASC');
  return queryResult.rows;
}

module.exports = {
  findPoliciesByPatientId,
  findPolicyById,
  findPolicyByPatientIdAndPolicyNumber,
  findCoveragesByPolicyId,
  insertPolicy,
  insertCoverages,
  findAllInsurers
};
