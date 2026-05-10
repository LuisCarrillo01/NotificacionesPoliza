const express = require('express');
const authController = require('./auth.controller');
const authValidation = require('./auth.validation');
const asyncHandler = require('../../shared/utils/asyncHandler');
const validateRequest = require('../../shared/validators/validateRequest');
const authenticationMiddleware = require('../../shared/middlewares/authentication.middleware');

const authRouter = express.Router();

authRouter.post(
  '/login',
  validateRequest(authValidation.validateLoginRequest),
  asyncHandler(authController.login)
);

authRouter.get('/me', authenticationMiddleware, asyncHandler(authController.getAuthenticatedUser));

module.exports = authRouter;
