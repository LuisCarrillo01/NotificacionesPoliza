from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class FlexibleModel(BaseModel):
    model_config = ConfigDict(extra="allow")


class CallbackPayload(FlexibleModel):
    validationId: str
    callbackPath: str


class EmergencyPayload(FlexibleModel):
    id: str | None = None
    codigo_caso: str
    tipo_emergencia: str | None = None
    prioridad: str | None = None
    estado: str | None = None
    fecha_ingreso: datetime | None = None
    descripcion_inicial: str | None = None
    observaciones: str | None = None


class PatientPayload(FlexibleModel):
    id: str | None = None
    tipo_documento: str | None = None
    numero_documento: str | None = None
    nombres: str
    apellidos: str
    fecha_nacimiento: str | None = None


class PolicyPayload(FlexibleModel):
    id: str | None = None
    numero_poliza: str
    tipo: str | None = None
    estado: str
    plan_nombre: str | None = None
    condiciones_generales: str | None = None
    fecha_inicio: str | None = None
    fecha_fin: str | None = None


class CoveragePayload(FlexibleModel):
    id: str | None = None
    tipo_cobertura: str | None = None
    monto_maximo: float | None = None
    porcentaje_cobertura: float | None = None
    descripcion: str | None = None
    aplica_emergencia: bool = False


class PreexistingConditionPayload(FlexibleModel):
    id: str | None = None
    codigo_cie: str | None = None
    nombre_condicion: str
    descripcion: str | None = None
    fecha_diagnostico: str | None = None
    activa: bool = False


class ValidationRequest(FlexibleModel):
    validationId: str
    emergency: EmergencyPayload
    patient: PatientPayload
    policy: PolicyPayload
    coverages: list[CoveragePayload] = Field(default_factory=list)
    preexistingConditions: list[PreexistingConditionPayload] = Field(default_factory=list)
    callback: CallbackPayload


class ReportPayload(FlexibleModel):
    reportCode: str
    executiveSummary: str
    coverageAnalysis: str
    preexistingConditionsAnalysis: str
    decisionReason: str
    suggestedAction: str
    generatedAt: datetime
    contentJson: dict[str, Any] = Field(default_factory=dict)


class NotificationPayload(FlexibleModel):
    recipientUserId: str
    notificationType: str
    channel: str
    notificationStatus: str
    title: str
    message: str
    generatedAt: datetime
    sentAt: datetime | None = None
    readAt: datetime | None = None


class ValidationResultPayload(FlexibleModel):
    processStatus: str
    decision: str | None = None
    requiresManualReview: bool = False
    engineVersion: str
    summaryPayload: dict[str, Any] = Field(default_factory=dict)
    errorDetails: str | None = None
    report: ReportPayload | None = None
    notifications: list[NotificationPayload] = Field(default_factory=list)


class GeneratedReportSections(BaseModel):
    executiveSummary: str
    coverageAnalysis: str
    preexistingConditionsAnalysis: str
    decisionReason: str
    suggestedAction: str
