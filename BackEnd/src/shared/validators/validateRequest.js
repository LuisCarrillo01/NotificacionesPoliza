const AppError = require('../errors/AppError');

function validateRequest(validationHandler) {
  return function requestValidator(request, response, next) {
    const validationErrors = validationHandler(request);

    if (validationErrors.length > 0) {
      return next(new AppError('Request validation failed', 400, validationErrors));
    }

    return next();
  };
}

module.exports = validateRequest;
