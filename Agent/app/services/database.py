from __future__ import annotations

from psycopg import AsyncConnection
from psycopg.rows import dict_row

from app.config import settings


async def get_connection() -> AsyncConnection:
    connection = await AsyncConnection.connect(
        conninfo=settings.database_url,
        sslmode="require" if settings.database_ssl else "disable",
        row_factory=dict_row,
    )
    await connection.execute("SET default_transaction_read_only = on")
    return connection
