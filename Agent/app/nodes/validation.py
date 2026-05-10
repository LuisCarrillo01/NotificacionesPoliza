from __future__ import annotations

from app.graph.state import GraphState
from app.services.rules_engine import (
    evaluate_emergency_coverage,
    evaluate_policy_status,
    evaluate_preexisting_conditions,
)


def validate_input_node(state: GraphState) -> GraphState:
    request = state["request"]
    facts = dict(state.get("facts", {}))
    facts["case_code"] = request.emergency.codigo_caso
    facts["patient_full_name"] = f"{request.patient.nombres} {request.patient.apellidos}".strip()
    return {"facts": facts}


def evaluate_policy_status_node(state: GraphState) -> GraphState:
    request = state["request"]
    facts = dict(state.get("facts", {}))
    facts.update(evaluate_policy_status(request.policy))
    return {"facts": facts}


def evaluate_emergency_coverage_node(state: GraphState) -> GraphState:
    request = state["request"]
    facts = dict(state.get("facts", {}))
    facts.update(evaluate_emergency_coverage(request.coverages))
    return {"facts": facts}


def evaluate_preexisting_conditions_node(state: GraphState) -> GraphState:
    request = state["request"]
    facts = dict(state.get("facts", {}))
    facts.update(evaluate_preexisting_conditions(request.preexistingConditions))
    return {"facts": facts}
