# Agent

Servicio independiente del Agente de Validacion construido con Python, FastAPI y LangGraph.

## Que hace

- Recibe validaciones desde el backend en `POST /api/validations`.
- Evalua la poliza con reglas deterministicas.
- Usa Groq solo para redactar el informe final.
- Envia el resultado al backend mediante callback.

## Requisitos

- Python 3.13+
- `GROQ_API_KEY` si quieres usar redaccion con LLM
- Acceso de solo lectura a la misma PostgreSQL del backend

## Instalacion

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Configuracion

1. Copia `.env.example` a `.env`.
2. Ajusta `API_BASE_URL` para que apunte al backend.
3. Usa el mismo `VALIDATION_RESULT_CALLBACK_TOKEN` del backend.
4. Define `DATABASE_URL` con acceso de solo lectura.
5. Define `GROQ_API_KEY`.

## Ejecutar

```bash
uvicorn app.main:app --host 0.0.0.0 --port 4000 --reload
```

## Flujo

1. El backend llama `POST /api/validations`.
2. El agente responde `202 Accepted`.
3. El workflow LangGraph procesa la validacion en segundo plano.
4. El agente hace callback a `POST /api/validations/{validationId}/result`.

## Notificaciones

- El agente resuelve los destinatarios reales por lectura desde PostgreSQL.
- No persiste nada en la base de datos.
- Si no encuentra un destinatario valido, omite esa notificacion y sigue enviando el informe y la decision al backend.
