const patientsService = require('./patients.service');

async function createPatient(request, response) {
  const createdPatient = await patientsService.registerPatient(request.body);
  response.status(201).json(createdPatient);
}

async function getPatientById(request, response) {
  const patient = await patientsService.getPatientById(request.params.patientId);
  response.status(200).json(patient);
}

async function getPatientByDocument(request, response) {
  const patient = await patientsService.getPatientByDocument(
    request.params.documentType,
    request.params.documentNumber
  );

  response.status(200).json(patient);
}

module.exports = {
  createPatient,
  getPatientById,
  getPatientByDocument
};
