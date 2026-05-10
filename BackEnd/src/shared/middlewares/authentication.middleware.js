const jwt = require('jsonwebtoken');
const environmentConfig = require('../../config/env');
const AppError = require('../errors/AppError');

function authenticationMiddleware(request, response, next) {
  const authorizationHeader = request.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication token is required', 401));
  }

  const token = authorizationHeader.replace('Bearer ', '');

  try {
    const decodedToken = jwt.verify(token, environmentConfig.jwtSecret);

    request.authenticatedUser = {
      id: decodedToken.sub,
      role: decodedToken.role,
      hospitalId: decodedToken.hospitalId,
      insuranceCompanyId: decodedToken.insuranceCompanyId
    };

    return next();
  } catch (error) {
    return next(new AppError('Invalid authentication token', 401));
  }
}

module.exports = authenticationMiddleware;
