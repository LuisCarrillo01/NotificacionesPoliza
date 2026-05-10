from __future__ import annotations

import os


os.environ.setdefault("API_BASE_URL", "http://localhost:3000")
os.environ.setdefault("VALIDATION_RESULT_CALLBACK_TOKEN", "change_this_callback_token")
os.environ.setdefault(
    "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/notificacion_validacion_poliza"
)
os.environ.setdefault("DATABASE_SSL", "false")
os.environ.setdefault("ENGINE_VERSION", "langgraph-v1")
