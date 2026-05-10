const express = require('express');
const reportsController = require('./reports.controller');
const asyncHandler = require('../../shared/utils/asyncHandler');

const reportsRouter = express.Router();

reportsRouter.get('/validation/:validationId', asyncHandler(reportsController.getReportByValidationId));
reportsRouter.get('/:reportId', asyncHandler(reportsController.getReportById));

module.exports = reportsRouter;
