const AppError = require('../../shared/errors/AppError');
const policyRepository = require('./policies.repository');

function mapPolicyRecord(policyRecord) {
  return {
    id: policyRecord.id,
    insuranceCompanyId: policyRecord.aseguradora_id,
    patientId: policyRecord.paciente_id,
    policyNumber: policyRecord.numero_poliza,
    policyType: policyRecord.tipo,
    policyStatus: policyRecord.estado,
    planName: policyRecord.plan_nombre,
    generalConditions: policyRecord.condiciones_generales,
    startDate: policyRecord.fecha_inicio,
    endDate: policyRecord.fecha_fin,
    createdAt: policyRecord.created_at,
    updatedAt: policyRecord.updated_at
  };
}

function mapCoverageRecord(coverageRecord) {
  return {
    id: coverageRecord.id,
    policyId: coverageRecord.poliza_id,
    coverageType: coverageRecord.tipo_cobertura,
    maximumAmount: coverageRecord.monto_maximo,
    coveragePercentage: coverageRecord.porcentaje_cobertura,
    description: coverageRecord.descripcion,
    appliesToEmergency: coverageRecord.aplica_emergencia,
    createdAt: coverageRecord.created_at,
    updatedAt: coverageRecord.updated_at
  };
}

async function getPoliciesByPatientId(patientId) {
  const policyRecords = await policyRepository.findPoliciesByPatientId(patientId);
  return policyRecords.map(mapPolicyRecord);
}

async function getPolicyById(policyId) {
  const policyRecord = await policyRepository.findPolicyById(policyId);

  if (!policyRecord) {
    throw new AppError('Policy not found', 404);
  }

  return mapPolicyRecord(policyRecord);
}

async function getCoveragesByPolicyId(policyId) {
  const policyRecord = await policyRepository.findPolicyById(policyId);

  if (!policyRecord) {
    throw new AppError('Policy not found', 404);
  }

  const coverageRecords = await policyRepository.findCoveragesByPolicyId(policyId);
  return coverageRecords.map(mapCoverageRecord);
}

module.exports = {
  getPoliciesByPatientId,
  getPolicyById,
  getCoveragesByPolicyId
};
