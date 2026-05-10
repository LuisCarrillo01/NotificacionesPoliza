const preexistingConditionsService = require('./preexistingConditions.service');

async function getPreexistingConditionsByPatientId(request, response) {
  const preexistingConditions = await preexistingConditionsService.getPreexistingConditionsByPatientId(
    request.params.patientId
  );

  response.status(200).json(preexistingConditions);
}

module.exports = {
  getPreexistingConditionsByPatientId
};
