function buildValidationAgentPayload(validationContext) {
  return {
    validationId: validationContext.validation.id,
    emergency: validationContext.emergency,
    patient: validationContext.patient,
    policy: validationContext.policy,
    coverages: validationContext.coverages,
    preexistingConditions: validationContext.preexistingConditions,
    callback: {
      validationId: validationContext.validation.id,
      callbackPath: validationContext.callbackPath
    }
  };
}

module.exports = {
  buildValidationAgentPayload
};
