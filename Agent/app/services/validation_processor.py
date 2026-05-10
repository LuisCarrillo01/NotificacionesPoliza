from __future__ import annotations

import logging

from app.config import settings
from app.graph.workflow import build_validation_graph
from app.schemas.contracts import ValidationRequest, ValidationResultPayload
from app.services.backend_callback import send_validation_callback


logger = logging.getLogger(__name__)
validation_graph = build_validation_graph()


async def process_validation_request(payload: ValidationRequest) -> None:
    try:
        await validation_graph.ainvoke({"request": payload, "facts": {}})
    except Exception as error:  # pragma: no cover - defensive path
        logger.exception("Validation workflow failed for %s", payload.validationId)
        fallback_payload = ValidationResultPayload(
            processStatus="fallida",
            decision="revision_manual",
            requiresManualReview=True,
            engineVersion=settings.engine_version,
            summaryPayload={
                "caseCode": payload.emergency.codigo_caso,
                "fallback": True,
            },
            errorDetails=str(error),
            notifications=[],
        )
        try:
            await send_validation_callback(payload, fallback_payload)
        except Exception:
            logger.exception("Fallback callback failed for %s", payload.validationId)
