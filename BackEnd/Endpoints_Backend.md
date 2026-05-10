# Endpoints Backend - Sistema de Emergencias

## Base URL

```txt
/api
```

## Autenticacion

### POST `/api/auth/login`

**Que hace**
- Inicia sesion de un usuario del sistema.
- Valida credenciales.
- Retorna un token JWT y la informacion basica del usuario autenticado.

**Body**
```json
{
  "usernameOrEmail": "usuario.demo",
  "password": "123456"
}
```

**Campos requeridos**
- `usernameOrEmail`: string
- `password`: string

**Respuesta esperada**
```json
{
  "token": "jwt-token",
  "user": {
    "id": "uuid",
    "role": "registrador_emergencia",
    "hospitalId": "uuid",
    "insuranceCompanyId": null,
    "username": "usuario.demo",
    "email": "demo@correo.com",
    "fullName": "Usuario Demo",
    "status": "activo"
  }
}
```

---

### GET `/api/auth/me`

**Que hace**
- Devuelve el perfil del usuario autenticado a partir del token.

**Headers**
```txt
Authorization: Bearer <token>
```

**Body**
- No requiere body.

---

## Pacientes

### POST `/api/patients`

**Que hace**
- Registra un nuevo paciente.
- Valida que no exista otro paciente con el mismo tipo y numero de documento.

**Headers**
```txt
Authorization: Bearer <token>
```

**Body**
```json
{
  "documentType": "cedula",
  "documentNumber": "00112345678",
  "firstName": "Juan",
  "lastName": "Perez",
  "birthDate": "1990-05-12",
  "gender": "masculino",
  "phoneNumber": "8095550000",
  "emailAddress": "juan.perez@correo.com",
  "address": "Santo Domingo"
}
```

**Campos requeridos**
- `documentType`: string
- `documentNumber`: string
- `firstName`: string
- `lastName`: string
- `birthDate`: string

**Campos opcionales**
- `gender`
- `phoneNumber`
- `emailAddress`
- `address`

---

### GET `/api/patients/:patientId`

**Que hace**
- Consulta el detalle de un paciente por su identificador.

**Headers**
```txt
Authorization: Bearer <token>
```

**Body**
- No requiere body.

---

### GET `/api/patients/document/:documentType/:documentNumber`

**Que hace**
- Busca un paciente por tipo y numero de documento.

**Headers**
```txt
Authorization: Bearer <token>
```

**Body**
- No requiere body.

---

## Polizas

### GET `/api/patients/:patientId/policies`

**Que hace**
- Lista las polizas asociadas a un paciente.

**Headers**
```txt
Authorization: Bearer <token>
```

**Body**
- No requiere body.

---

### GET `/api/policies/:policyId`

**Que hace**
- Consulta el detalle de una poliza especifica.

**Headers**
```txt
Authorization: Bearer <token>
```

**Body**
- No requiere body.

---

### GET `/api/policies/:policyId/coverages`

**Que hace**
- Lista las coberturas asociadas a una poliza.

**Headers**
```txt
Authorization: Bearer <token>
```

**Body**
- No requiere body.

---

## Preexistencias

### GET `/api/patients/:patientId/preexisting-conditions`

**Que hace**
- Lista las preexistencias registradas para un paciente.
- Sirve como insumo para el flujo de validacion.

**Headers**
```txt
Authorization: Bearer <token>
```

**Body**
- No requiere body.

---

## Emergencias

### POST `/api/emergencies`

**Que hace**
- Registra una nueva emergencia medica.
- Solo debe usarlo un usuario con rol `registrador_emergencia`.
- Resuelve automaticamente el paciente por documento.
- Resuelve automaticamente la poliza por numero de poliza del paciente.

**Headers**
```txt
Authorization: Bearer <token>
```

**Body**
```json
{
  "patientDocumentType": "cedula",
  "patientDocumentNumber": "00112345678",
  "policyNumber": "POL-0001",
  "emergencyType": "cardiaca",
  "priorityLevel": "critica",
  "admissionDate": "2026-05-09T10:30:00.000Z",
  "initialDescription": "Paciente con dolor toracico intenso",
  "observations": "Ingreso por emergencia"
}
```

**Campos requeridos**
- `patientDocumentType`: string
- `patientDocumentNumber`: string
- `policyNumber`: string
- `emergencyType`: string
- `priorityLevel`: string
- `admissionDate`: string

**Campos opcionales**
- `initialDescription`
- `observations`

**Notas**
- El usuario no escribe `patientId` ni `policyId`.
- El usuario no escribe `caseCode`.
- El backend busca el paciente por documento.
- El backend busca la poliza usando el paciente encontrado y el `policyNumber`.
- El backend genera automaticamente `caseCode` con formato `EM-YYYYMMDD-XXXX`.

---

### GET `/api/emergencies`

**Que hace**
- Lista las emergencias visibles para el usuario autenticado.
- En el caso de usuarios hospitalarios, devuelve las del hospital asociado.

**Headers**
```txt
Authorization: Bearer <token>
```

**Body**
- No requiere body.

---

### GET `/api/emergencies/:emergencyId`

**Que hace**
- Consulta el detalle de una emergencia especifica.
- Aplica validacion de acceso segun el hospital del usuario.

**Headers**
```txt
Authorization: Bearer <token>
```

**Body**
- No requiere body.

---

### PATCH `/api/emergencies/:emergencyId/cancel`

**Que hace**
- Cancela una emergencia medica antes de que entre al flujo de validacion.
- Solo debe usarlo un usuario con rol `registrador_emergencia`.
- Solo permite cancelar emergencias en estado `registrada`.

**Headers**
```txt
Authorization: Bearer <token>
```

**Body**
```json
{
  "cancellationReason": "Registro duplicado"
}
```

**Campos opcionales**
- `cancellationReason`: string

**Respuesta esperada**
```json
{
  "id": "60000000-0000-0000-0000-000000000001",
  "patientId": "40000000-0000-0000-0000-000000000001",
  "hospitalId": "10000000-0000-0000-0000-000000000001",
  "policyId": "50000000-0000-0000-0000-000000000001",
  "registeredByUserId": "30000000-0000-0000-0000-000000000001",
  "caseCode": "EM-20260510-0001",
  "emergencyType": "cardiaca",
  "priorityLevel": "critica",
  "emergencyStatus": "cancelada",
  "admissionDate": "2026-05-10T14:10:00.000Z",
  "initialDescription": "Paciente con dolor toracico intenso",
  "observations": "Cancelada: Registro duplicado",
  "createdAt": "2026-05-10T14:10:00.000Z",
  "updatedAt": "2026-05-10T14:20:00.000Z"
}
```

**Reglas**
- Si la emergencia ya esta en `en_validacion` o en un estado posterior, no se puede cancelar.
- El motivo de cancelacion se agrega en `observations` para trazabilidad.

---

## Validaciones

### POST `/api/emergencies/:emergencyId/validations`

**Que hace**
- Crea una validacion para una emergencia.
- Cambia el estado del caso a `en_validacion`.
- Construye el payload y lo envia al Agente de Validacion.

**Headers**
```txt
Authorization: Bearer <token>
```

**Body**
- No requiere body.

**Notas**
- El payload al agente se arma internamente con:
  - emergencia
  - paciente
  - poliza
  - coberturas
  - preexistencias
  - callback del resultado

---

### POST `/api/validations/:validationId/retry`

**Que hace**
- Reintenta el envio de una validacion al Agente de Validacion.
- Solo aplica si la validacion esta `fallida` o `procesando` por mas tiempo del umbral configurado.

**Headers**
```txt
Authorization: Bearer <token>
```

**Body**
- No requiere body.

**Respuesta esperada**
```json
{
  "id": "70000000-0000-0000-0000-000000000001",
  "emergencyId": "60000000-0000-0000-0000-000000000001",
  "processStatus": "procesando",
  "decision": null,
  "requiresManualReview": false,
  "requestDate": "2026-05-10T15:10:00.000Z",
  "responseDate": null,
  "engineVersion": null,
  "payloadSummary": {
    "emergencyId": "60000000-0000-0000-0000-000000000001",
    "caseCode": "EM-20260510-0001"
  },
  "errorDetails": null,
  "createdAt": "2026-05-10T14:55:00.000Z",
  "updatedAt": "2026-05-10T15:10:00.000Z"
}
```

**Errores esperados**
- `403` si el usuario no tiene acceso a la validacion.
- `404` si la validacion no existe.
- `409` si la validacion no esta fallida ni excedio el tiempo permitido para retry.

---

### POST `/api/validations/:validationId/result`

**Que hace**
- Endpoint de callback/webhook para que el Agente de Validacion envie el resultado.
- Guarda el resultado de la validacion.
- Guarda el informe.
- Guarda las notificaciones generadas y enviadas por el agente.
- Actualiza el estado de la emergencia.

**Headers**
```txt
x-callback-token: <VALIDATION_RESULT_CALLBACK_TOKEN>
```

**Body minimo**
```json
{
  "processStatus": "completada",
  "decision": "aprobado"
}
```

**Body recomendado**
```json
{
  "processStatus": "completada",
  "decision": "aprobado",
  "requiresManualReview": false,
  "engineVersion": "v1.0.0",
  "summaryPayload": {
    "coverageStatus": "covered"
  },
  "errorDetails": null,
  "report": {
    "reportCode": "INF-0001",
    "executiveSummary": "La poliza esta vigente y cubre la emergencia.",
    "coverageAnalysis": "La cobertura de emergencia aplica para este caso.",
    "preexistingConditionsAnalysis": "No se encontraron preexistencias relevantes.",
    "decisionReason": "Cobertura vigente sin restricciones aplicables.",
    "suggestedAction": "Continuar con el proceso de admision.",
    "generatedAt": "2026-05-09T11:00:00.000Z",
    "contentJson": {
      "result": "approved"
    }
  },
  "notifications": [
    {
      "recipientUserId": "uuid-destinatario",
      "notificationType": "admisiones",
      "channel": "bandeja_interna",
      "notificationStatus": "enviada",
      "title": "Resultado de validacion EM-0001",
      "message": "La poliza se encuentra vigente y cubre la emergencia.",
      "generatedAt": "2026-05-09T11:00:00.000Z",
      "sentAt": "2026-05-09T11:00:05.000Z",
      "readAt": null
    }
  ]
}
```

**Campos requeridos**
- `processStatus`: string

**Campos opcionales**
- `decision`
- `requiresManualReview`
- `engineVersion`
- `summaryPayload`
- `errorDetails`
- `report`
- `notifications`

---

## Informes

### GET `/api/reports/:reportId`

**Que hace**
- Consulta un informe de validacion almacenado en el sistema.

**Headers**
```txt
Authorization: Bearer <token>
```

**Body**
- No requiere body.

---

## Notificaciones

### GET `/api/notifications`

**Que hace**
- Lista todas las notificaciones del usuario autenticado.

**Headers**
```txt
Authorization: Bearer <token>
```

**Body**
- No requiere body.

---

### GET `/api/notifications/pending`

**Que hace**
- Lista las notificaciones pendientes o no leidas del usuario autenticado.

**Headers**
```txt
Authorization: Bearer <token>
```

**Body**
- No requiere body.

---

### GET `/api/notifications/:notificationId`

**Que hace**
- Consulta el detalle de una notificacion especifica.
- Solo permite acceso al destinatario de esa notificacion.

**Headers**
```txt
Authorization: Bearer <token>
```

**Body**
- No requiere body.

---

### PATCH `/api/notifications/:notificationId/read`

**Que hace**
- Marca una notificacion como leida.
- Actualiza el estado a `leida` y registra `fecha_lectura`.

**Headers**
```txt
Authorization: Bearer <token>
```

**Body**
- No requiere body.

---

## Resumen rapido por modulo

### Auth
- `POST /api/auth/login`
- `GET /api/auth/me`

### Patients
- `POST /api/patients`
- `GET /api/patients/:patientId`
- `GET /api/patients/document/:documentType/:documentNumber`

### Policies
- `GET /api/patients/:patientId/policies`
- `GET /api/policies/:policyId`
- `GET /api/policies/:policyId/coverages`

### Preexisting Conditions
- `GET /api/patients/:patientId/preexisting-conditions`

### Emergencies
- `POST /api/emergencies`
- `GET /api/emergencies`
- `GET /api/emergencies/:emergencyId`

### Validations
- `POST /api/emergencies/:emergencyId/validations`
- `POST /api/validations/:validationId/retry`
- `POST /api/validations/:validationId/result`

### Reports
- `GET /api/reports/:reportId`

### Notifications
- `GET /api/notifications`
- `GET /api/notifications/pending`
- `GET /api/notifications/:notificationId`
- `PATCH /api/notifications/:notificationId/read`
