function validateCreatePolicyRequest(request) {
  const validationErrors = [];
  const {
    insurerId,
    patientId,
    policyNumber,
    type,
    status,
    startDate,
    endDate,
    coverages
  } = request.body;

  if (!insurerId || typeof insurerId !== 'string') {
    validationErrors.push('insurerId is required and must be a string');
  }
  if (!patientId || typeof patientId !== 'string') {
    validationErrors.push('patientId is required and must be a string');
  }
  if (!policyNumber || typeof policyNumber !== 'string') {
    validationErrors.push('policyNumber is required and must be a string');
  }
  if (!['individual', 'familiar', 'empresarial'].includes(type)) {
    validationErrors.push('type must be individual, familiar, or empresarial');
  }
  if (!['vigente', 'vencida', 'suspendida', 'cancelada'].includes(status)) {
    validationErrors.push('status must be vigente, vencida, suspendida, or cancelada');
  }
  if (!startDate || typeof startDate !== 'string') {
    validationErrors.push('startDate is required and must be a string');
  }
  if (!endDate || typeof endDate !== 'string') {
    validationErrors.push('endDate is required and must be a string');
  }
  if (coverages && !Array.isArray(coverages)) {
    validationErrors.push('coverages must be an array');
  }

  return validationErrors;
}

module.exports = {
  validateCreatePolicyRequest
};
