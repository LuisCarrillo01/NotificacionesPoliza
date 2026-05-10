const emergenciesService = require('./emergencies.service');

async function createEmergency(request, response) {
  const createdEmergency = await emergenciesService.registerEmergency(
    request.body,
    request.authenticatedUser
  );

  response.status(201).json(createdEmergency);
}

async function getEmergencyById(request, response) {
  const emergency = await emergenciesService.getEmergencyById(
    request.params.emergencyId,
    request.authenticatedUser
  );

  response.status(200).json(emergency);
}

async function listEmergencies(request, response) {
  const emergencies = await emergenciesService.listEmergencies(request.authenticatedUser);
  response.status(200).json(emergencies);
}

async function getLatestValidationByEmergencyId(request, response) {
  const validation = await emergenciesService.getLatestValidationByEmergencyId(
    request.params.emergencyId,
    request.authenticatedUser
  );
  response.status(200).json(validation);
}

module.exports = {
  createEmergency,
  getEmergencyById,
  listEmergencies,
  getLatestValidationByEmergencyId
};
