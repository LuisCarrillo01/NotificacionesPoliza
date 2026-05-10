from __future__ import annotations

import logging
from typing import Any

import httpx

from app.config import settings
from app.schemas.contracts import ValidationRequest, ValidationResultPayload


logger = logging.getLogger(__name__)


async def send_validation_callback(
    request: ValidationRequest, result_payload: ValidationResultPayload
) -> dict[str, Any]:
    callback_url = f"{settings.api_base_url}{request.callback.callbackPath}"

    logger.info(
        "Sending validation callback",
        extra={
            "validation_id": request.validationId,
            "callback_url": callback_url,
            "process_status": result_payload.processStatus,
            "decision": result_payload.decision,
            "report_code": result_payload.report.reportCode if result_payload.report else None,
            "notifications_count": len(result_payload.notifications or []),
            "has_callback_token": bool(settings.validation_result_callback_token),
        },
    )

    async with httpx.AsyncClient(timeout=settings.http_timeout_seconds) as client:
        response = await client.post(
            callback_url,
            json=result_payload.model_dump(mode="json"),
            headers={"x-callback-token": settings.validation_result_callback_token},
        )
        response.raise_for_status()
        logger.info(
            "Callback sent successfully",
            extra={
                "validation_id": request.validationId,
                "status_code": response.status_code,
            },
        )
        return {
            "status_code": response.status_code,
            "body": response.json(),
        }
