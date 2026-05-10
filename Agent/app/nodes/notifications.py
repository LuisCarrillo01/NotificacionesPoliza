from __future__ import annotations

from app.graph.state import GraphState
from app.services.notification_builder import build_notifications


async def build_notifications_node(state: GraphState) -> GraphState:
    request = state.get("request")
    result_payload = state.get("result_payload")
    if request is None or result_payload is None:
        raise ValueError("Notification node requires request and result_payload in graph state")

    result_payload = await build_notifications(request, result_payload)
    return {"result_payload": result_payload}
