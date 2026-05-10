const validationsService = require('./validations.service');

async function createValidationForEmergency(request, response) {
  const createdValidation = await validationsService.createValidationForEmergency(
    request.params.emergencyId,
    request.authenticatedUser
  );

  response.status(201).json(createdValidation);
}

async function receiveValidationResult(request, response) {
  console.log('[validations-controller] Callback received', {
    validationId: request.params.validationId,
    hasCallbackToken: Boolean(request.headers['x-callback-token']),
    processStatus: request.body.processStatus,
    decision: request.body.decision
  });

  const updatedValidation = await validationsService.receiveValidationResult(
    request.params.validationId,
    request.body
  );

  response.status(200).json(updatedValidation);
}

module.exports = {
  createValidationForEmergency,
  receiveValidationResult
};
