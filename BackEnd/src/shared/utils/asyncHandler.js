function asyncHandler(requestHandler) {
  return function wrappedAsyncHandler(request, response, next) {
    Promise.resolve(requestHandler(request, response, next)).catch(next);
  };
}

module.exports = asyncHandler;
