# Sistema de Emergencias - Borrador Backend

## 1. Objetivo

Construir el backend del Sistema de Emergencias usando la base de datos definida en `schema_postgresql.sql`, manteniendo alineacion funcional con `Requisitos.md` y evitando agregar complejidad innecesaria.

El sistema se implementara usando un backend en JavaScript con Express y utilizando unicamente la estructura actual de la base de datos, sin agregar nuevas tablas para roles, auditoria, historial, destinatarios o trazabilidad tecnica adicional.

---

## 2. Alcance del backend

El backend del Sistema de Emergencias sera responsable de:

- autenticar usuarios del sistema
- registrar y consultar pacientes
- consultar polizas y coberturas
- consultar preexistencias del paciente
- registrar emergencias medicas
- iniciar el flujo de validacion
- recibir el resultado del agente
- guardar informes de validacion
- guardar y exponer notificaciones
- permitir consulta del estado de los casos

No se implementara logica avanzada adicional fuera del modelo actual de la base de datos.

---

## 3. Stack tecnico

- `JavaScript`
- `Node.js`
- `Express`
- `PostgreSQL`

El backend debe seguir buenas practicas de desarrollo para mantener el codigo claro, mantenible y facil de extender.

---

## 4. Principios de desarrollo

### 4.1 Buenas practicas obligatorias

- usar separacion por capas: rutas, controladores, servicios, repositorios y validaciones
- mantener responsabilidades claras por modulo
- evitar logica de negocio dentro de las rutas
- validar entradas antes de llegar a la capa de negocio
- manejar errores de forma centralizada
- usar respuestas HTTP consistentes
- mantener nombres claros y descriptivos en variables, funciones, archivos y endpoints
- evitar nombres ambiguos como `data`, `info`, `temp`, `obj`, `item`, `resultFinal` si no describen el contexto real
- reutilizar configuraciones compartidas para base de datos, seguridad y cliente HTTP

### 4.2 Convenciones de nombres

- usar nombres explicitos como `authenticatedUser`, `emergencyRecord`, `patientPolicy`, `validationResponse`, `insuranceNotification`
- evitar abreviaciones innecesarias
- usar nombres que reflejen exactamente el contenido de la variable
- mantener coherencia entre nombres de payload, columnas y entidades del dominio

### 4.3 Variables de entorno

Todos los enlaces y valores sensibles o dependientes del entorno deben manejarse mediante variables de entorno.

Esto incluye, como minimo:

- URL del backend
- URL del agente de validacion
- URL de la base de datos
- puertos
- secretos de autenticacion
- cualquier endpoint externo o interno configurable

Ejemplos esperados:

- `PORT`
- `DATABASE_URL`
- `API_BASE_URL`
- `VALIDATION_AGENT_BASE_URL`
- `VALIDATION_AGENT_RESULT_PATH`
- `JWT_SECRET`

No se deben quemar enlaces dentro del codigo fuente.

---

## 5. Base de datos usada

Se trabajara directamente con las tablas ya existentes:

- `hospitales`
- `aseguradoras`
- `usuarios`
- `pacientes`
- `polizas`
- `coberturas`
- `preexistencias`
- `emergencias`
- `validaciones`
- `informes_validacion`
- `notificaciones`

---

## 6. Decisiones de diseno

Para mantener el proyecto simple, se trabajara con estas decisiones:

- Se usara `usuarios.rol` como mecanismo de control de acceso.
- No se implementara RBAC completo con tablas separadas de roles y permisos.
- No se crearan tablas adicionales de auditoria o historial.
- No se separaran estados o destinatarios de notificacion en otras entidades.
- No se modelara trazabilidad tecnica adicional para webhook.
- Las preexistencias se consultaran por paciente, no por poliza.
- El agente de validacion seguira siendo un componente externo integrado por API o webhook.
- El agente sera quien genere y envie las notificaciones; el backend solo las almacenara y las expondra al frontend.

---

## 7. Arquitectura sugerida

Se recomienda una arquitectura modular simple en Express.

### 7.1 Capas

- `routes`: define endpoints y aplica middlewares
- `controllers`: recibe la solicitud HTTP y construye la respuesta
- `services`: contiene la logica de negocio
- `repositories`: encapsula acceso a base de datos
- `validators`: valida request params, body y query
- `middlewares`: autenticacion, autorizacion, manejo de errores
- `config`: variables de entorno, base de datos y clientes externos

### 7.2 Estructura sugerida

```txt
src/
  config/
  modules/
    auth/
    patients/
    policies/
    preexisting-conditions/
    emergencies/
    validations/
    reports/
    notifications/
  shared/
    middlewares/
    utils/
    errors/
  app.js
  server.js
```

---

## 8. Modulos del backend

### 8.1 Modulo de autenticacion

Responsabilidad:

Controlar el acceso al sistema segun los usuarios registrados.

Funciones:

- iniciar sesion
- validar credenciales
- devolver usuario autenticado
- restringir acceso segun rol

Roles operativos usados:

- `registrador_emergencia`
- `receptor_admisiones`
- `receptor_aseguradora`

---

### 8.2 Modulo de pacientes

Responsabilidad:

Registrar y consultar la informacion basica del paciente.

Funciones:

- registrar paciente
- buscar paciente por documento
- consultar detalle del paciente
- reutilizar paciente existente al crear una emergencia

Tabla principal:

- `pacientes`

---

### 8.3 Modulo de polizas

Responsabilidad:

Consultar la poliza seleccionada para la emergencia y validar que pertenezca al paciente.

Funciones:

- consultar polizas de un paciente
- consultar vigencia
- consultar tipo y estado
- consultar plan
- consultar coberturas asociadas

Tablas principales:

- `polizas`
- `coberturas`

---

### 8.4 Modulo de preexistencias

Responsabilidad:

Exponer las condiciones previas del paciente como insumo para el agente.

Funciones:

- consultar preexistencias del paciente
- filtrar activas
- entregar informacion al flujo de validacion

Tabla principal:

- `preexistencias`

---

### 8.5 Modulo de emergencias

Responsabilidad:

Registrar y administrar los casos de emergencia medica.

Funciones:

- crear emergencia
- listar emergencias
- consultar detalle de un caso
- controlar estado del caso

Tabla principal:

- `emergencias`

Estados usados:

- `registrada`
- `en_validacion`
- `validada`
- `notificada`
- `cerrada`

---

### 8.6 Modulo de validaciones

Responsabilidad:

Gestionar el envio del caso al agente y registrar el resultado del analisis.

Funciones:

- crear validacion inicial
- cambiar estado del proceso
- construir payload para el agente
- enviar datos del caso al agente
- recibir respuesta del agente
- guardar decision final o error

Tabla principal:

- `validaciones`

Estados del proceso:

- `pendiente`
- `procesando`
- `completada`
- `fallida`

Decisiones posibles:

- `aprobado`
- `rechazado`
- `revision_manual`

---

### 8.7 Modulo de informes

Responsabilidad:

Guardar y exponer el informe formal generado por el agente.

Funciones:

- registrar informe
- consultar informe por validacion
- mostrar resumen y justificacion de la decision

Tabla principal:

- `informes_validacion`

Campos funcionales importantes:

- `codigo_informe`
- `resumen_ejecutivo`
- `analisis_cobertura`
- `analisis_preexistencias`
- `motivo_decision`
- `accion_sugerida`
- `fecha_generacion`

---

### 8.8 Modulo de notificaciones

Responsabilidad:

Recibir, almacenar y exponer las notificaciones generadas y enviadas por el Agente de Validacion.

Funciones:

- guardar notificacion para admisiones
- guardar notificacion para aseguradora
- listar notificaciones del usuario autenticado
- consultar detalle de notificacion
- marcar notificacion como leida
- consultar notificaciones pendientes

Tabla principal:

- `notificaciones`

Estados usados:

- `pendiente`
- `enviada`
- `leida`
- `fallida`

Tipos usados:

- `admisiones`
- `aseguradora`

---

## 9. Flujo principal del sistema

1. El usuario hospitalario inicia sesion.
2. El usuario busca o registra al paciente.
3. El usuario consulta y selecciona la poliza.
4. El usuario registra la emergencia.
5. El sistema guarda la emergencia en `emergencias`.
6. El sistema crea una validacion en `validaciones`.
7. El sistema envia al agente los datos de emergencia, paciente, poliza, coberturas y preexistencias.
8. El agente analiza la informacion.
9. El agente genera el informe.
10. El agente genera y envia las notificaciones.
11. El agente devuelve el resultado al Sistema de Emergencias.
12. El sistema actualiza la validacion.
13. El sistema guarda el informe en `informes_validacion`.
14. El sistema guarda las notificaciones en `notificaciones`.
15. Los usuarios consultan notificaciones e informes segun su rol.

---

## 10. Reglas de negocio

- Solo un usuario con rol `registrador_emergencia` puede crear emergencias.
- Los usuarios hospitalarios solo consultan emergencias de su hospital.
- Los usuarios de aseguradora solo consultan notificaciones que les pertenecen.
- La poliza seleccionada debe pertenecer al paciente del caso.
- Cada validacion pertenece a una sola emergencia.
- Cada informe pertenece a una sola validacion.
- Las notificaciones son generadas y enviadas por el Agente de Validacion, y luego almacenadas por el Sistema de Emergencias.
- Las preexistencias se consultan por paciente y se envian como apoyo al analisis.

---

## 11. Endpoints MVP sugeridos

### Autenticacion

- `POST /api/auth/login`
- `GET /api/auth/me`

### Pacientes

- `POST /api/patients`
- `GET /api/patients/:patientId`
- `GET /api/patients/document/:documentType/:documentNumber`

### Polizas

- `GET /api/patients/:patientId/policies`
- `GET /api/policies/:policyId`
- `GET /api/policies/:policyId/coverages`

### Preexistencias

- `GET /api/patients/:patientId/preexisting-conditions`

### Emergencias

- `POST /api/emergencies`
- `GET /api/emergencies`
- `GET /api/emergencies/:emergencyId`

### Validaciones

- `POST /api/emergencies/:emergencyId/validations`
- `POST /api/validations/:validationId/result`

### Informes

- `GET /api/reports/:reportId`

### Notificaciones

- `GET /api/notifications`
- `GET /api/notifications/pending`
- `GET /api/notifications/:notificationId`
- `PATCH /api/notifications/:notificationId/read`

---

## 12. Orden recomendado de implementacion

### Fase 1

- autenticacion
- usuario autenticado
- validacion basica por rol

### Fase 2

- pacientes
- consulta de polizas
- consulta de coberturas
- consulta de preexistencias

### Fase 3

- registro de emergencias
- listado de casos
- detalle de caso

### Fase 4

- creacion de validaciones
- integracion con agente
- recepcion de resultado

### Fase 5

- almacenamiento de informes
- almacenamiento de notificaciones
- bandeja de notificaciones

### Fase 6

- filtros por estado
- mejoras de consulta
- vistas de historial desde entidades ya existentes

---

## 13. Variables de entorno sugeridas

```env
NODE_ENV=development
PORT=3000
API_BASE_URL=http://localhost:3000
DATABASE_URL=postgresql://user:password@localhost:5432/emergency_system
JWT_SECRET=change_this_secret
JWT_EXPIRES_IN=8h
VALIDATION_AGENT_BASE_URL=http://localhost:4000
VALIDATION_AGENT_VALIDATE_PATH=/api/agent/validations
VALIDATION_RESULT_CALLBACK_PATH=/api/validations/:validationId/result
```

Notas:

- `VALIDATION_AGENT_BASE_URL` define el host del agente.
- `VALIDATION_AGENT_VALIDATE_PATH` define la ruta para enviar casos al agente.
- cualquier enlace adicional debe salir de variables de entorno.

---

## 14. Resultado esperado del MVP

Al finalizar el MVP, el backend debe permitir:

- iniciar sesion con usuarios operativos
- registrar pacientes
- consultar polizas y coberturas
- registrar una emergencia medica
- disparar el proceso de validacion
- recibir la respuesta del agente
- guardar el informe de validacion
- guardar notificaciones para admisiones y aseguradora
- consultar el estado completo del caso

---

## 15. Conclusion

El Sistema de Emergencias se implementara como un backend simple en JavaScript con Express, alineado a la base de datos existente y a los requisitos funcionales del proyecto.

La solucion cubrira el flujo principal del reto sin introducir nuevas estructuras que aumenten complejidad. Toda la logica del sistema se apoyara en las tablas actuales, en una arquitectura por capas y en una integracion controlada con el Agente de Validacion.
