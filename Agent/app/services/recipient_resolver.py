from __future__ import annotations

import logging
from typing import Any, cast

from psycopg import sql

from app.config import settings
from app.schemas.contracts import ValidationRequest
from app.services.database import get_connection


logger = logging.getLogger(__name__)


async def _find_user_id_by_role_and_scope(
    *, role: str, scope_field: str, scope_id: str | None
) -> str | None:
    if not scope_id:
        return None

    query = sql.SQL(
        """
        SELECT id
        FROM usuarios
        WHERE rol = %s
          AND {scope_field} = %s
          AND estado = 'activo'
        ORDER BY created_at ASC
        LIMIT 1
        """
    ).format(scope_field=sql.Identifier(scope_field))

    async with await get_connection() as connection:
        async with connection.cursor() as cursor:
            await cursor.execute(cast(Any, query), (role, scope_id))
            record = cast(Any, await cursor.fetchone())
            return str(record["id"]) if record else None


async def _find_user_id_by_role_and_username(*, role: str, username: str | None) -> str | None:
    if not username:
        return None

    query = """
        SELECT id
        FROM usuarios
        WHERE rol = %s
          AND username = %s
          AND estado = 'activo'
        ORDER BY created_at ASC
        LIMIT 1
    """

    async with await get_connection() as connection:
        async with connection.cursor() as cursor:
            await cursor.execute(query, (role, username))
            record = cast(Any, await cursor.fetchone())
            return str(record["id"]) if record else None


async def _resolve_recipient_with_global_fallback(
    *,
    role: str,
    scope_field: str,
    scope_id: str | None,
    global_username: str,
    scope_label: str,
) -> str | None:
    recipient_id = await _find_user_id_by_role_and_scope(
        role=role,
        scope_field=scope_field,
        scope_id=scope_id,
    )

    if recipient_id:
        logger.info(
            "Resolved %s recipient by %s match",
            role,
            scope_label,
            extra={
                "role": role,
                "resolution_strategy": "specific_match",
                "scope_field": scope_field,
                "scope_id": scope_id,
                "recipient_id": recipient_id,
            },
        )
        return recipient_id

    logger.warning(
        "No active %s recipient found for %s %s. Falling back to global username %s",
        role,
        scope_label,
        scope_id,
        global_username,
    )

    fallback_recipient_id = await _find_user_id_by_role_and_username(
        role=role,
        username=global_username,
    )

    if fallback_recipient_id:
        logger.info(
            "Resolved %s recipient using global fallback",
            role,
            extra={
                "role": role,
                "resolution_strategy": "global_fallback",
                "scope_field": scope_field,
                "scope_id": scope_id,
                "global_username": global_username,
                "recipient_id": fallback_recipient_id,
            },
        )
        return fallback_recipient_id

    logger.error(
        "No active %s recipient found for %s %s and global username %s",
        role,
        scope_label,
        scope_id,
        global_username,
    )
    return None


async def resolve_notification_recipients(request: ValidationRequest) -> dict[str, str | None]:
    hospital_id = request.emergency.model_extra.get("hospital_id") if request.emergency.model_extra else None
    insurer_id = request.policy.model_extra.get("aseguradora_id") if request.policy.model_extra else None

    admissions_recipient_id = await _resolve_recipient_with_global_fallback(
        role="receptor_admisiones",
        scope_field="hospital_id",
        scope_id=hospital_id,
        global_username=settings.global_admissions_recipient_username,
        scope_label="hospital",
    )
    insurer_recipient_id = await _resolve_recipient_with_global_fallback(
        role="receptor_aseguradora",
        scope_field="aseguradora_id",
        scope_id=insurer_id,
        global_username=settings.global_insurer_recipient_username,
        scope_label="insurer",
    )

    return {
        "admisiones": admissions_recipient_id,
        "aseguradora": insurer_recipient_id,
    }
