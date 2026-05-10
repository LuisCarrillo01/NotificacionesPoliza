const express = require('express');
const authRouter = require('../modules/auth/auth.routes');
const patientsRouter = require('../modules/patients/patients.routes');
const policiesRouter = require('../modules/policies/policies.routes');
const policiesController = require('../modules/policies/policies.controller');
const preexistingConditionsRouter = require('../modules/preexisting-conditions/preexistingConditions.routes');
const emergenciesRouter = require('../modules/emergencies/emergencies.routes');
const validationsRouter = require('../modules/validations/validations.routes');
const reportsRouter = require('../modules/reports/reports.routes');
const notificationsRouter = require('../modules/notifications/notifications.routes');
const authenticationMiddleware = require('../shared/middlewares/authentication.middleware');
const validationsController = require('../modules/validations/validations.controller');
const validationsValidation = require('../modules/validations/validations.validation');
const asyncHandler = require('../shared/utils/asyncHandler');
const validateRequest = require('../shared/validators/validateRequest');
const validationCallbackAuthMiddleware = require('../shared/middlewares/validationCallbackAuth.middleware');

const apiRouter = express.Router();

apiRouter.use('/auth', authRouter);

// Callback from the validation agent must not require user JWT auth.
// It is protected by validationCallbackAuthMiddleware (x-callback-token).
apiRouter.post(
  '/validations/:validationId/result',
  validationCallbackAuthMiddleware,
  validateRequest(validationsValidation.validateValidationResultRequest),
  asyncHandler(validationsController.receiveValidationResult)
);

apiRouter.use('/patients', authenticationMiddleware, patientsRouter);
apiRouter.get(
  '/patients/:patientId/policies',
  authenticationMiddleware,
  asyncHandler(policiesController.getPoliciesByPatientId)
);
apiRouter.use('/policies', authenticationMiddleware, policiesRouter);
apiRouter.use(authenticationMiddleware, preexistingConditionsRouter);
apiRouter.use('/emergencies', authenticationMiddleware, emergenciesRouter);
apiRouter.use('/validations', authenticationMiddleware, validationsRouter);
apiRouter.use('/reports', authenticationMiddleware, reportsRouter);
apiRouter.use('/notifications', authenticationMiddleware, notificationsRouter);

module.exports = apiRouter;
