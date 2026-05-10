from __future__ import annotations

import json
import logging
from typing import Any

import httpx

from app.config import settings
from app.schemas.contracts import GeneratedReportSections


logger = logging.getLogger(__name__)


_SECTIONS_JSON_SCHEMA: dict[str, Any] = {
    "name": "generated_report_sections",
    "schema": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "executiveSummary": {"type": "string"},
            "coverageAnalysis": {"type": "string"},
            "preexistingConditionsAnalysis": {"type": "string"},
            "decisionReason": {"type": "string"},
            "suggestedAction": {"type": "string"},
        },
        "required": [
            "executiveSummary",
            "coverageAnalysis",
            "preexistingConditionsAnalysis",
            "decisionReason",
            "suggestedAction",
        ],
    },
    "strict": True,
}


class OpenAIReportClient:
    def __init__(self) -> None:
        self._enabled = bool(settings.openai_api_key)

    @property
    def enabled(self) -> bool:
        return self._enabled

    @staticmethod
    def _extract_message_content(payload: dict[str, Any]) -> str:
        choices = payload.get("choices")
        if not isinstance(choices, list) or not choices:
            raise ValueError("OpenAI response missing choices")
        message = choices[0].get("message")
        if not isinstance(message, dict):
            raise ValueError("OpenAI response missing message")
        content = message.get("content")
        if not isinstance(content, str) or not content.strip():
            raise ValueError("OpenAI response missing content")
        return content

    async def generate_report_sections(self, prompt_context: dict[str, Any]) -> GeneratedReportSections:
        if not settings.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY is not configured")

        url = "https://api.openai.com/v1/chat/completions"

        system_prompt = (
            "Redacta reportes concisos de validacion de polizas en Espanol. "
            "Usa solo los hechos provistos; NO inventes detalles."
        )

        base_payload: dict[str, Any] = {
            "model": settings.openai_model,
            "temperature": 0,
            "response_format": {"type": "json_schema", "json_schema": _SECTIONS_JSON_SCHEMA},
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(prompt_context, ensure_ascii=True)},
            ],
        }

        headers = {
            "Authorization": f"Bearer {settings.openai_api_key}",
            "Content-Type": "application/json",
        }

        async def _invoke(payload: dict[str, Any]) -> GeneratedReportSections:
            async with httpx.AsyncClient(timeout=settings.http_timeout_seconds) as client:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                response_payload = response.json()

            content = self._extract_message_content(response_payload)
            data = json.loads(content)
            return GeneratedReportSections.model_validate(data)

        try:
            return await _invoke(base_payload)
        except Exception as error:
            logger.warning("OpenAI report generation failed, retrying once: %s", error)
            retry_payload = dict(base_payload)
            retry_payload["messages"] = [
                *base_payload["messages"],
                {
                    "role": "user",
                    "content": (
                        "Tu respuesta anterior no cumplio el formato. "
                        "Responde SOLO en JSON valido con exactamente las 5 claves requeridas. "
                        "Cada valor debe ser un string."
                    ),
                },
            ]
            return await _invoke(retry_payload)


openai_report_client = OpenAIReportClient()
