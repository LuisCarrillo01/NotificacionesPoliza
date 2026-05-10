from __future__ import annotations

import logging
from datetime import UTC, datetime
from typing import Any

from app.schemas.contracts import GeneratedReportSections, ReportPayload, ValidationRequest, ValidationResultPayload
from app.services.groq_client import groq_report_client
from app.services.openai_client import openai_report_client


logger = logging.getLogger(__name__)


def _build_report_code(case_code: str, validation_id: str) -> str:
    return f"INF-{case_code}-{validation_id[:8]}"


def _strip_null_characters(value: str) -> str:
    return value.replace("\x00", "")


def _sanitize_json_strings(value: Any) -> Any:
    if isinstance(value, str):
        return _strip_null_characters(value)

    if isinstance(value, list):
        return [_sanitize_json_strings(item) for item in value]

    if isinstance(value, dict):
        return {key: _sanitize_json_strings(nested_value) for key, nested_value in value.items()}

    return value


def _format_recommended_checks(recommended_checks: list[str]) -> str:
    return " ".join(f"- {check}" for check in recommended_checks)


def _build_fallback_sections(result_payload: ValidationResultPayload, facts: dict) -> GeneratedReportSections:
    decision = result_payload.decision
    active_conditions = facts.get("active_preexisting_names", [])
    summary_payload = result_payload.summaryPayload
    manual_review_reason = summary_payload.get("manualReviewReason")
    recommended_checks = summary_payload.get("recommendedChecks", [])
    critical_related = summary_payload.get("activePreexistingCriticalRelated", [])
    signals = summary_payload.get("signals", [])

    if decision == "aprobado":
        executive_summary = "La poliza esta vigente y cubre la emergencia registrada."
        decision_reason = "La poliza se encuentra vigente y existe cobertura de emergencia aplicable."
        suggested_action = "Continuar con el proceso de admision."
    elif decision == "rechazado":
        executive_summary = "La poliza no puede cubrir la emergencia registrada."
        decision_reason = "La poliza no esta vigente o no cuenta con cobertura de emergencia aplicable."
        suggested_action = "Solicitar validacion administrativa adicional al hospital."
    else:
        executive_summary = "El caso requiere revision manual antes de confirmar la cobertura aplicable."
        if manual_review_reason == "critical_related_preexisting":
            decision_reason = (
                "Se detecto una preexistencia critica relacionada con la emergencia reportada: "
                f"{', '.join(critical_related) or ', '.join(active_conditions)}."
            )
        else:
            decision_reason = "Faltan datos concluyentes para emitir una decision automatica segura."
        suggested_action = (
            _format_recommended_checks(recommended_checks)
            if recommended_checks
            else "Escalar el caso a un analista de cobertura con la informacion clinica disponible."
        )

    preexisting_analysis = (
        f"Preexistencias activas detectadas: {', '.join(active_conditions)}."
        if active_conditions
        else "No se encontraron preexistencias activas relevantes."
    )

    if decision == "revision_manual" and signals:
        preexisting_analysis = f"{preexisting_analysis} Senales de riesgo: {'; '.join(signals)}."

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
        "manualReviewReason": result_payload.summaryPayload.get("manualReviewReason"),
        "signals": result_payload.summaryPayload.get("signals", []),
        "recommendedChecks": result_payload.summaryPayload.get("recommendedChecks", []),
        "criticalRelatedPreexisting": result_payload.summaryPayload.get("activePreexistingCriticalRelated", []),
        "informativePreexisting": result_payload.summaryPayload.get("activePreexistingInformative", []),
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

    sanitized_content_json: dict[str, Any] = _sanitize_json_strings({
        "source": report_source,
        "caseCode": request.emergency.codigo_caso,
        "decision": result_payload.decision,
    })

    report = ReportPayload(
        reportCode=_strip_null_characters(_build_report_code(request.emergency.codigo_caso, request.validationId)),
        executiveSummary=_strip_null_characters(sections.executiveSummary),
        coverageAnalysis=_strip_null_characters(sections.coverageAnalysis),
        preexistingConditionsAnalysis=_strip_null_characters(sections.preexistingConditionsAnalysis),
        decisionReason=_strip_null_characters(sections.decisionReason),
        suggestedAction=_strip_null_characters(sections.suggestedAction),
        generatedAt=datetime.now(UTC),
        contentJson=sanitized_content_json,
    )

    return result_payload.model_copy(update={"report": report})
