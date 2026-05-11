const environmentConfig = require('../../config/env');
const { databasePool } = require('../../config/database');
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

function buildValidationPayloadSummary(emergencyRecord) {
  return {
    emergencyId: emergencyRecord.id,
    caseCode: emergencyRecord.codigo_caso
  };
}

function stripNullCharacters(value) {
  if (typeof value !== 'string') {
    return value;
  }

  return value.replace(/\u0000/g, '');
}

function sanitizeJsonStrings(value) {
  if (typeof value === 'string') {
    return stripNullCharacters(value);
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeJsonStrings);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, sanitizeJsonStrings(nestedValue)])
    );
  }

  return value;
}

function sanitizeReportPayload(validationId, reportPayload) {
  const fallbackContentJson = reportPayload.contentJson || reportPayload;
  const sanitizedReportPayload = {
    validationId,
    reportCode: stripNullCharacters(reportPayload.reportCode),
    executiveSummary: stripNullCharacters(reportPayload.executiveSummary),
    coverageAnalysis: stripNullCharacters(reportPayload.coverageAnalysis),
    preexistingConditionsAnalysis: stripNullCharacters(reportPayload.preexistingConditionsAnalysis),
    decisionReason: stripNullCharacters(reportPayload.decisionReason),
    suggestedAction: stripNullCharacters(reportPayload.suggestedAction),
    generatedAt: reportPayload.generatedAt,
    contentJson: sanitizeJsonStrings(fallbackContentJson)
  };

  const wasSanitized = JSON.stringify({
    reportCode: reportPayload.reportCode,
    executiveSummary: reportPayload.executiveSummary,
    coverageAnalysis: reportPayload.coverageAnalysis,
    preexistingConditionsAnalysis: reportPayload.preexistingConditionsAnalysis,
    decisionReason: reportPayload.decisionReason,
    suggestedAction: reportPayload.suggestedAction,
    contentJson: fallbackContentJson
  }) !== JSON.stringify({
    reportCode: sanitizedReportPayload.reportCode,
    executiveSummary: sanitizedReportPayload.executiveSummary,
    coverageAnalysis: sanitizedReportPayload.coverageAnalysis,
    preexistingConditionsAnalysis: sanitizedReportPayload.preexistingConditionsAnalysis,
    decisionReason: sanitizedReportPayload.decisionReason,
    suggestedAction: sanitizedReportPayload.suggestedAction,
    contentJson: sanitizedReportPayload.contentJson
  });

  return {
    sanitizedReportPayload,
    wasSanitized
  };
}

function isValidationTimedOut(validationRecord) {
  const requestedAt = new Date(validationRecord.fecha_solicitud);
  const elapsedMs = Date.now() - requestedAt.getTime();
  const timeoutMs = environmentConfig.validationRetryTimeoutMinutes * 60 * 1000;

  return elapsedMs >= timeoutMs;
}

async function getValidationDispatchContext(emergencyRecord) {
  const patientRecord = await patientRepository.findPatientById(emergencyRecord.paciente_id);
  const policyRecord = await policyRepository.findPolicyById(emergencyRecord.poliza_id);
  const coverageRecords = await policyRepository.findCoveragesByPolicyId(emergencyRecord.poliza_id);
  const preexistingConditionRecords = await preexistingConditionsRepository.findPreexistingConditionsByPatientId(
    emergencyRecord.paciente_id
  );

  return {
    patientRecord,
    policyRecord,
    coverageRecords,
    preexistingConditionRecords
  };
}

async function dispatchValidationToAgent(validationRecord, emergencyRecord, context) {
  const policyRecord = context.policyRecord;
  const callbackPath = `/api/validations/${validationRecord.id}/result`;
  const validationAgentPayload = buildValidationAgentPayload({
    validation: mapValidationRecord(validationRecord),
    emergency: emergencyRecord,
    patient: context.patientRecord,
    policy: context.policyRecord,
    coverages: context.coverageRecords,
    preexistingConditions: context.preexistingConditionRecords,
    callbackPath
  });

  const processingValidation = await validationsRepository.updateValidationProcessingStatus(
    validationRecord.id,
    validationStatus.PROCESSING,
    validationAgentPayload
  );

  await emergencyRepository.updateEmergencyStatus(emergencyRecord.id, emergencyStatus.IN_VALIDATION);

  const agentUrl = `${environmentConfig.validationAgentBaseUrl}${environmentConfig.validationAgentValidatePath}`;

  console.log('[validation-service] Sending validation request to agent', {
    validationId: validationRecord.id,
    emergencyId: emergencyRecord.id,
    agentUrl,
    callbackPath,
    hasCallbackToken: Boolean(environmentConfig.validationResultCallbackToken),
    policyDateDebug: {
      fechaInicioRaw: policyRecord.fecha_inicio,
      fechaFinRaw: policyRecord.fecha_fin,
      fechaInicioType: typeof policyRecord.fecha_inicio,
      fechaFinType: typeof policyRecord.fecha_fin,
      fechaInicioSerialized:
        policyRecord.fecha_inicio instanceof Date
          ? policyRecord.fecha_inicio.toISOString()
          : String(policyRecord.fecha_inicio),
      fechaFinSerialized:
        policyRecord.fecha_fin instanceof Date
          ? policyRecord.fecha_fin.toISOString()
          : String(policyRecord.fecha_fin)
    }
  });

  try {
    const agentResponse = await validationAgentClient.post(environmentConfig.validationAgentValidatePath, validationAgentPayload, {
      headers: {
        'x-callback-token': environmentConfig.validationResultCallbackToken
      }
    });

    console.log('[validation-service] Agent accepted validation request', {
      validationId: validationRecord.id,
      status: agentResponse.status,
      data: agentResponse.data
    });
  } catch (error) {
    console.error('[validation-service] Agent request failed', {
      validationId: validationRecord.id,
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    throw error;
  }

  return {
    ...processingValidation,
    payload_resumen: validationAgentPayload
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

  const context = await getValidationDispatchContext(emergencyRecord);

  const createdValidation = await validationsRepository.createValidation({
    emergencyId,
    processStatus: validationStatus.PENDING,
    payloadSummary: buildValidationPayloadSummary(emergencyRecord)
  });

  const dispatchedValidation = await dispatchValidationToAgent(createdValidation, emergencyRecord, context);

  return mapValidationRecord(dispatchedValidation);
}

async function retryValidation(validationId, authenticatedUser) {
  console.log('[validation-service] Retry requested', {
    validationId,
    requesterUserId: authenticatedUser.id,
    requesterHospitalId: authenticatedUser.hospitalId
  });

  const validationRecord = await validationsRepository.findValidationById(validationId);

  if (!validationRecord) {
    throw new AppError('Validation not found', 404);
  }

  const emergencyRecord = await emergencyRepository.findEmergencyById(validationRecord.emergencia_id);

  if (!emergencyRecord) {
    throw new AppError('Emergency not found for validation', 404);
  }

  if (authenticatedUser.hospitalId && emergencyRecord.hospital_id !== authenticatedUser.hospitalId) {
    throw new AppError('You do not have access to this validation', 403);
  }

  const canRetryFailed = validationRecord.estado_proceso === validationStatus.FAILED;
  const canRetryTimedOut =
    validationRecord.estado_proceso === validationStatus.PROCESSING && isValidationTimedOut(validationRecord);

  if (!canRetryFailed && !canRetryTimedOut) {
    console.log('[validation-service] Retry denied', {
      validationId,
      currentStatus: validationRecord.estado_proceso,
      requestedAt: validationRecord.fecha_solicitud
    });

    throw new AppError('Only failed or timed out validations can be retried', 409);
  }

  const resetValidation = await validationsRepository.resetValidationForRetry(
    validationId,
    buildValidationPayloadSummary(emergencyRecord)
  );

  console.log('[validation-service] Validation reset for retry', {
    validationId,
    processStatus: resetValidation.estado_proceso
  });

  const context = await getValidationDispatchContext(emergencyRecord);
  const dispatchedValidation = await dispatchValidationToAgent(resetValidation, emergencyRecord, context);

  console.log('[validation-service] Retry sent to agent', {
    validationId,
    emergencyId: emergencyRecord.id
  });

  return mapValidationRecord(dispatchedValidation);
}

async function receiveValidationResult(validationId, validationResultPayload) {
  const notificationsCount = Array.isArray(validationResultPayload.notifications)
    ? validationResultPayload.notifications.length
    : 0;

  console.log('[validation-service] Processing callback payload', {
    validationId,
    processStatus: validationResultPayload.processStatus,
    decision: validationResultPayload.decision,
    notificationsCount,
    hasReport: Boolean(validationResultPayload.report)
  });

  const client = await databasePool.connect();

  try {
    await client.query('BEGIN');

    console.log('[validation-service] Transaction started', {
      validationId
    });

    const existingValidation = await validationsRepository.findValidationById(validationId, client);

    if (!existingValidation) {
      throw new AppError('Validation not found', 404);
    }

    const completedValidation = await validationsRepository.completeValidation(
      validationId,
      {
        processStatus: validationResultPayload.processStatus,
        decision: validationResultPayload.decision,
        requiresManualReview: Boolean(validationResultPayload.requiresManualReview),
        engineVersion: validationResultPayload.engineVersion || null,
        payloadSummary: validationResultPayload.summaryPayload || validationResultPayload,
        errorDetails: validationResultPayload.errorDetails || null
      },
      client
    );

    console.log('[validation-service] Validation completed', {
      validationId,
      processStatus: completedValidation.estado_proceso,
      decision: completedValidation.decision
    });

    if (validationResultPayload.report) {
      const { sanitizedReportPayload, wasSanitized } = sanitizeReportPayload(
        validationId,
        validationResultPayload.report
      );

      if (wasSanitized) {
        console.warn('[validation-service] Report payload sanitized before persistence', {
          validationId,
          removedNullCharacters: true
        });
      }

      console.log('[validation-service] Preparing report upsert', {
        validationId,
        reportCode: sanitizedReportPayload.reportCode,
        generatedAt: sanitizedReportPayload.generatedAt
      });

      const reportRecord = await reportsRepository.createValidationReport(sanitizedReportPayload, client);

      console.log('[validation-service] Report upserted', {
        validationId,
        reportId: reportRecord.id,
        reportCode: reportRecord.codigo_informe
      });
    }

    console.log('[validation-service] Replacing notifications for validation', {
      validationId,
      notificationsCount
    });

    await notificationsRepository.deleteNotificationsByValidationId(validationId, client);

    console.log('[validation-service] Notifications replaced - old deleted', {
      validationId
    });

    if (Array.isArray(validationResultPayload.notifications)) {
      for (const notificationPayload of validationResultPayload.notifications) {
        console.log('[validation-service] Inserting notification', {
          validationId,
          recipientUserId: notificationPayload.recipientUserId,
          notificationType: notificationPayload.notificationType,
          channel: notificationPayload.channel,
          notificationStatus: notificationPayload.notificationStatus
        });

        await notificationsRepository.createNotification(
          {
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
          },
          client
        );
      }
    }

    console.log('[validation-service] Notifications inserted', {
      validationId,
      notificationsCount
    });

    const finalEmergencyStatus = validationResultPayload.notifications?.length
      ? emergencyStatus.NOTIFIED
      : emergencyStatus.VALIDATED;

    await emergencyRepository.updateEmergencyStatus(existingValidation.emergencia_id, finalEmergencyStatus, client);

    console.log('[validation-service] Emergency status updated', {
      validationId,
      emergencyId: existingValidation.emergencia_id,
      finalEmergencyStatus
    });

    await client.query('COMMIT');

    console.log('[validation-service] Transaction committed', {
      validationId,
      emergencyId: existingValidation.emergencia_id,
      finalProcessStatus: completedValidation.estado_proceso,
      finalDecision: completedValidation.decision
    });

    return mapValidationRecord(completedValidation);
  } catch (error) {
    await client.query('ROLLBACK');

    console.error('[validation-service] Callback transaction failed', {
      validationId,
      processStatus: validationResultPayload.processStatus,
      hasReport: Boolean(validationResultPayload.report),
      notificationsCount,
      message: error.message,
      code: error.code,
      constraint: error.constraint,
      detail: error.detail,
      stack: error.stack
    });

    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  createValidationForEmergency,
  retryValidation,
  receiveValidationResult
};
