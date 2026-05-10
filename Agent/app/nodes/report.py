from __future__ import annotations

from app.graph.state import GraphState
from app.services.report_builder import build_report


async def draft_report_with_llm_node(state: GraphState) -> GraphState:
    result_payload = await build_report(state["request"], state.get("facts", {}), state["result_payload"])
    return {"result_payload": result_payload}
