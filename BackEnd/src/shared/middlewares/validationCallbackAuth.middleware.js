const environmentConfig = require('../../config/env');
const AppError = require('../errors/AppError');

function maskToken(token) {
  if (!token) {
    return null;
  }

  if (token.length <= 8) {
    return `${token.slice(0, 2)}...${token.slice(-2)}`;
  }

  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

function validationCallbackAuthMiddleware(request, response, next) {
  const callbackToken = request.headers['x-callback-token'];

  console.log('[validation-callback-auth] Incoming callback request', {
    method: request.method,
    url: request.originalUrl,
    hasConfiguredToken: Boolean(environmentConfig.validationResultCallbackToken),
    hasReceivedToken: Boolean(callbackToken),
    receivedTokenPreview: maskToken(callbackToken)
  });

  if (!environmentConfig.validationResultCallbackToken) {
    console.log('[validation-callback-auth] No callback token configured; allowing request');
    return next();
  }

  if (!callbackToken || callbackToken !== environmentConfig.validationResultCallbackToken) {
    console.warn('[validation-callback-auth] Callback token rejected', {
      expectedTokenPreview: maskToken(environmentConfig.validationResultCallbackToken),
      receivedTokenPreview: maskToken(callbackToken)
    });
    return next(new AppError('Invalid validation callback token', 401));
  }

  console.log('[validation-callback-auth] Callback token accepted');

  return next();
}

module.exports = validationCallbackAuthMiddleware;
