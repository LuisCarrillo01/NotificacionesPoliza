from app.schemas.contracts import (
    CallbackPayload,
    CoveragePayload,
    EmergencyPayload,
    PatientPayload,
    PolicyPayload,
    PreexistingConditionPayload,
    ValidationRequest,
)
from app.services.rules_engine import build_result_payload_from_facts, evaluate_emergency_coverage, evaluate_policy_status, evaluate_preexisting_conditions


def build_request() -> ValidationRequest:
    return ValidationRequest(
        validationId="validation-1",
        emergency=EmergencyPayload(codigo_caso="EM-0001", tipo_emergencia="cardiaca"),
        patient=PatientPayload(nombres="Juan", apellidos="Perez"),
        policy=PolicyPayload(numero_poliza="POL-0001", estado="vigente"),
        coverages=[CoveragePayload(aplica_emergencia=True)],
        preexistingConditions=[],
        callback=CallbackPayload(validationId="validation-1", callbackPath="/api/validations/validation-1/result"),
    )


def test_policy_status_uses_estado_vigente():
    facts = evaluate_policy_status(PolicyPayload(numero_poliza="POL-1", estado="vigente"))
    assert facts["policy_is_active"] is True


def test_rejects_without_emergency_coverage():
    request = build_request()
    facts = {}
    facts.update(evaluate_policy_status(request.policy))
    facts.update(evaluate_emergency_coverage([CoveragePayload(aplica_emergencia=False)]))
    facts.update(evaluate_preexisting_conditions([]))
    result = build_result_payload_from_facts(request, facts)
    assert result.decision == "rechazado"


def test_manual_review_with_active_preexisting_condition():
    request = build_request()
    facts = {}
    facts.update(evaluate_policy_status(request.policy))
    facts.update(evaluate_emergency_coverage(request.coverages))
    facts.update(
        evaluate_preexisting_conditions(
            [PreexistingConditionPayload(nombre_condicion="Hipertension", activa=True)]
        )
    )
    result = build_result_payload_from_facts(request, facts)
    assert result.decision == "revision_manual"
