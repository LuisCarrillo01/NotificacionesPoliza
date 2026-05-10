from __future__ import annotations

from langgraph.graph import END, StateGraph

from app.graph.state import GraphState
from app.nodes.callback import send_callback_node
from app.nodes.decisions import decide_outcome_node
from app.nodes.notifications import build_notifications_node
from app.nodes.report import draft_report_with_llm_node
from app.nodes.validation import (
    evaluate_emergency_coverage_node,
    evaluate_policy_status_node,
    evaluate_preexisting_conditions_node,
    validate_input_node,
)


def build_validation_graph():
    graph = StateGraph(GraphState)

    graph.add_node("validate_input", validate_input_node)
    graph.add_node("evaluate_policy_status", evaluate_policy_status_node)
    graph.add_node("evaluate_emergency_coverage", evaluate_emergency_coverage_node)
    graph.add_node("evaluate_preexisting_conditions", evaluate_preexisting_conditions_node)
    graph.add_node("decide_outcome", decide_outcome_node)
    graph.add_node("draft_report_with_llm", draft_report_with_llm_node)
    graph.add_node("build_notifications", build_notifications_node)
    graph.add_node("send_callback", send_callback_node)

    graph.set_entry_point("validate_input")
    graph.add_edge("validate_input", "evaluate_policy_status")
    graph.add_edge("evaluate_policy_status", "evaluate_emergency_coverage")
    graph.add_edge("evaluate_emergency_coverage", "evaluate_preexisting_conditions")
    graph.add_edge("evaluate_preexisting_conditions", "decide_outcome")
    graph.add_edge("decide_outcome", "draft_report_with_llm")
    graph.add_edge("draft_report_with_llm", "build_notifications")
    graph.add_edge("build_notifications", "send_callback")
    graph.add_edge("send_callback", END)

    return graph.compile()
