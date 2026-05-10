from __future__ import annotations

from typing import Any, NotRequired, TypedDict

from app.schemas.contracts import ValidationRequest, ValidationResultPayload


class GraphState(TypedDict):
    request: ValidationRequest
    facts: NotRequired[dict[str, Any]]
    result_payload: NotRequired[ValidationResultPayload]
    callback_response: NotRequired[dict[str, Any]]
