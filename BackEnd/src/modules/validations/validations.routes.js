const express = require('express');
const validationsController = require('./validations.controller');
const asyncHandler = require('../../shared/utils/asyncHandler');

const validationsRouter = express.Router();

validationsRouter.post(
  '/emergencies/:emergencyId/validations',
  asyncHandler(validationsController.createValidationForEmergency)
);

module.exports = validationsRouter;
