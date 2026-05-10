export type UserRole =
  | 'registrador_emergencia'
  | 'receptor_admisiones'
  | 'receptor_aseguradora'

export type AuthenticatedUser = {
  id: string
  role: UserRole
  hospitalId: string | null
  insuranceCompanyId: string | null
  username: string
  email: string
  fullName: string
  status: string
}

export type LoginPayload = {
  usernameOrEmail: string
  password: string
}

export type LoginResponse = {
  token: string
  user: AuthenticatedUser
}

export type Patient = {
  id: string
  documentType: string
  documentNumber: string
  firstName: string
  lastName: string
  birthDate: string
  gender: string | null
  phoneNumber: string | null
  emailAddress: string | null
  address: string | null
}

export type PatientPayload = {
  documentType: string
  documentNumber: string
  firstName: string
  lastName: string
  birthDate: string
  gender?: string
  phoneNumber?: string
  emailAddress?: string
  address?: string
}

export type Insurer = {
  id: string
  code: string
  name: string
}

export type Policy = {
  id: string
  insuranceCompanyId: string
  patientId: string
  policyNumber: string
  policyType: string
  policyStatus: string
  planName: string | null
  generalConditions: string | null
  startDate: string
  endDate: string
}

export type CoveragePayload = {
  coverageType: string
  maximumAmount?: number
  coveragePercentage?: number
  description?: string
  appliesToEmergency?: boolean
}

export type PolicyPayload = {
  insurerId: string
  patientId: string
  policyNumber: string
  type: string
  status: string
  planName?: string
  startDate: string
  endDate: string
  coverages?: CoveragePayload[]
}


export type PreexistingCondition = {
  id: string
  patientId: string
  diagnosisCode: string | null
  conditionName: string
  description: string | null
  diagnosisDate: string | null
  isActive: boolean
}

export type Emergency = {
  id: string
  patientId: string
  hospitalId: string
  policyId: string
  registeredByUserId: string
  caseCode: string
  emergencyType: string
  priorityLevel: string
  emergencyStatus: string
  admissionDate: string
  initialDescription: string | null
  observations: string | null
  createdAt: string
  updatedAt: string
}

export type EmergencyPayload = {
  patientDocumentType: string
  patientDocumentNumber: string
  policyNumber: string
  emergencyType: string
  priorityLevel: string
  admissionDate: string
  initialDescription?: string
  observations?: string
}

export type Validation = {
  id: string
  emergencyId: string
  processStatus: string
  decision: string | null
  requiresManualReview: boolean
  requestDate: string
  responseDate: string | null
  engineVersion: string | null
  payloadSummary: unknown
  errorDetails: string | null
}

export type EmergencyValidation = Validation & {
  reportId: string | null
  createdAt: string
  updatedAt: string
}

export type Notification = {
  id: string
  validationId: string
  recipientUserId: string
  notificationType: string
  channel: string
  notificationStatus: string
  title: string
  message: string
  generatedAt: string
  sentAt: string | null
  readAt: string | null
}

export type Report = {
  id: string
  validationId: string
  reportCode: string
  executiveSummary: string
  coverageAnalysis: string | null
  preexistingConditionsAnalysis: string | null
  decisionReason: string
  suggestedAction: string | null
  generatedAt: string
  contentJson: unknown
}

export type ApiErrorPayload = {
  message?: string
  errors?: unknown
}
