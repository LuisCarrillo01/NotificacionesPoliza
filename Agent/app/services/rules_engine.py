from __future__ import annotations

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

    within_date_range = True
    if start_date and today < start_date:
        within_date_range = False
    if end_date and today > end_date:
        within_date_range = False

    policy_is_active = policy.estado == "vigente" and within_date_range
    return {
        "policy_status": policy.estado,
        "policy_is_active": policy_is_active,
        "policy_in_date_range": within_date_range,
    }


def evaluate_emergency_coverage(coverages: list[CoveragePayload]) -> dict[str, Any]:
    matching_coverages = [coverage for coverage in coverages if coverage.aplica_emergencia]
    return {
        "has_emergency_coverage": len(matching_coverages) > 0,
        "matching_emergency_coverages": len(matching_coverages),
    }


def evaluate_preexisting_conditions(
    preexisting_conditions: list[PreexistingConditionPayload],
) -> dict[str, Any]:
    active_conditions = [condition for condition in preexisting_conditions if condition.activa]
    return {
        "active_preexisting_count": len(active_conditions),
        "active_preexisting_names": [condition.nombre_condicion for condition in active_conditions],
    }


def build_result_payload_from_facts(
    request: ValidationRequest, facts: dict[str, Any]
) -> ValidationResultPayload:
    if not facts.get("policy_is_active"):
        decision = REJECTED
        requires_manual_review = False
        coverage_status = "inactive_policy"
    elif not facts.get("has_emergency_coverage"):
        decision = REJECTED
        requires_manual_review = False
        coverage_status = "not_covered"
    elif facts.get("active_preexisting_count", 0) > 0:
        decision = MANUAL_REVIEW
        requires_manual_review = True
        coverage_status = "manual_review"
    else:
        decision = APPROVED
        requires_manual_review = False
        coverage_status = "covered"

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
        },
        errorDetails=None,
        notifications=[],
    )
