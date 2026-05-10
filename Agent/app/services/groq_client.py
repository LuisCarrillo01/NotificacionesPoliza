from __future__ import annotations

import json
import re
from typing import Any, cast

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from pydantic import SecretStr

from app.config import settings
from app.schemas.contracts import GeneratedReportSections


class GroqReportClient:
    def __init__(self) -> None:
        self._enabled = bool(settings.groq_api_key)
        self._client = None

        if self._enabled:
            groq_api_key = settings.groq_api_key
            if groq_api_key is None:
                raise RuntimeError("GROQ_API_KEY is required when Groq is enabled")
            groq_api_key = cast(str, groq_api_key)
            self._client = ChatGroq(
                api_key=SecretStr(groq_api_key),
                model=settings.groq_model,
                temperature=0,
            )

    @property
    def enabled(self) -> bool:
        return self._enabled

    @staticmethod
    def _extract_json_content(content: str) -> dict[str, Any]:
        stripped_content = content.strip()

        try:
            return json.loads(stripped_content)
        except json.JSONDecodeError:
            pass

        fenced_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", stripped_content, re.DOTALL)
        if fenced_match:
            return json.loads(fenced_match.group(1))

        object_match = re.search(r"\{.*\}", stripped_content, re.DOTALL)
        if object_match:
            return json.loads(object_match.group(0))

        raise json.JSONDecodeError("No JSON object found in model response", stripped_content, 0)

    @staticmethod
    def _validate_sections_payload(payload: dict[str, Any]) -> None:
        required_keys = (
            "executiveSummary",
            "coverageAnalysis",
            "preexistingConditionsAnalysis",
            "decisionReason",
            "suggestedAction",
        )

        missing = [key for key in required_keys if key not in payload]
        if missing:
            raise ValueError(f"Groq payload missing keys: {', '.join(missing)}")

        non_string = [
            key
            for key in required_keys
            if not isinstance(payload.get(key), str)
        ]
        if non_string:
            types_str = ", ".join(f"{k}={type(payload.get(k)).__name__}" for k in non_string)
            raise ValueError(f"Groq payload values must be strings: {types_str}")

    async def generate_report_sections(self, prompt_context: dict[str, Any]) -> GeneratedReportSections:
        if not self._client:
            raise RuntimeError("Groq client is not configured")

        system_prompt = (
            "You write concise insurance validation reports in Spanish. "
            "Use only the provided facts; do NOT invent details. "
            "Return ONLY strict JSON (no markdown). "
            "The JSON MUST have exactly these keys: "
            "executiveSummary, coverageAnalysis, preexistingConditionsAnalysis, decisionReason, suggestedAction. "
            "Each value MUST be a plain string (no objects, no arrays). "
            "Do NOT repeat the input JSON. "
            "Example output: "
            "{\"executiveSummary\":\"...\",\"coverageAnalysis\":\"...\",\"preexistingConditionsAnalysis\":\"...\",\"decisionReason\":\"...\",\"suggestedAction\":\"...\"}"
        )

        base_messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=json.dumps(prompt_context, ensure_ascii=True)),
        ]

        async def _invoke(messages: list[Any]) -> dict[str, Any]:
            client = cast(Any, self._client)
            response = await client.ainvoke(messages)
            raw_content = cast(Any, response.content)
            response_content = raw_content if isinstance(raw_content, str) else json.dumps(raw_content)
            payload = self._extract_json_content(response_content)
            self._validate_sections_payload(payload)
            return payload

        try:
            payload = await _invoke(base_messages)
        except Exception:
            # One retry with a correction message when the model returned a wrong shape.
            retry_messages = [
                *base_messages,
                HumanMessage(
                    content=(
                        "Your previous output was invalid JSON for this task. "
                        "Rewrite the response as ONLY strict JSON with the same 5 keys, "
                        "and ensure EVERY value is a plain string (no nested objects/arrays)."
                    )
                ),
            ]
            payload = await _invoke(retry_messages)

        return GeneratedReportSections.model_validate(payload)


groq_report_client = GroqReportClient()
