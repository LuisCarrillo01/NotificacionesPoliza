const AppError = require('../../shared/errors/AppError');
const patientRepository = require('./patients.repository');

function mapPatientRecord(patientRecord) {
  return {
    id: patientRecord.id,
    documentType: patientRecord.tipo_documento,
    documentNumber: patientRecord.numero_documento,
    firstName: patientRecord.nombres,
    lastName: patientRecord.apellidos,
    birthDate: patientRecord.fecha_nacimiento,
    gender: patientRecord.sexo,
    phoneNumber: patientRecord.telefono,
    emailAddress: patientRecord.email,
    address: patientRecord.direccion,
    createdAt: patientRecord.created_at,
    updatedAt: patientRecord.updated_at
  };
}

async function registerPatient(patientData) {
  const existingPatient = await patientRepository.findPatientByDocument(
    patientData.documentType,
    patientData.documentNumber
  );

  if (existingPatient) {
    throw new AppError('El paciente con este documento ya se encuentra registrado en el sistema.', 409);
  }

  const createdPatient = await patientRepository.createPatient(patientData);
  return mapPatientRecord(createdPatient);
}

async function getPatientById(patientId) {
  const patientRecord = await patientRepository.findPatientById(patientId);

  if (!patientRecord) {
    throw new AppError('Patient not found', 404);
  }

  return mapPatientRecord(patientRecord);
}

async function getPatientByDocument(documentType, documentNumber) {
  const patientRecord = await patientRepository.findPatientByDocument(documentType, documentNumber);

  if (!patientRecord) {
    throw new AppError('Patient not found', 404);
  }

  return mapPatientRecord(patientRecord);
}

async function getRecentPatients(limit = 5) {
  const patientRecords = await patientRepository.findRecentPatients(limit);
  return patientRecords.map(mapPatientRecord);
}

module.exports = {
  registerPatient,
  getPatientById,
  getPatientByDocument,
  getRecentPatients
};
