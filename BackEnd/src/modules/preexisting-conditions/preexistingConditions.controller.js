const preexistingConditionsService = require('./preexistingConditions.service');

async function getPreexistingConditionsByPatientId(request, response) {
  const preexistingConditions = await preexistingConditionsService.getPreexistingConditionsByPatientId(
    request.params.patientId
  );

  response.status(200).json(preexistingConditions);
}

async function createPreexistingCondition(request, response) {
  const { patientId } = request.params;
  const conditionData = request.body;
  const newCondition = await preexistingConditionsService.addPreexistingCondition(patientId, conditionData);
  response.status(201).json(newCondition);
}

module.exports = {
  getPreexistingConditionsByPatientId,
  createPreexistingCondition
};
