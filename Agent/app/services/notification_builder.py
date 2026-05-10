from __future__ import annotations

from datetime import UTC, datetime

from app.schemas.contracts import NotificationPayload, ValidationRequest, ValidationResultPayload
from app.services.recipient_resolver import resolve_notification_recipients


async def build_notifications(
    request: ValidationRequest, result_payload: ValidationResultPayload
) -> ValidationResultPayload:
    now = datetime.now(UTC)
    case_code = request.emergency.codigo_caso
    report = result_payload.report
    recipients = await resolve_notification_recipients(request)

    summary_message = report.executiveSummary if report else "Resultado de validacion disponible."
    policy_number = request.policy.numero_poliza
    patient_name = f"{request.patient.nombres} {request.patient.apellidos}".strip()

    notifications: list[NotificationPayload] = []

    if recipients.get("admisiones"):
        notifications.append(
            NotificationPayload(
                recipientUserId=recipients["admisiones"],
                notificationType="admisiones",
                channel="bandeja_interna",
                notificationStatus="enviada",
                title=f"Resultado de validacion {case_code}",
                message=f"{summary_message} Paciente: {patient_name}.",
                generatedAt=now,
                sentAt=now,
                readAt=None,
            )
        )

    if recipients.get("aseguradora"):
        notifications.append(
            NotificationPayload(
                recipientUserId=recipients["aseguradora"],
                notificationType="aseguradora",
                channel="correo",
                notificationStatus="enviada",
                title=f"Resultado de validacion {case_code}",
                message=f"{summary_message} Poliza: {policy_number}.",
                generatedAt=now,
                sentAt=now,
                readAt=None,
            )
        )

    return result_payload.model_copy(update={"notifications": notifications})
