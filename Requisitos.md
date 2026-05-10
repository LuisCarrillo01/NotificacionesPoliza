# División del Sistema y Responsabilidades

## 1. Nombre del sistema

Sistema de Validación de Emergencias Médicas con Agente Inteligente

---

## 2. Objetivo general

Diseñar un sistema que permita registrar emergencias médicas, validar automáticamente la póliza del paciente mediante un agente inteligente, generar un informe de validación y notificar el resultado a los actores correspondientes.

El sistema debe permitir que el hospital registre una emergencia y que, a partir de ese evento, se active un proceso automático de validación de cobertura, revisión de preexistencias y comunicación del resultado.

---

## 3. Estilo arquitectónico seleccionado

Se propone una arquitectura híbrida simple compuesta por:

- Un sistema principal con arquitectura monolítica modular.
- Un agente de validación separado como componente independiente.

Esta decisión permite mantener el sistema principal simple y organizado, mientras que el agente se separa porque concentra la lógica especializada de análisis, validación, generación de informe y notificación.

---

## 4. Sistemas principales

| Sistema | Responsabilidad general |
|---|---|
| Sistema de Emergencias | Gestiona usuarios, roles, pacientes, emergencias, pólizas, almacenamiento de resultados y visualización de notificaciones |
| Agente de Validación | Analiza la emergencia, valida póliza y preexistencias, genera el informe y notifica a los destinatarios correspondientes |

---

# 5. Sistema de Emergencias

## 5.1 Responsabilidad principal

El Sistema de Emergencias se encarga de la gestión operativa del proceso.

Su función principal es permitir que los usuarios autorizados registren emergencias, consulten información relacionada con pólizas y visualicen los resultados generados por el agente.

Este sistema no toma la decisión final sobre la validez de la póliza, sino que prepara la información necesaria, la envía al agente y posteriormente almacena el resultado recibido.

---

## 5.2 Responsabilidades del Sistema de Emergencias

- Gestionar el inicio de sesión de usuarios.
- Controlar roles y permisos.
- Registrar usuarios del sistema.
- Registrar hospitales y aseguradoras.
- Registrar pacientes.
- Crear emergencias médicas.
- Asociar una emergencia con un paciente, hospital y póliza.
- Consultar datos de pólizas.
- Consultar preexistencias registradas.
- Activar el flujo de validación mediante webhook interno.
- Enviar datos de la emergencia al agente de validación.
- Recibir el informe generado por el agente.
- Guardar el informe en la base de datos.
- Guardar las notificaciones generadas.
- Exponer las notificaciones al frontend.
- Permitir la consulta del historial de casos.
- Registrar auditoría de acciones importantes.

---

## 5.3 Módulos internos del Sistema de Emergencias

| Módulo | Responsabilidad |
|---|---|
| Módulo de Usuarios | Maneja login, roles, permisos y control de acceso |
| Módulo de Pacientes | Registra y consulta información básica del paciente |
| Módulo de Hospitales | Administra hospitales asociados al sistema |
| Módulo de Aseguradoras | Administra aseguradoras relacionadas con las pólizas |
| Módulo de Pólizas | Consulta pólizas, coberturas y vigencia |
| Módulo de Preexistencias | Consulta enfermedades o condiciones previas del paciente |
| Módulo de Emergencias | Crea y administra casos de emergencia |
| Módulo Webhook | Activa el proceso automático cuando se registra una emergencia |
| Módulo de Informes | Guarda y permite consultar informes generados por el agente |
| Módulo de Notificaciones Frontend | Entrega al frontend las notificaciones según el rol del usuario |
| Módulo de Auditoría | Registra acciones importantes del sistema |

---

# 6. Módulo de Usuarios

## 6.1 Responsabilidad

Controlar el acceso al sistema mediante autenticación y autorización.

## 6.2 Funciones

- Registrar usuarios.
- Iniciar sesión.
- Validar credenciales.
- Asignar roles.
- Controlar permisos.
- Asociar usuarios a una entidad específica, como hospital o aseguradora.
- Restringir el acceso a información según el rol.

## 6.3 Roles propuestos

| Rol | Descripción |
|---|---|
| Administrador | Gestiona usuarios, hospitales, aseguradoras y configuración general |
| Usuario Hospitalario | Registra emergencias y consulta resultados relacionados con su hospital |
| Admisiones | Visualiza notificaciones de emergencias validadas |
| Gestor del Seguro | Visualiza informes y casos enviados a la aseguradora |
| Auditor | Consulta historial, informes y trazabilidad |

---

# 7. Módulo de Emergencias

## 7.1 Responsabilidad

Registrar y administrar los casos de emergencia médica ingresados por el hospital.

## 7.2 Funciones

- Crear una emergencia.
- Asociar la emergencia con un paciente.
- Asociar la emergencia con un hospital.
- Registrar fecha y hora de ingreso.
- Registrar tipo de emergencia.
- Guardar estado del caso.
- Enviar la emergencia al flujo de validación.
- Permitir consultar el estado del caso.

## 7.3 Estados posibles de una emergencia

| Estado | Descripción |
|---|---|
| Registrada | La emergencia fue creada en el sistema |
| En validación | La información fue enviada al agente |
| Validada | El agente devolvió un informe |
| Notificada | El resultado fue enviado a los destinatarios |
| Cerrada | El caso fue finalizado |

---

# 8. Módulo Webhook

## 8.1 Responsabilidad

Activar automáticamente el flujo de validación cuando se registra una emergencia.

## 8.2 Funciones

- Recibir el evento de emergencia.
- Validar que los datos mínimos estén completos.
- Registrar el evento recibido.
- Activar el envío de información al agente.
- Cambiar el estado de la emergencia a `En validación`.

## 8.3 Justificación

El webhook funciona como un mecanismo de activación del flujo.

No se considera un sistema independiente, sino un módulo interno del Sistema de Emergencias, ya que depende directamente del registro de emergencias y de la información almacenada en la base de datos principal.

---

# 9. Módulo de Pólizas

## 9.1 Responsabilidad

Gestionar y consultar la información relacionada con las pólizas médicas del paciente.

## 9.2 Funciones

- Consultar pólizas activas.
- Verificar fechas de vigencia.
- Consultar tipo de póliza.
- Consultar cobertura disponible.
- Relacionar póliza con paciente.
- Entregar información al flujo de validación.

## 9.3 Información mínima de una póliza

- Número de póliza.
- Paciente asegurado.
- Aseguradora.
- Fecha de inicio.
- Fecha de vencimiento.
- Estado.
- Tipo de cobertura.
- Condiciones aplicables.

---

# 10. Módulo de Preexistencias

## 10.1 Responsabilidad

Consultar condiciones médicas previas asociadas al paciente.

## 10.2 Funciones

- Registrar preexistencias.
- Consultar preexistencias del paciente.
- Asociar preexistencias con una póliza.
- Entregar información al agente para el análisis.

## 10.3 Ejemplo de preexistencia

Una preexistencia puede ser una enfermedad, diagnóstico o condición médica que existía antes de la contratación de la póliza y que puede afectar la cobertura de una emergencia.

---

# 11. Agente de Validación

## 11.1 Responsabilidad principal

El Agente de Validación se encarga de analizar la emergencia médica y determinar si la póliza del paciente aplica, no aplica o requiere revisión manual.

Además, el agente genera el informe de validación y realiza las notificaciones correspondientes.

---

## 11.2 Responsabilidades del agente

- Recibir datos de la emergencia.
- Recibir datos del paciente.
- Recibir datos de la póliza.
- Recibir datos de cobertura.
- Recibir datos de preexistencias.
- Analizar la vigencia de la póliza.
- Validar si la emergencia está cubierta.
- Revisar si existen preexistencias relevantes.
- Determinar el resultado del análisis.
- Generar el informe de validación.
- Generar notificación para admisiones.
- Generar notificación para el gestor del seguro.
- Enviar el resultado al Sistema de Emergencias.
- Registrar el estado de envío de las notificaciones.

---

## 11.3 El agente no se encarga de

- Crear usuarios.
- Manejar login.
- Administrar roles.
- Crear hospitales.
- Crear aseguradoras.
- Registrar pacientes desde cero.
- Crear pólizas manualmente.
- Gestionar permisos.
- Mostrar información directamente en el frontend.

---

## 11.4 Componentes internos del agente

| Componente | Responsabilidad |
|---|---|
| Motor de Validación | Evalúa reglas de póliza, vigencia y cobertura |
| Analizador de Preexistencias | Revisa condiciones previas del paciente |
| Generador de Informe | Construye el informe final de validación |
| Generador de Notificaciones | Crea las notificaciones para admisiones y seguro |
| Emisor de Notificaciones | Envía las notificaciones generadas |
| Respuesta al Sistema | Devuelve resultado, informe y estados al Sistema de Emergencias |

---

# 12. Informe generado por el agente

## 12.1 Responsabilidad

El informe es creado por el Agente de Validación y posteriormente almacenado por el Sistema de Emergencias.

## 12.2 Contenido mínimo del informe

- Identificador del caso.
- Datos básicos del paciente.
- Datos de la emergencia.
- Datos de la póliza.
- Estado de la póliza.
- Resultado de la validación.
- Análisis de cobertura.
- Análisis de preexistencias.
- Motivo de aprobación, rechazo o revisión manual.
- Fecha y hora de generación.
- Destinatarios de la notificación.

## 12.3 Resultados posibles

| Resultado | Descripción |
|---|---|
| Aprobado | La póliza está vigente y cubre la emergencia |
| Rechazado | La póliza no aplica por vencimiento, falta de cobertura u otra restricción |
| Revisión manual | El caso requiere evaluación de un gestor humano |

---

# 13. Notificaciones

## 13.1 Responsabilidad general

Las notificaciones son generadas y enviadas por el Agente de Validación.

Sin embargo, el Sistema de Emergencias también las almacena y las expone al frontend para que los usuarios puedan visualizarlas según su rol.

---

## 13.2 Notificaciones existentes

| Notificación | Destinatario | Propósito |
|---|---|---|
| Notificación a Admisiones | Área de admisiones del hospital | Informar si la emergencia tiene cobertura o requiere revisión |
| Notificación al Gestor del Seguro | Gestor de casos de la aseguradora | Informar el resultado completo y permitir seguimiento del caso |

---

## 13.3 Notificación a Admisiones

### Responsabilidad

Informar al área de admisiones del hospital el resultado de la validación.

### Información que debe mostrar

- Código del caso.
- Nombre o identificador del paciente.
- Estado de la validación.
- Resultado general.
- Mensaje breve.
- Fecha y hora.
- Acción sugerida.

### Ejemplo

```txt
Caso: EM-0001
Resultado: Aprobado
Mensaje: La póliza se encuentra vigente y cubre la emergencia registrada.
Acción sugerida: Continuar con el proceso de admisión.

### 13.4 Notificación al Gestor del Seguro
**Responsabilidad**
Informar al gestor de casos de la aseguradora el resultado detallado del análisis.

**Información que debe mostrar**
* Código del caso.
* Datos del paciente.
* Datos de la póliza.
* Tipo de emergencia.
* Resultado de validación.
* Análisis de cobertura.
* Preexistencias encontradas.
* Motivo de la decisión.
* Informe generado.
* Fecha y hora.
* Acción sugerida.

**Ejemplo**
* **Caso:** EM-0001
* **Resultado:** Revisión manual
* **Motivo:** Se encontró una preexistencia relacionada con el caso.
* **Acción sugerida:** Revisar condiciones particulares de la póliza.

---

## 14. Módulo de Notificaciones Frontend
#### 14.1 Responsabilidad
El Módulo de Notificaciones Frontend pertenece al Sistema de Emergencias.
Su responsabilidad es entregar al frontend las notificaciones generadas por el agente para que sean visualizadas por los usuarios correspondientes.

#### 14.2 Funciones
* Recibir las notificaciones generadas por el agente.
* Guardar las notificaciones en la base de datos.
* Clasificar las notificaciones por destinatario.
* Asociar notificaciones a roles.
* Exponer notificaciones mediante API.
* Permitir listar notificaciones.
* Permitir ver el detalle de una notificación.
* Permitir marcar una notificación como leída.
* Permitir consultar notificaciones pendientes.
* Permitir consultar historial de notificaciones.

#### 14.3 Visualización según rol
| Rol | Qué visualiza |
| :--- | :--- |
| **Admisiones** | Notificaciones de emergencias del hospital |
| **Gestor del Seguro** | Casos enviados a la aseguradora con informe detallado |
| **Administrador** | Historial completo de notificaciones |
| **Auditor** | Trazabilidad de envíos y lectura |

#### 14.4 Pantallas sugeridas para frontend
* **Login:** Permite ingresar al sistema.
* **Registro de Emergencia:** Permite crear una nueva emergencia.
* **Bandeja de Admisiones:** Muestra notificaciones para admisiones.
* **Bandeja del Gestor del Seguro:** Muestra notificaciones para el seguro.
* **Detalle de Caso:** Muestra información completa de una emergencia.
* **Detalle de Informe:** Muestra el informe generado por el agente.
* **Historial de Casos:** Permite consultar emergencias anteriores.
* **Administración de Usuarios:** Permite gestionar usuarios y roles.

#### 14.5 APIs sugeridas para notificaciones
| Método | Endpoint | Responsabilidad |
| :--- | :--- | :--- |
| GET | `/notificaciones` | Lista notificaciones del usuario autenticado |
| GET | `/notificaciones/pendientes` | Lista notificaciones no leídas |
| GET | `/notificaciones/{id}` | Consulta el detalle de una notificación |
| PATCH | `/notificaciones/{id}/leida` | Marca una notificación como leída |
| GET | `/notificaciones/historial` | Consulta historial de notificaciones |

---

### 15. Flujo general del sistema
1. El usuario inicia sesión en el Sistema de Emergencias.
2. El usuario hospitalario registra una emergencia.
3. El Sistema de Emergencias guarda la emergencia.
4. El Módulo Webhook activa el flujo de validación.
5. El Sistema de Emergencias recopila datos del paciente, póliza y preexistencias.
6. El Sistema de Emergencias envía la información al Agente de Validación.
7. El Agente de Validación analiza la emergencia.
8. El Agente valida póliza, cobertura y preexistencias.
9. El Agente genera el informe.
10. El Agente genera dos notificaciones: una para admisiones y una para el gestor del seguro.
11. El Agente envía el resultado al Sistema de Emergencias.
12. El Sistema de Emergencias guarda el informe.
13. El Sistema de Emergencias guarda las notificaciones.
14. El frontend consulta las notificaciones según el rol del usuario.
15. Admisiones visualiza su notificación.
16. El gestor del seguro visualiza su notificación e informe.
17. El caso queda disponible para consulta e historial.

---

### 16. Flujo resumido
Usuario hospitalario  
↓  
Sistema de Emergencias  
↓  
Webhook interno  
↓  
Agente de Validación  
↓  
Informe + Notificaciones  
↓  
Sistema de Emergencias  
↓  
Frontend según rol  
↓  
Admisiones / Gestor del Seguro

---

### 17. Responsabilidades por sistema
| Responsabilidad | Sistema de Emergencias | Agente de Validación |
| :--- | :---: | :---: |
| Login de usuarios | Sí | No |
| Control de roles | Sí | No |
| Registro de pacientes | Sí | No |
| Creación de emergencias | Sí | No |
| Consulta de pólizas | Sí | No |
| Consulta de preexistencias | Sí | No |
| Validación inteligente | No | Sí |
| Generación del informe | No | Sí |
| Generación de notificaciones | No | Sí |
| Envío de notificaciones | No | Sí |
| Almacenamiento de informe | Sí | No |
| Exposición al frontend | Sí | No |
| Visualización de notificaciones | Sí | No |
| Auditoría del sistema | Sí | Parcial |

---

### 18. Entidades principales para la base de datos
#### 18.1 Seguridad y usuarios
* usuarios
* roles
* permisos
* usuario_roles

#### 18.2 Organización
* hospitales
* aseguradoras

#### 18.3 Gestión médica
* pacientes
* polizas
* coberturas
* preexistencias
* emergencias

#### 18.4 Validación
* validaciones
* informes_validacion
* resultados_validacion

#### 18.5 Notificaciones
* notificaciones
* destinatarios_notificacion
* estados_notificacion

#### 18.6 Auditoría
* auditoria_logs
* historial_casos

---

### 19. Decisiones arquitectónicas
#### 19.1 Separar el agente
El agente se separa porque contiene la lógica más especializada del sistema. Esta lógica puede cambiar con el tiempo, por ejemplo si se modifican reglas de validación, criterios de cobertura o análisis de preexistencias. Separarlo permite que el Sistema de Emergencias no mezcle responsabilidades operativas con responsabilidades inteligentes de análisis.

#### 19.2 Mantener el Sistema de Emergencias como monolito modular
El Sistema de Emergencias se mantiene como monolito modular porque sus funcionalidades están relacionadas entre sí y comparten la misma base de datos. Separar usuarios, emergencias, pólizas y notificaciones en microservicios aumentaría la complejidad sin aportar un beneficio necesario para el reto.

#### 19.3 Notificaciones visibles desde el frontend
Aunque el agente genera y envía las notificaciones, el Sistema de Emergencias debe guardarlas y exponerlas al frontend. Esto permite que cada usuario vea únicamente la información que le corresponde según su rol.

---

### 20. Conclusión
El sistema se divide en dos partes principales:
1.  **Sistema de Emergencias.**
2.  **Agente de Validación.**

El Sistema de Emergencias gestiona usuarios, emergencias, pólizas, almacenamiento, historial y visualización. El Agente de Validación analiza la información, determina el resultado, genera el informe y envía las notificaciones.

Esta división evita una arquitectura demasiado compleja, pero mantiene separada la lógica crítica del agente, permitiendo un diseño claro, mantenible y adecuado para el reto.