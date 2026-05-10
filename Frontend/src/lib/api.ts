import type {
  ApiErrorPayload,
  AuthenticatedUser,
  Emergency,
  EmergencyPayload,
  EmergencyValidation,
  LoginPayload,
  LoginResponse,
  Notification,
  Patient,
  PatientPayload,
  Policy,
  PreexistingCondition,
  Report,
  Validation,
} from '../types/api'
import { env } from '../config/env'

const API_BASE_URL = env.apiBaseUrl

export class ApiError extends Error {
  status: number
  details?: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH'
  body?: unknown
  token?: string
}

async function request<T>(path: string, options: RequestOptions = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const rawText = await response.text()
  const parsedBody = rawText ? (JSON.parse(rawText) as unknown) : null

  if (!response.ok) {
    const payload = parsedBody as ApiErrorPayload | null
    throw new ApiError(payload?.message ?? 'Ocurrio un error inesperado.', response.status, payload)
  }

  return parsedBody as T
}

export function loginRequest(payload: LoginPayload) {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: payload,
  })
}

export function getAuthenticatedUser(token: string) {
  return request<AuthenticatedUser>('/auth/me', { token })
}

export function listEmergencies(token: string) {
  return request<Emergency[]>('/emergencies', { token })
}

export function getEmergencyById(emergencyId: string, token: string) {
  return request<Emergency>(`/emergencies/${emergencyId}`, { token })
}

export function createEmergency(payload: EmergencyPayload, token: string) {
  return request<Emergency>('/emergencies', {
    method: 'POST',
    body: payload,
    token,
  })
}

export function triggerValidation(emergencyId: string, token: string) {
  return request<Validation>(`/emergencies/${emergencyId}/validations`, {
    method: 'POST',
    token,
  })
}

export function getEmergencyValidation(emergencyId: string, token: string) {
  return request<EmergencyValidation>(`/emergencies/${emergencyId}/validation`, { token })
}

export function getPatientByDocument(
  documentType: string,
  documentNumber: string,
  token: string,
) {
  return request<Patient>(`/patients/document/${documentType}/${documentNumber}`, { token })
}

export function createPatient(payload: PatientPayload, token: string) {
  return request<Patient>('/patients', {
    method: 'POST',
    body: payload,
    token,
  })
}

export function listPoliciesByPatient(patientId: string, token: string) {
  return request<Policy[]>(`/patients/${patientId}/policies`, { token })
}

export function listPreexistingConditionsByPatient(patientId: string, token: string) {
  return request<PreexistingCondition[]>(`/patients/${patientId}/preexisting-conditions`, { token })
}

export function listNotifications(token: string) {
  return request<Notification[]>('/notifications', { token })
}

export function listPendingNotifications(token: string) {
  return request<Notification[]>('/notifications/pending', { token })
}

export function getNotificationById(notificationId: string, token: string) {
  return request<Notification>(`/notifications/${notificationId}`, { token })
}

export function markNotificationAsRead(notificationId: string, token: string) {
  return request<Notification>(`/notifications/${notificationId}/read`, {
    method: 'PATCH',
    token,
  })
}

export function getReportById(reportId: string, token: string) {
  return request<Report>(`/reports/${reportId}`, { token })
}

export function getReportByValidationId(validationId: string, token: string) {
  return request<Report>(`/reports/validation/${validationId}`, { token })
}
