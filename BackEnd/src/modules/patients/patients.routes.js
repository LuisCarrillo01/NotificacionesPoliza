const express = require('express');
const patientsController = require('./patients.controller');
const patientsValidation = require('./patients.validation');
const asyncHandler = require('../../shared/utils/asyncHandler');
const validateRequest = require('../../shared/validators/validateRequest');

const patientsRouter = express.Router();

patientsRouter.post(
  '/',
  validateRequest(patientsValidation.validateCreatePatientRequest),
  asyncHandler(patientsController.createPatient)
);

patientsRouter.get('/document/:documentType/:documentNumber', asyncHandler(patientsController.getPatientByDocument));
patientsRouter.get('/:patientId', asyncHandler(patientsController.getPatientById));

module.exports = patientsRouter;
