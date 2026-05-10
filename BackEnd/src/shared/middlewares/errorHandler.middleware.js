function errorHandler(error, request, response, next) {
  const statusCode = error.statusCode || 500;
  const responseBody = {
    message: error.message || 'Internal server error'
  };

  if (error.details) {
    responseBody.details = error.details;
  }

  if (process.env.NODE_ENV !== 'production' && error.stack) {
    responseBody.stack = error.stack;
  }

  response.status(statusCode).json(responseBody);
}

module.exports = errorHandler;
