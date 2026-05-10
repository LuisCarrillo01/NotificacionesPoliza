const AppError = require('../errors/AppError');

function authorizeRoles(allowedRoles) {
  return function authorizationMiddleware(request, response, next) {
    const authenticatedUser = request.authenticatedUser;

    if (!authenticatedUser) {
      return next(new AppError('Authenticated user not found in request', 401));
    }

    if (!allowedRoles.includes(authenticatedUser.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }

    return next();
  };
}

module.exports = authorizeRoles;
