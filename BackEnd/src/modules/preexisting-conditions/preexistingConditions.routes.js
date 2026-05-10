const express = require('express');
const preexistingConditionsController = require('./preexistingConditions.controller');
const asyncHandler = require('../../shared/utils/asyncHandler');

const preexistingConditionsRouter = express.Router();

preexistingConditionsRouter.get(
  '/patients/:patientId/preexisting-conditions',
  asyncHandler(preexistingConditionsController.getPreexistingConditionsByPatientId)
);

module.exports = preexistingConditionsRouter;
