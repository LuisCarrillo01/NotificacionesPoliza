from __future__ import annotations

from app.graph.state import GraphState
from app.services.backend_callback import send_validation_callback


async def send_callback_node(state: GraphState) -> GraphState:
    callback_response = await send_validation_callback(state["request"], state["result_payload"])
    return {"callback_response": callback_response}
