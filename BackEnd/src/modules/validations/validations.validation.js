function validateValidationResultRequest(request) {
  const validationErrors = [];
  const { processStatus, decision } = request.body;

  if (!processStatus || typeof processStatus !== 'string') {
    validationErrors.push('processStatus is required and must be a string');
  }

  if (decision && typeof decision !== 'string') {
    validationErrors.push('decision must be a string when provided');
  }

  return validationErrors;
}

module.exports = {
  validateValidationResultRequest
};
