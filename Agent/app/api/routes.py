from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, status

from app.schemas.contracts import ValidationRequest
from app.services.validation_processor import process_validation_request


router = APIRouter(prefix="/api")


@router.post("/validations", status_code=status.HTTP_202_ACCEPTED)
async def receive_validation_request(
    payload: ValidationRequest, background_tasks: BackgroundTasks
) -> dict[str, str | bool]:
    background_tasks.add_task(process_validation_request, payload)
    return {
        "accepted": True,
        "validationId": payload.validationId,
    }
