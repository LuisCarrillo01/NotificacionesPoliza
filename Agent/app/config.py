from __future__ import annotations

import os
from dataclasses import dataclass

from dotenv import load_dotenv


load_dotenv()


def _parse_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.lower() == "true"


def _get_required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


@dataclass(frozen=True)
class Settings:
    agent_env: str
    agent_host: str
    agent_port: int
    api_base_url: str
    validation_result_callback_token: str
    database_url: str
    database_ssl: bool
    global_admissions_recipient_username: str
    global_insurer_recipient_username: str
    openai_api_key: str | None
    openai_model: str
    groq_api_key: str | None
    groq_model: str
    engine_version: str
    http_timeout_seconds: float
    log_level: str


def get_settings() -> Settings:
    return Settings(
        agent_env=os.getenv("AGENT_ENV", "development"),
        agent_host=os.getenv("AGENT_HOST", "0.0.0.0"),
        agent_port=int(os.getenv("AGENT_PORT", "4000")),
        api_base_url=_get_required_env("API_BASE_URL"),
        validation_result_callback_token=_get_required_env("VALIDATION_RESULT_CALLBACK_TOKEN"),
        database_url=_get_required_env("DATABASE_URL"),
        database_ssl=_parse_bool(os.getenv("DATABASE_SSL"), False),
        global_admissions_recipient_username=os.getenv(
            "GLOBAL_ADMISSIONS_RECIPIENT_USERNAME", "admisiones.demo"
        ),
        global_insurer_recipient_username=os.getenv(
            "GLOBAL_INSURER_RECIPIENT_USERNAME", "aseguradora.demo"
        ),
        openai_api_key=os.getenv("OPENAI_API_KEY"),
        openai_model=os.getenv("OPENAI_MODEL", "gpt-4.1-mini"),
        groq_api_key=os.getenv("GROQ_API_KEY"),
        groq_model=os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
        engine_version=os.getenv("ENGINE_VERSION", "langgraph-v1"),
        http_timeout_seconds=float(os.getenv("HTTP_TIMEOUT_SECONDS", "15")),
        log_level=os.getenv("LOG_LEVEL", "INFO"),
    )


settings = get_settings()
