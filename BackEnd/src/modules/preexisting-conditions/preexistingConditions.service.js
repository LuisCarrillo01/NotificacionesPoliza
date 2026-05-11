const preexistingConditionsRepository = require('./preexistingConditions.repository');

function mapPreexistingConditionRecord(preexistingConditionRecord) {
  return {
    id: preexistingConditionRecord.id,
    patientId: preexistingConditionRecord.paciente_id,
    diagnosisCode: preexistingConditionRecord.codigo_cie,
    conditionName: preexistingConditionRecord.nombre_condicion,
    description: preexistingConditionRecord.descripcion,
    diagnosisDate: preexistingConditionRecord.fecha_diagnostico,
    isActive: preexistingConditionRecord.activa,
    createdAt: preexistingConditionRecord.created_at,
    updatedAt: preexistingConditionRecord.updated_at
  };
}

async function getPreexistingConditionsByPatientId(patientId) {
  const preexistingConditionRecords = await preexistingConditionsRepository.findPreexistingConditionsByPatientId(patientId);
  return preexistingConditionRecords.map(mapPreexistingConditionRecord);
}

async function addPreexistingCondition(patientId, conditionData) {
  const record = await preexistingConditionsRepository.insertPreexistingCondition(patientId, conditionData);
  return mapPreexistingConditionRecord(record);
}

module.exports = {
  getPreexistingConditionsByPatientId,
  addPreexistingCondition
};
