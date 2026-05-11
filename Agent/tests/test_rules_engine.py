from app.schemas.contracts import (
    CallbackPayload,
    CoveragePayload,
    EmergencyPayload,
    PatientPayload,
    PolicyPayload,
    PreexistingConditionPayload,
    ValidationRequest,
)
from app.services.rules_engine import (
    build_result_payload_from_facts,
    evaluate_emergency_coverage,
    evaluate_policy_status,
    evaluate_preexisting_conditions,
    normalize_emergency_type,
)


def build_request(emergency_type: str = "cardiaca") -> ValidationRequest:
    return ValidationRequest(
        validationId="validation-1",
        emergency=EmergencyPayload(codigo_caso="EM-0001", tipo_emergencia=emergency_type),
        patient=PatientPayload(nombres="Juan", apellidos="Perez"),
        policy=PolicyPayload(numero_poliza="POL-0001", estado="vigente"),
        coverages=[CoveragePayload(aplica_emergencia=True)],
        preexistingConditions=[],
        callback=CallbackPayload(validationId="validation-1", callbackPath="/api/validations/validation-1/result"),
    )


def build_facts(request: ValidationRequest, conditions: list[PreexistingConditionPayload], coverages=None):
    facts = {}
    facts.update(evaluate_policy_status(request.policy))
    selected_coverages = request.coverages if coverages is None else coverages
    facts.update(evaluate_emergency_coverage(selected_coverages))
    facts.update(evaluate_preexisting_conditions(conditions, request.emergency.tipo_emergencia))
    return facts


def test_policy_status_uses_estado_vigente():
    facts = evaluate_policy_status(PolicyPayload(numero_poliza="POL-1", estado="vigente"))
    assert facts["policy_is_active"] is True


def test_policy_status_accepts_iso_timestamp_dates():
    facts = evaluate_policy_status(
        PolicyPayload(
            numero_poliza="POL-1",
            estado="vigente",
            fecha_inicio="2026-05-11T00:00:00.000Z",
            fecha_fin="2027-05-11T00:00:00.000Z",
        )
    )
    assert facts["policy_is_active"] is True
    assert facts["policy_dates_parseable"] is True


def test_policy_status_trusts_vigente_when_dates_are_unparseable():
    facts = evaluate_policy_status(
        PolicyPayload(
            numero_poliza="POL-1",
            estado="vigente",
            fecha_inicio="11/05/2026",
            fecha_fin="11/05/2027",
        )
    )
    assert facts["policy_is_active"] is True
    assert facts["policy_dates_parseable"] is False


def test_normalizes_unknown_emergency_type_to_general():
    assert normalize_emergency_type("rara") == "GENERAL"


def test_rejects_without_emergency_coverage_when_coverage_data_is_conclusive():
    request = build_request()
    facts = build_facts(request, [], [CoveragePayload(aplica_emergencia=False)])
    result = build_result_payload_from_facts(request, facts)
    assert result.decision == "rechazado"


def test_manual_review_for_cardiac_hypertension():
    request = build_request("cardiaca")
    facts = build_facts(
        request,
        [PreexistingConditionPayload(nombre_condicion="Hipertension arterial", activa=True)],
    )
    result = build_result_payload_from_facts(request, facts)
    assert result.decision == "revision_manual"
    assert result.summaryPayload["manualReviewReason"] == "critical_related_preexisting"
    assert result.summaryPayload["recommendedChecks"]


def test_respiratory_asthma_without_severity_is_informative_only():
    request = build_request("respiratoria")
    facts = build_facts(
        request,
        [PreexistingConditionPayload(nombre_condicion="Asma", activa=True)],
    )
    result = build_result_payload_from_facts(request, facts)
    assert result.decision == "aprobado"
    assert facts["active_preexisting_informative_names"] == ["Asma"]


def test_respiratory_severe_asthma_forces_manual_review():
    request = build_request("respiratoria")
    facts = build_facts(
        request,
        [PreexistingConditionPayload(nombre_condicion="Asma cronica severa", activa=True)],
    )
    result = build_result_payload_from_facts(request, facts)
    assert result.decision == "revision_manual"
    assert facts["active_preexisting_related_critical_names"] == ["Asma cronica severa"]


def test_traumatic_preexisting_condition_does_not_force_manual_review():
    request = build_request("traumatica")
    facts = build_facts(
        request,
        [PreexistingConditionPayload(nombre_condicion="Osteoporosis", activa=True)],
    )
    result = build_result_payload_from_facts(request, facts)
    assert result.decision == "aprobado"


def test_empty_coverages_trigger_manual_review_for_inconclusive_data():
    request = build_request("general")
    facts = build_facts(request, [], [])
    result = build_result_payload_from_facts(request, facts)
    assert result.decision == "revision_manual"
    assert result.summaryPayload["manualReviewReason"] == "data_inconclusive"
