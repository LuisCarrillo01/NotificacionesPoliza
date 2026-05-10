const AppError = require('../../shared/errors/AppError');
const emergencyStatus = require('../../shared/constants/emergencyStatus');
const roles = require('../../shared/constants/roles');
const emergencyRepository = require('./emergencies.repository');
const patientRepository = require('../patients/patients.repository');
const policyRepository = require('../policies/policies.repository');
const validationsRepository = require('../validations/validations.repository');
const reportsRepository = require('../reports/reports.repository');

const CASE_CODE_MAX_RETRIES = 3;

function formatCaseCodeSequence(sequenceNumber) {
  return String(sequenceNumber).padStart(4, '0');
}

function getDatePrefix(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function getNextCaseCode(latestCaseCode, datePrefix) {
  if (!latestCaseCode) {
    return `EM-${datePrefix}-0001`;
  }

  const currentSequence = Number(latestCaseCode.split('-').pop());
  const nextSequence = Number.isNaN(currentSequence) ? 1 : currentSequence + 1;
  return `EM-${datePrefix}-${formatCaseCodeSequence(nextSequence)}`;
}

async function generateCaseCode() {
  const datePrefix = getDatePrefix();
  const latestCaseCode = await emergencyRepository.findLatestCaseCodeByDatePrefix(datePrefix);
  return getNextCaseCode(latestCaseCode, datePrefix);
}

function isDuplicateCaseCodeError(error) {
  return error?.code === '23505' && error?.constraint === 'emergencias_codigo_caso_key';
}

function mapEmergencyRecord(emergencyRecord) {
  return {
    id: emergencyRecord.id,
    patientId: emergencyRecord.paciente_id,
    hospitalId: emergencyRecord.hospital_id,
    policyId: emergencyRecord.poliza_id,
    registeredByUserId: emergencyRecord.usuario_registro_id,
    caseCode: emergencyRecord.codigo_caso,
    emergencyType: emergencyRecord.tipo_emergencia,
    priorityLevel: emergencyRecord.prioridad,
    emergencyStatus: emergencyRecord.estado,
    admissionDate: emergencyRecord.fecha_ingreso,
    initialDescription: emergencyRecord.descripcion_inicial,
    observations: emergencyRecord.observaciones,
    createdAt: emergencyRecord.created_at,
    updatedAt: emergencyRecord.updated_at
  };
}

function mapValidationRecord(validationRecord, reportId = null) {
  return {
    id: validationRecord.id,
    emergencyId: validationRecord.emergencia_id,
    processStatus: validationRecord.estado_proceso,
    decision: validationRecord.decision,
    requiresManualReview: validationRecord.requiere_revision_manual,
    requestDate: validationRecord.fecha_solicitud,
    responseDate: validationRecord.fecha_respuesta,
    engineVersion: validationRecord.motor_version,
    payloadSummary: validationRecord.payload_resumen,
    errorDetails: validationRecord.error_detalle,
    reportId,
    createdAt: validationRecord.created_at,
    updatedAt: validationRecord.updated_at
  };
}

async function registerEmergency(emergencyData, authenticatedUser) {
  if (authenticatedUser.role !== roles.EMERGENCY_REGISTRAR) {
    throw new AppError('Only emergency registrars can create emergencies', 403);
  }

  const patientRecord = await patientRepository.findPatientByDocument(
    emergencyData.patientDocumentType,
    emergencyData.patientDocumentNumber
  );

  if (!patientRecord) {
    throw new AppError('Patient not found for the provided document', 404);
  }

  const policyRecord = await policyRepository.findPolicyByPatientIdAndPolicyNumber(
    patientRecord.id,
    emergencyData.policyNumber
  );

  if (!policyRecord) {
    throw new AppError('Policy not found for the provided patient and policy number', 404);
  }

  let createdEmergency = null;

  for (let attempt = 0; attempt < CASE_CODE_MAX_RETRIES; attempt += 1) {
    const generatedCaseCode = await generateCaseCode();

    try {
      createdEmergency = await emergencyRepository.createEmergency({
        patientId: patientRecord.id,
        hospitalId: authenticatedUser.hospitalId,
        policyId: policyRecord.id,
        registeredByUserId: authenticatedUser.id,
        caseCode: generatedCaseCode,
        emergencyType: emergencyData.emergencyType,
        priorityLevel: emergencyData.priorityLevel,
        emergencyStatus: emergencyStatus.REGISTERED,
        admissionDate: emergencyData.admissionDate,
        initialDescription: emergencyData.initialDescription,
        observations: emergencyData.observations
      });
      break;
    } catch (error) {
      if (!isDuplicateCaseCodeError(error) || attempt === CASE_CODE_MAX_RETRIES - 1) {
        throw error;
      }
    }
  }

  return mapEmergencyRecord(createdEmergency);
}

async function getEmergencyById(emergencyId, authenticatedUser) {
  const emergencyRecord = await emergencyRepository.findEmergencyById(emergencyId);

  if (!emergencyRecord) {
    throw new AppError('Emergency not found', 404);
  }

  if (authenticatedUser.hospitalId && emergencyRecord.hospital_id !== authenticatedUser.hospitalId) {
    throw new AppError('You do not have access to this emergency', 403);
  }

  return mapEmergencyRecord(emergencyRecord);
}

async function listEmergencies(authenticatedUser) {
  if (!authenticatedUser.hospitalId) {
    return [];
  }

  const emergencyRecords = await emergencyRepository.findEmergenciesByHospitalId(authenticatedUser.hospitalId);
  return emergencyRecords.map(mapEmergencyRecord);
}

async function getLatestValidationByEmergencyId(emergencyId, authenticatedUser) {
  const emergencyRecord = await emergencyRepository.findEmergencyById(emergencyId);

  if (!emergencyRecord) {
    throw new AppError('Emergency not found', 404);
  }

  if (authenticatedUser.hospitalId && emergencyRecord.hospital_id !== authenticatedUser.hospitalId) {
    throw new AppError('You do not have access to this emergency', 403);
  }

  const validationRecord = await validationsRepository.findLatestValidationByEmergencyId(emergencyId);

  if (!validationRecord) {
    throw new AppError('Validation not found for emergency', 404);
  }

  const reportRecord = await reportsRepository.findReportByValidationId(validationRecord.id);
  return mapValidationRecord(validationRecord, reportRecord?.id || null);
}

module.exports = {
  registerEmergency,
  getEmergencyById,
  listEmergencies,
  getLatestValidationByEmergencyId
};
