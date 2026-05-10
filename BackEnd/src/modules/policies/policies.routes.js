const express = require('express');
const policiesController = require('./policies.controller');
const policiesValidation = require('./policies.validation');
const asyncHandler = require('../../shared/utils/asyncHandler');
const validateRequest = require('../../shared/validators/validateRequest');

const policiesRouter = express.Router();

policiesRouter.get('/insurers', asyncHandler(policiesController.getInsurers));

policiesRouter.post(
  '/',
  validateRequest(policiesValidation.validateCreatePolicyRequest),
  asyncHandler(policiesController.createPolicy)
);

policiesRouter.get('/:policyId', asyncHandler(policiesController.getPolicyById));
policiesRouter.get('/:policyId/coverages', asyncHandler(policiesController.getCoveragesByPolicyId));

module.exports = policiesRouter;
