function notFoundMiddleware(request, response) {
  response.status(404).json({
    message: 'Resource not found'
  });
}

module.exports = notFoundMiddleware;
