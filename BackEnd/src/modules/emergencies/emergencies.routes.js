const express = require('express');
const emergenciesController = require('./emergencies.controller');
const emergenciesValidation = require('./emergencies.validation');
const asyncHandler = require('../../shared/utils/asyncHandler');
const validateRequest = require('../../shared/validators/validateRequest');

const emergenciesRouter = express.Router();

emergenciesRouter.post(
  '/',
  validateRequest(emergenciesValidation.validateCreateEmergencyRequest),
  asyncHandler(emergenciesController.createEmergency)
);

emergenciesRouter.get('/', asyncHandler(emergenciesController.listEmergencies));
emergenciesRouter.get('/:emergencyId/validation', asyncHandler(emergenciesController.getLatestValidationByEmergencyId));
emergenciesRouter.get('/:emergencyId', asyncHandler(emergenciesController.getEmergencyById));

module.exports = emergenciesRouter;
