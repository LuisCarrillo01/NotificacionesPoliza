function validateLoginRequest(request) {
  const validationErrors = [];
  const { usernameOrEmail, password } = request.body;

  if (!usernameOrEmail || typeof usernameOrEmail !== 'string') {
    validationErrors.push('usernameOrEmail is required and must be a string');
  }

  if (!password || typeof password !== 'string') {
    validationErrors.push('password is required and must be a string');
  }

  return validationErrors;
}

module.exports = {
  validateLoginRequest
};
