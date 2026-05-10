function validateCreateEmergencyRequest(request) {
  const validationErrors = [];
  const {
    patientDocumentType,
    patientDocumentNumber,
    policyNumber,
    emergencyType,
    priorityLevel,
    admissionDate
  } = request.body;

  if (!patientDocumentType || typeof patientDocumentType !== 'string') {
    validationErrors.push('patientDocumentType is required and must be a string');
  }

  if (!patientDocumentNumber || typeof patientDocumentNumber !== 'string') {
    validationErrors.push('patientDocumentNumber is required and must be a string');
  }

  if (!policyNumber || typeof policyNumber !== 'string') {
    validationErrors.push('policyNumber is required and must be a string');
  }

  if (!emergencyType || typeof emergencyType !== 'string') {
    validationErrors.push('emergencyType is required and must be a string');
  }

  if (!priorityLevel || typeof priorityLevel !== 'string') {
    validationErrors.push('priorityLevel is required and must be a string');
  }

  if (!admissionDate || typeof admissionDate !== 'string') {
    validationErrors.push('admissionDate is required and must be a string');
  }

  return validationErrors;
}

function validateCancelEmergencyRequest(request) {
  const validationErrors = [];
  const { cancellationReason } = request.body || {};

  if (cancellationReason !== undefined && typeof cancellationReason !== 'string') {
    validationErrors.push('cancellationReason must be a string');
  }

  return validationErrors;
}

module.exports = {
  validateCreateEmergencyRequest,
  validateCancelEmergencyRequest
};
