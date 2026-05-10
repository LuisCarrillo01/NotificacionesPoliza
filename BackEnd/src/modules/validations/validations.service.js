const environmentConfig = require('../../config/env');
const { validationAgentClient } = require('../../config/httpClient');
const AppError = require('../../shared/errors/AppError');
const emergencyStatus = require('../../shared/constants/emergencyStatus');
const validationStatus = require('../../shared/constants/validationStatus');
const emergencyRepository = require('../emergencies/emergencies.repository');
const patientRepository = require('../patients/patients.repository');
const policyRepository = require('../policies/policies.repository');
const preexistingConditionsRepository = require('../preexisting-conditions/preexistingConditions.repository');
const validationsRepository = require('./validations.repository');
const reportsRepository = require('../reports/reports.repository');
const notificationsRepository = require('../notifications/notifications.repository');
const { buildValidationAgentPayload } = require('./validationAgent.mapper');

function mapValidationRecord(validationRecord) {
  return {
    id: validationRecord.id,
    emergencyId: validationRecord.emergencia_id,
    processStatus: validationRecord.estado_proceso,
    decision: validationRecord.decision,
    requiresManualReview: validationRecord.requiere_revision_manual,
    requestDate: validationRecord.fecha_solicitud,
    responseDate: validationRecord.fecha_respuesta,
    engineVersion: validationRecord.motor_version,
    payloadSummary: validationRecord.payload_resumen,
    errorDetails: validationRecord.error_detalle,
    createdAt: validationRecord.created_at,
    updatedAt: validationRecord.updated_at
  };
}

async function createValidationForEmergency(emergencyId, authenticatedUser) {
  const emergencyRecord = await emergencyRepository.findEmergencyById(emergencyId);

  if (!emergencyRecord) {
    throw new AppError('Emergency not found', 404);
  }

  if (authenticatedUser.hospitalId && emergencyRecord.hospital_id !== authenticatedUser.hospitalId) {
    throw new AppError('You do not have access to this emergency', 403);
  }

  const patientRecord = await patientRepository.findPatientById(emergencyRecord.paciente_id);
  const policyRecord = await policyRepository.findPolicyById(emergencyRecord.poliza_id);
  const coverageRecords = await policyRepository.findCoveragesByPolicyId(emergencyRecord.poliza_id);
  const preexistingConditionRecords = await preexistingConditionsRepository.findPreexistingConditionsByPatientId(
    emergencyRecord.paciente_id
  );

  const createdValidation = await validationsRepository.createValidation({
    emergencyId,
    processStatus: validationStatus.PENDING,
    payloadSummary: {
      emergencyId,
      caseCode: emergencyRecord.codigo_caso
    }
  });

  const callbackPath = `/api/validations/${createdValidation.id}/result`;
  const validationAgentPayload = buildValidationAgentPayload({
    validation: mapValidationRecord(createdValidation),
    emergency: emergencyRecord,
    patient: patientRecord,
    policy: policyRecord,
    coverages: coverageRecords,
    preexistingConditions: preexistingConditionRecords,
    callbackPath
  });

  await validationsRepository.updateValidationProcessingStatus(
    createdValidation.id,
    validationStatus.PROCESSING,
    validationAgentPayload
  );

  await emergencyRepository.updateEmergencyStatus(emergencyId, emergencyStatus.IN_VALIDATION);

  const agentUrl = `${environmentConfig.validationAgentBaseUrl}${environmentConfig.validationAgentValidatePath}`;

  console.log('[validation-service] Sending validation request to agent', {
    validationId: createdValidation.id,
    emergencyId,
    agentUrl,
    callbackPath,
    hasCallbackToken: Boolean(environmentConfig.validationResultCallbackToken)
  });

  try {
    const agentResponse = await validationAgentClient.post(environmentConfig.validationAgentValidatePath, validationAgentPayload, {
      headers: {
        'x-callback-token': environmentConfig.validationResultCallbackToken
      }
    });

    console.log('[validation-service] Agent accepted validation request', {
      validationId: createdValidation.id,
      status: agentResponse.status,
      data: agentResponse.data
    });
  } catch (error) {
    console.error('[validation-service] Agent request failed', {
      validationId: createdValidation.id,
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    throw error;
  }

  return mapValidationRecord({
    ...createdValidation,
    estado_proceso: validationStatus.PROCESSING,
    payload_resumen: validationAgentPayload
  });
}

async function receiveValidationResult(validationId, validationResultPayload) {
  console.log('[validation-service] Processing callback payload', {
    validationId,
    processStatus: validationResultPayload.processStatus,
    decision: validationResultPayload.decision,
    notificationsCount: Array.isArray(validationResultPayload.notifications)
      ? validationResultPayload.notifications.length
      : 0,
    hasReport: Boolean(validationResultPayload.report)
  });

  const existingValidation = await validationsRepository.findValidationById(validationId);

  if (!existingValidation) {
    throw new AppError('Validation not found', 404);
  }

  const completedValidation = await validationsRepository.completeValidation(validationId, {
    processStatus: validationResultPayload.processStatus,
    decision: validationResultPayload.decision,
    requiresManualReview: Boolean(validationResultPayload.requiresManualReview),
    engineVersion: validationResultPayload.engineVersion || null,
    payloadSummary: validationResultPayload.summaryPayload || validationResultPayload,
    errorDetails: validationResultPayload.errorDetails || null
  });

  if (validationResultPayload.report) {
    await reportsRepository.createValidationReport({
      validationId,
      reportCode: validationResultPayload.report.reportCode,
      executiveSummary: validationResultPayload.report.executiveSummary,
      coverageAnalysis: validationResultPayload.report.coverageAnalysis,
      preexistingConditionsAnalysis: validationResultPayload.report.preexistingConditionsAnalysis,
      decisionReason: validationResultPayload.report.decisionReason,
      suggestedAction: validationResultPayload.report.suggestedAction,
      generatedAt: validationResultPayload.report.generatedAt,
      contentJson: validationResultPayload.report.contentJson || validationResultPayload.report
    });
  }

  if (Array.isArray(validationResultPayload.notifications)) {
    for (const notificationPayload of validationResultPayload.notifications) {
      await notificationsRepository.createNotification({
        validationId,
        recipientUserId: notificationPayload.recipientUserId,
        notificationType: notificationPayload.notificationType,
        channel: notificationPayload.channel,
        notificationStatus: notificationPayload.notificationStatus,
        title: notificationPayload.title,
        message: notificationPayload.message,
        generatedAt: notificationPayload.generatedAt,
        sentAt: notificationPayload.sentAt,
        readAt: notificationPayload.readAt
      });
    }
  }

  await emergencyRepository.updateEmergencyStatus(
    existingValidation.emergencia_id,
    validationResultPayload.notifications?.length ? emergencyStatus.NOTIFIED : emergencyStatus.VALIDATED
  );

  console.log('[validation-service] Callback processed successfully', {
    validationId,
    emergencyId: existingValidation.emergencia_id,
    finalProcessStatus: completedValidation.estado_proceso,
    finalDecision: completedValidation.decision
  });

  return mapValidationRecord(completedValidation);
}

module.exports = {
  createValidationForEmergency,
  receiveValidationResult
};
