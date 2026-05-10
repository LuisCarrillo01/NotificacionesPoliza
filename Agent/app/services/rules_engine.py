from __future__ import annotations

import unicodedata
from datetime import UTC, date, datetime
from typing import Any

from app.config import settings
from app.schemas.contracts import (
    CoveragePayload,
    PolicyPayload,
    PreexistingConditionPayload,
    ValidationRequest,
    ValidationResultPayload,
)


APPROVED = "aprobado"
REJECTED = "rechazado"
MANUAL_REVIEW = "revision_manual"
COMPLETED = "completada"

EMERGENCY_TYPE_CARDIAC = "CARDIACA"
EMERGENCY_TYPE_RESPIRATORY = "RESPIRATORIA"
EMERGENCY_TYPE_TRAUMATIC = "TRAUMATICA"
EMERGENCY_TYPE_NEUROLOGICAL = "NEUROLOGICA"
EMERGENCY_TYPE_GASTROINTESTINAL = "GASTROINTESTINAL"
EMERGENCY_TYPE_GENERAL = "GENERAL"

KNOWN_EMERGENCY_TYPES = {
    EMERGENCY_TYPE_CARDIAC,
    EMERGENCY_TYPE_RESPIRATORY,
    EMERGENCY_TYPE_TRAUMATIC,
    EMERGENCY_TYPE_NEUROLOGICAL,
    EMERGENCY_TYPE_GASTROINTESTINAL,
    EMERGENCY_TYPE_GENERAL,
}

SEVERITY_KEYWORDS = ("severa", "grave", "cronica severa")
CARDIAC_CRITICAL_KEYWORDS = (
    "hipertension",
    "cardiopatia",
    "insuficiencia cardiaca",
    "arritmia",
    "fibrilacion",
    "infarto",
    "angina",
    "coronaria",
)
RESPIRATORY_CRITICAL_KEYWORDS = (
    "insuficiencia respiratoria cronica",
    "fibrosis pulmonar",
)
RESPIRATORY_INFORMATIVE_KEYWORDS = (
    "asma",
    "bronquitis",
    "epoc",
    "enfermedad pulmonar obstructiva cronica",
)
NEUROLOGICAL_CRITICAL_KEYWORDS = (
    "epilepsia",
    "acv",
    "ictus",
    "antecedente cerebrovascular",
    "convulsion",
)
GASTROINTESTINAL_CRITICAL_KEYWORDS = (
    "ulcera",
    "colitis",
    "enfermedad hepatica",
    "cirrosis",
    "hemorragia digestiva",
)


def _normalize_text(value: str | None) -> str:
    if not value:
        return ""
    normalized = unicodedata.normalize("NFKD", value)
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    return " ".join(ascii_text.lower().split())


def normalize_emergency_type(value: str | None) -> str:
    normalized = _normalize_text(value).upper()
    return normalized if normalized in KNOWN_EMERGENCY_TYPES else EMERGENCY_TYPE_GENERAL


def _build_manual_review_guidance(reason: str, emergency_type: str, signals: list[str]) -> list[str]:
    if reason == "critical_related_preexisting":
        if emergency_type == EMERGENCY_TYPE_CARDIAC:
            return [
                "Verificar si el plan excluye complicaciones cardiovasculares asociadas a preexistencias.",
                "Confirmar si la emergencia cardiaca reportada cumple el criterio de cobertura del plan.",
                "Revisar si el evento actual es una complicacion directa de la condicion cardiovascular preexistente.",
            ]
        if emergency_type == EMERGENCY_TYPE_RESPIRATORY:
            return [
                "Confirmar la severidad clinica de la condicion respiratoria preexistente.",
                "Verificar si el plan excluye reagudizaciones de condiciones respiratorias cronicas.",
                "Revisar si la emergencia actual requiere cobertura especial por soporte respiratorio.",
            ]
        if emergency_type == EMERGENCY_TYPE_NEUROLOGICAL:
            return [
                "Confirmar si el evento neurologico actual es nuevo o recurrencia de una condicion previa.",
                "Revisar exclusiones o limitaciones neurologicas del plan.",
                "Validar la urgencia clinica y si requiere autorizacion complementaria.",
            ]
        if emergency_type == EMERGENCY_TYPE_GASTROINTESTINAL:
            return [
                "Verificar si el plan excluye complicaciones de la condicion gastrointestinal preexistente.",
                "Confirmar si el cuadro actual corresponde a un evento agudo cubierto.",
                "Revisar si la cobertura exige validacion adicional para procedimientos digestivos.",
            ]

    checks = [
        "Confirmar vigencia y estado actual de la poliza en el sistema core.",
        "Validar si existe cobertura de emergencia aplicable al caso reportado.",
    ]
    if signals:
        checks.append(f"Revisar la senal principal detectada: {signals[0]}.")
    return checks


def _classify_preexisting_condition(
    condition: PreexistingConditionPayload, emergency_type: str
) -> tuple[str, str] | None:
    condition_name = _normalize_text(condition.nombre_condicion)

    if emergency_type == EMERGENCY_TYPE_TRAUMATIC or emergency_type == EMERGENCY_TYPE_GENERAL:
        return None

    if emergency_type == EMERGENCY_TYPE_CARDIAC:
        if any(keyword in condition_name for keyword in CARDIAC_CRITICAL_KEYWORDS):
            return ("critical", f"{condition.nombre_condicion} relacionada con emergencia cardiaca")
        return None

    if emergency_type == EMERGENCY_TYPE_RESPIRATORY:
        if "asma" in condition_name:
            if any(keyword in condition_name for keyword in SEVERITY_KEYWORDS):
                return ("critical", f"{condition.nombre_condicion} clasificada como asma severa")
            return ("informative", f"{condition.nombre_condicion} clasificada como asma informativa")

        if "epoc" in condition_name or "enfermedad pulmonar obstructiva cronica" in condition_name:
            if any(keyword in condition_name for keyword in SEVERITY_KEYWORDS):
                return ("critical", f"{condition.nombre_condicion} clasificada como EPOC severo")
            return ("informative", f"{condition.nombre_condicion} clasificada como EPOC informativo")

        if any(keyword in condition_name for keyword in RESPIRATORY_CRITICAL_KEYWORDS):
            return ("critical", f"{condition.nombre_condicion} relacionada con emergencia respiratoria")

        if any(keyword in condition_name for keyword in RESPIRATORY_INFORMATIVE_KEYWORDS):
            return ("informative", f"{condition.nombre_condicion} relevante para emergencia respiratoria")
        return None

    if emergency_type == EMERGENCY_TYPE_NEUROLOGICAL:
        if any(keyword in condition_name for keyword in NEUROLOGICAL_CRITICAL_KEYWORDS):
            return ("critical", f"{condition.nombre_condicion} relacionada con emergencia neurologica")
        return None

    if emergency_type == EMERGENCY_TYPE_GASTROINTESTINAL:
        if any(keyword in condition_name for keyword in GASTROINTESTINAL_CRITICAL_KEYWORDS):
            return ("critical", f"{condition.nombre_condicion} relacionada con emergencia gastrointestinal")
        return None

    return None


def _parse_date(value: str | None) -> date | None:
    if not value:
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


def evaluate_policy_status(policy: PolicyPayload) -> dict[str, Any]:
    today = datetime.now(UTC).date()
    start_date = _parse_date(policy.fecha_inicio)
    end_date = _parse_date(policy.fecha_fin)
    raw_status = _normalize_text(policy.estado)
    policy_status = raw_status or "desconocido"

    within_date_range = True
    if start_date and today < start_date:
        within_date_range = False
    if end_date and today > end_date:
        within_date_range = False

    dates_present = bool(policy.fecha_inicio or policy.fecha_fin)
    dates_parseable = True
    if policy.fecha_inicio and start_date is None:
        dates_parseable = False
    if policy.fecha_fin and end_date is None:
        dates_parseable = False

    policy_state_valid = policy_status in {"vigente", "vencida", "suspendida", "cancelada"}
    policy_is_active = policy_status == "vigente" and within_date_range and dates_parseable
    return {
        "policy_status": policy_status,
        "policy_is_active": policy_is_active,
        "policy_in_date_range": within_date_range,
        "policy_dates_present": dates_present,
        "policy_dates_parseable": dates_parseable,
        "policy_state_valid": policy_state_valid,
    }


def evaluate_emergency_coverage(coverages: list[CoveragePayload]) -> dict[str, Any]:
    matching_coverages = [coverage for coverage in coverages if coverage.aplica_emergencia]
    return {
        "has_emergency_coverage": len(matching_coverages) > 0,
        "matching_emergency_coverages": len(matching_coverages),
        "coverages_present": len(coverages) > 0,
        "coverage_conclusive": len(coverages) > 0,
    }


def evaluate_preexisting_conditions(
    preexisting_conditions: list[PreexistingConditionPayload],
    emergency_type: str | None = None,
) -> dict[str, Any]:
    normalized_emergency_type = normalize_emergency_type(emergency_type)
    active_conditions = [condition for condition in preexisting_conditions if condition.activa]
    informative_conditions: list[str] = []
    critical_related_conditions: list[str] = []
    signals: list[str] = []
    relation_method = "none"

    for condition in active_conditions:
        classification = _classify_preexisting_condition(condition, normalized_emergency_type)
        if classification is None:
            continue
        severity, signal = classification
        signals.append(signal)
        if severity == "critical":
            critical_related_conditions.append(condition.nombre_condicion)
        else:
            informative_conditions.append(condition.nombre_condicion)

    if critical_related_conditions and informative_conditions:
        relation_method = "mixed"
    elif critical_related_conditions or informative_conditions:
        relation_method = "keyword"

    return {
        "active_preexisting_count": len(active_conditions),
        "active_preexisting_names": [condition.nombre_condicion for condition in active_conditions],
        "active_preexisting_informative_names": informative_conditions,
        "active_preexisting_related_critical_names": critical_related_conditions,
        "preexisting_relation_method": relation_method,
        "preexisting_signals": signals,
        "normalized_emergency_type": normalized_emergency_type,
    }


def build_result_payload_from_facts(
    request: ValidationRequest, facts: dict[str, Any]
) -> ValidationResultPayload:
    emergency_type = normalize_emergency_type(request.emergency.tipo_emergencia)
    data_inconclusive = not facts.get("policy_state_valid", True) or not facts.get("policy_dates_parseable", True)
    data_inconclusive = data_inconclusive or not facts.get("coverage_conclusive", True)
    critical_related_conditions = facts.get("active_preexisting_related_critical_names", [])

    if not facts.get("policy_is_active"):
        decision = REJECTED
        requires_manual_review = False
        coverage_status = "inactive_policy"
        manual_review_reason = None
    elif data_inconclusive:
        decision = MANUAL_REVIEW
        requires_manual_review = True
        coverage_status = "manual_review_data_inconclusive"
        manual_review_reason = "data_inconclusive"
    elif not facts.get("has_emergency_coverage"):
        decision = REJECTED
        requires_manual_review = False
        coverage_status = "not_covered"
        manual_review_reason = None
    elif critical_related_conditions:
        decision = MANUAL_REVIEW
        requires_manual_review = True
        coverage_status = "manual_review"
        manual_review_reason = "critical_related_preexisting"
    else:
        decision = APPROVED
        requires_manual_review = False
        coverage_status = "covered"
        manual_review_reason = None

    signals = list(facts.get("preexisting_signals", []))
    if manual_review_reason == "data_inconclusive":
        if not facts.get("policy_state_valid", True):
            signals.append("Estado de poliza no reconocido para decision automatica")
        if not facts.get("policy_dates_parseable", True):
            signals.append("Fechas de poliza no parseables")
        if not facts.get("coverage_conclusive", True):
            signals.append("Coberturas insuficientes para determinar aplicacion de emergencia")

    guidance_reason = manual_review_reason or "data_inconclusive"
    recommended_checks = (
        _build_manual_review_guidance(guidance_reason, emergency_type, signals)
        if requires_manual_review
        else []
    )

    return ValidationResultPayload(
        processStatus=COMPLETED,
        decision=decision,
        requiresManualReview=requires_manual_review,
        engineVersion=settings.engine_version,
        summaryPayload={
            "caseCode": request.emergency.codigo_caso,
            "policyNumber": request.policy.numero_poliza,
            "coverageStatus": coverage_status,
            "policyStatus": facts.get("policy_status"),
            "activePreexistingCount": facts.get("active_preexisting_count", 0),
            "emergencyType": emergency_type,
            "activePreexistingCriticalRelated": critical_related_conditions,
            "activePreexistingInformative": facts.get("active_preexisting_informative_names", []),
            "manualReviewReason": manual_review_reason,
            "signals": signals,
            "recommendedChecks": recommended_checks,
        },
        errorDetails=None,
        notifications=[],
    )
