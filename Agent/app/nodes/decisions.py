from __future__ import annotations

from app.graph.state import GraphState
from app.services.rules_engine import build_result_payload_from_facts


def decide_outcome_node(state: GraphState) -> GraphState:
    return {
        "result_payload": build_result_payload_from_facts(state["request"], state.get("facts", {}))
    }
