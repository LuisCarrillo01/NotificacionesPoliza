const express = require('express');
const policiesController = require('./policies.controller');
const asyncHandler = require('../../shared/utils/asyncHandler');

const policiesRouter = express.Router();

policiesRouter.get('/:policyId', asyncHandler(policiesController.getPolicyById));
policiesRouter.get('/:policyId/coverages', asyncHandler(policiesController.getCoveragesByPolicyId));

module.exports = policiesRouter;
