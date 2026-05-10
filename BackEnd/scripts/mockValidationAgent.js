const { URL } = require('url');
const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const axios = require('axios');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const DEFAULT_ADMISSIONS_USER_ID = '30000000-0000-0000-0000-000000000002';
const DEFAULT_INSURER_USER_ID = '30000000-0000-0000-0000-000000000003';

function getRequiredEnvironmentVariable(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function buildDecision(payload) {
  const hasEmergencyCoverage = payload.coverages.some((coverage) => coverage.aplica_emergencia);
  const policyIsActive = payload.policy.estado === 'vigente';
  const hasActivePreexistingConditions = payload.preexistingConditions.some((condition) => condition.activa);

  if (!policyIsActive || !hasEmergencyCoverage) {
    return {
      decision: 'rechazado',
      requiresManualReview: false,
      summary: 'La poliza no esta vigente o no posee cobertura de emergencia aplicable.'
    };
  }

  if (hasActivePreexistingConditions) {
    return {
      decision: 'revision_manual',
      requiresManualReview: true,
      summary: 'La poliza cubre la emergencia, pero existen preexistencias activas que requieren validacion humana.'
    };
  }

  return {
    decision: 'aprobado',
    requiresManualReview: false,
    summary: 'La poliza esta vigente y la cobertura de emergencia aplica sin restricciones adicionales.'
  };
}

function buildResultPayload(payload) {
  const decisionResult = buildDecision(payload);
  const caseCode = payload.emergency.codigo_caso;
  const patientFullName = `${payload.patient.nombres} ${payload.patient.apellidos}`;
  const generatedAt = new Date().toISOString();

  return {
    processStatus: 'completada',
    decision: decisionResult.decision,
    requiresManualReview: decisionResult.requiresManualReview,
    engineVersion: 'mock-agent-v1',
    summaryPayload: {
      caseCode,
      patient: patientFullName,
      policyNumber: payload.policy.numero_poliza,
      summary: decisionResult.summary
    },
    errorDetails: null,
    report: {
      reportCode: `INF-${caseCode}`,
      executiveSummary: decisionResult.summary,
      coverageAnalysis: `Estado de poliza: ${payload.policy.estado}. Coberturas evaluadas: ${payload.coverages.length}.`,
      preexistingConditionsAnalysis: payload.preexistingConditions.length
        ? `Preexistencias encontradas: ${payload.preexistingConditions
            .map((condition) => condition.nombre_condicion)
            .join(', ')}.`
        : 'No se encontraron preexistencias registradas.',
      decisionReason: decisionResult.summary,
      suggestedAction:
        decisionResult.decision === 'aprobado'
          ? 'Continuar con el proceso de admision.'
          : decisionResult.decision === 'revision_manual'
            ? 'Escalar el caso a un analista de cobertura.'
            : 'Solicitar al hospital verificar datos de poliza y cobertura.',
      generatedAt,
      contentJson: {
        validationId: payload.validationId,
        decision: decisionResult.decision
      }
    },
    notifications: [
      {
        recipientUserId: process.env.DEMO_ADMISSIONS_USER_ID || DEFAULT_ADMISSIONS_USER_ID,
        notificationType: 'admisiones',
        channel: 'bandeja_interna',
        notificationStatus: 'enviada',
        title: `Resultado de validacion ${caseCode}`,
        message: `${decisionResult.summary} Paciente: ${patientFullName}.`,
        generatedAt,
        sentAt: generatedAt,
        readAt: null
      },
      {
        recipientUserId: process.env.DEMO_INSURER_USER_ID || DEFAULT_INSURER_USER_ID,
        notificationType: 'aseguradora',
        channel: 'correo',
        notificationStatus: 'enviada',
        title: `Resultado de validacion ${caseCode}`,
        message: `${decisionResult.summary} Poliza: ${payload.policy.numero_poliza}.`,
        generatedAt,
        sentAt: generatedAt,
        readAt: null
      }
    ]
  };
}

async function startMockValidationAgent() {
  const validationAgentBaseUrl = new URL(getRequiredEnvironmentVariable('VALIDATION_AGENT_BASE_URL'));
  const validationPath = getRequiredEnvironmentVariable('VALIDATION_AGENT_VALIDATE_PATH');
  const apiBaseUrl = getRequiredEnvironmentVariable('API_BASE_URL');
  const callbackToken = process.env.VALIDATION_RESULT_CALLBACK_TOKEN || '';

  const application = express();
  application.use(express.json());

  application.post(validationPath, async (request, response) => {
    const payload = request.body;

    console.log('[mock-agent] Validation request received', {
      validationId: payload.validationId,
      caseCode: payload.emergency?.codigo_caso,
      callbackPath: payload.callback?.callbackPath,
      receivedCallbackToken: Boolean(request.headers['x-callback-token'])
    });

    response.status(202).json({
      accepted: true,
      validationId: payload.validationId
    });

    try {
      const callbackUrl = `${apiBaseUrl}${payload.callback.callbackPath}`;
      const resultPayload = buildResultPayload(payload);

      console.log('[mock-agent] Sending callback to backend', {
        validationId: payload.validationId,
        callbackUrl,
        hasCallbackToken: Boolean(callbackToken),
        processStatus: resultPayload.processStatus,
        decision: resultPayload.decision
      });

      const callbackResponse = await axios.post(callbackUrl, resultPayload, {
        headers: {
          'x-callback-token': callbackToken
        },
        timeout: 10000
      });

      console.log('[mock-agent] Callback completed successfully', {
        validationId: payload.validationId,
        status: callbackResponse.status,
        data: callbackResponse.data
      });
    } catch (error) {
      console.error('[mock-agent] Error sending callback', {
        validationId: payload.validationId,
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
    }
  });

  const port = Number(validationAgentBaseUrl.port || 80);

  application.listen(port, () => {
    console.log(`Mock Validation Agent escuchando en puerto ${port}`);
    console.log(`Ruta de recepcion: ${validationPath}`);
  });
}

startMockValidationAgent().catch((error) => {
  console.error('No se pudo iniciar el mock validation agent.');
  console.error(error);
  process.exit(1);
});
