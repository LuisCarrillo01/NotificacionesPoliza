from __future__ import annotations

import logging
from datetime import UTC, datetime

from app.schemas.contracts import GeneratedReportSections, ReportPayload, ValidationRequest, ValidationResultPayload
from app.services.groq_client import groq_report_client
from app.services.openai_client import openai_report_client


logger = logging.getLogger(__name__)


def _build_report_code(case_code: str, validation_id: str) -> str:
    return f"INF-{case_code}-{validation_id[:8]}"


def _build_fallback_sections(result_payload: ValidationResultPayload, facts: dict) -> GeneratedReportSections:
    decision = result_payload.decision
    active_conditions = facts.get("active_preexisting_names", [])

    if decision == "aprobado":
        executive_summary = "La poliza esta vigente y cubre la emergencia registrada."
        decision_reason = "La poliza se encuentra vigente y existe cobertura de emergencia aplicable."
        suggested_action = "Continuar con el proceso de admision."
    elif decision == "rechazado":
        executive_summary = "La poliza no puede cubrir la emergencia registrada."
        decision_reason = "La poliza no esta vigente o no cuenta con cobertura de emergencia aplicable."
        suggested_action = "Solicitar validacion administrativa adicional al hospital."
    else:
        executive_summary = "El caso requiere revision manual antes de confirmar cobertura."
        decision_reason = "Se detectaron preexistencias activas que requieren evaluacion humana."
        suggested_action = "Escalar el caso a un analista de cobertura."

    preexisting_analysis = (
        f"Preexistencias activas detectadas: {', '.join(active_conditions)}."
        if active_conditions
        else "No se encontraron preexistencias activas relevantes."
    )

    coverage_analysis = (
        f"Estado de poliza: {facts.get('policy_status')}. "
        f"Coberturas de emergencia aplicables: {facts.get('matching_emergency_coverages', 0)}."
    )

    return GeneratedReportSections(
        executiveSummary=executive_summary,
        coverageAnalysis=coverage_analysis,
        preexistingConditionsAnalysis=preexisting_analysis,
        decisionReason=decision_reason,
        suggestedAction=suggested_action,
    )


async def build_report(
    request: ValidationRequest, facts: dict, result_payload: ValidationResultPayload
) -> ValidationResultPayload:
    prompt_context = {
        "caseCode": request.emergency.codigo_caso,
        "patientName": facts.get("patient_full_name"),
        "policyNumber": request.policy.numero_poliza,
        "policyStatus": facts.get("policy_status"),
        "decision": result_payload.decision,
        "requiresManualReview": result_payload.requiresManualReview,
        "hasEmergencyCoverage": facts.get("has_emergency_coverage"),
        "matchingEmergencyCoverages": facts.get("matching_emergency_coverages"),
        "activePreexistingConditions": facts.get("active_preexisting_names", []),
        "emergencyType": request.emergency.tipo_emergencia,
        "initialDescription": request.emergency.descripcion_inicial,
    }

    sections = _build_fallback_sections(result_payload, facts)
    report_source = "template"

    if openai_report_client.enabled:
        try:
            sections = await openai_report_client.generate_report_sections(prompt_context)
            report_source = "openai"
        except Exception as error:  # pragma: no cover - defensive fallback
            logger.warning("OpenAI report generation failed, falling back: %s", error)

    if report_source == "template" and groq_report_client.enabled:
        try:
            sections = await groq_report_client.generate_report_sections(prompt_context)
            report_source = "groq"
        except Exception as error:  # pragma: no cover - defensive fallback
            logger.warning("Groq report generation failed, using fallback: %s", error)

    report = ReportPayload(
        reportCode=_build_report_code(request.emergency.codigo_caso, request.validationId),
        executiveSummary=sections.executiveSummary,
        coverageAnalysis=sections.coverageAnalysis,
        preexistingConditionsAnalysis=sections.preexistingConditionsAnalysis,
        decisionReason=sections.decisionReason,
        suggestedAction=sections.suggestedAction,
        generatedAt=datetime.now(UTC),
        contentJson={
            "source": report_source,
            "caseCode": request.emergency.codigo_caso,
            "decision": result_payload.decision,
        },
    )

    return result_payload.model_copy(update={"report": report})
