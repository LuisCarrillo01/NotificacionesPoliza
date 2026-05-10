const express = require('express');
const validationsController = require('./validations.controller');
const asyncHandler = require('../../shared/utils/asyncHandler');

const validationsRouter = express.Router();

validationsRouter.post('/:validationId/retry', asyncHandler(validationsController.retryValidation));

module.exports = validationsRouter;
