function validateCreatePatientRequest(request) {
  const validationErrors = [];
  const {
    documentType,
    documentNumber,
    firstName,
    lastName,
    birthDate
  } = request.body;

  if (!documentType || typeof documentType !== 'string') {
    validationErrors.push('documentType is required and must be a string');
  }

  if (!documentNumber || typeof documentNumber !== 'string') {
    validationErrors.push('documentNumber is required and must be a string');
  }

  if (!firstName || typeof firstName !== 'string') {
    validationErrors.push('firstName is required and must be a string');
  }

  if (!lastName || typeof lastName !== 'string') {
    validationErrors.push('lastName is required and must be a string');
  }

  if (!birthDate || typeof birthDate !== 'string') {
    validationErrors.push('birthDate is required and must be a string');
  }

  return validationErrors;
}

module.exports = {
  validateCreatePatientRequest
};
