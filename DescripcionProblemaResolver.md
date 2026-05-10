# Descripción Detallada del Problema a Resolver

## 1. Contexto general

En los hospitales y centros médicos, el área de emergencias requiere actuar de forma inmediata cuando un paciente llega con una condición crítica o urgente.

Sin embargo, en muchos casos, antes de continuar completamente con el proceso administrativo y médico, es necesario verificar si el paciente posee una póliza médica válida y si la atención puede ser cubierta por la aseguradora correspondiente.

Actualmente, este proceso suele involucrar múltiples revisiones manuales, consultas entre diferentes departamentos y validaciones que consumen tiempo.

Mientras el hospital intenta confirmar la cobertura del paciente, también debe coordinar información con la aseguradora, revisar condiciones de la póliza y determinar si existen restricciones relacionadas con enfermedades o condiciones preexistentes.

Todo esto genera retrasos, dependencia de intervención humana y posibles errores administrativos.

---

# 2. Problema principal

El problema principal es que la validación de cobertura médica durante una emergencia puede convertirse en un proceso lento, desorganizado y dependiente de múltiples actores humanos.

Cuando un paciente ingresa al área de emergencias:

- el hospital necesita actuar rápidamente,
- la aseguradora necesita validar la póliza,
- y ambos necesitan compartir información de forma inmediata.

Sin un sistema automatizado, este proceso puede provocar:

- retrasos en la atención administrativa,
- tiempos largos de respuesta,
- pérdida de información,
- errores de validación,
- duplicación de trabajo,
- mala comunicación entre hospital y aseguradora,
- y dificultad para dar seguimiento a los casos.

---

# 3. Situación actual sin automatización

En un escenario tradicional, el flujo puede funcionar de la siguiente manera:

1. El paciente llega a emergencias.
2. El personal del hospital registra los datos manualmente.
3. El hospital busca información de la póliza.
4. Un operador consulta si la póliza sigue vigente.
5. Otro operador revisa coberturas.
6. Se revisan condiciones particulares o preexistencias.
7. Se genera una respuesta manual.
8. El resultado se comunica por correo, llamada o mensaje.
9. La aseguradora revisa el caso nuevamente.
10. Se producen retrasos y reprocesos.

Este flujo puede tomar demasiado tiempo para un entorno donde las decisiones deben ser rápidas.

---

# 4. Problemas específicos identificados

## 4.1 Validación lenta de pólizas

La revisión manual de pólizas puede retrasar el proceso de admisión del paciente.

El personal debe verificar:

- si la póliza existe,
- si está activa,
- si pertenece al paciente,
- si cubre la emergencia,
- y si existen restricciones.

Esto puede requerir acceder a múltiples sistemas o documentos.

---

## 4.2 Dificultad para analizar preexistencias

Las preexistencias representan uno de los puntos más delicados del análisis.

Una enfermedad o condición médica previa puede afectar la cobertura de la emergencia.

Cuando este análisis se realiza manualmente:

- puede existir interpretación incorrecta,
- inconsistencias,
- o demoras en la toma de decisiones.

---

## 4.3 Comunicación ineficiente entre hospital y aseguradora

El hospital y la aseguradora necesitan recibir información del caso casi en tiempo real.

Sin embargo, normalmente existen procesos separados y poca sincronización entre ambos actores.

Esto puede generar:

- información incompleta,
- respuestas tardías,
- duplicación de validaciones,
- y falta de trazabilidad.

---

## 4.4 Ausencia de trazabilidad centralizada

Muchas veces no existe un historial claro de:

- quién validó el caso,
- cuándo se realizó la validación,
- qué información fue utilizada,
- cuál fue el resultado,
- y qué notificaciones fueron enviadas.

Esto dificulta auditorías y seguimiento posterior.

---

## 4.5 Dependencia excesiva de procesos manuales

La validación depende principalmente de personas que deben:

- consultar información,
- comparar datos,
- interpretar condiciones,
- redactar respuestas,
- y comunicar resultados.

Esto aumenta el riesgo de:

- errores humanos,
- inconsistencias,
- tiempos muertos,
- y saturación operativa.

---

# 5. Necesidad del sistema propuesto

El sistema busca automatizar el proceso de validación de emergencias médicas mediante el uso de un flujo centralizado y un agente inteligente de validación.

La idea principal es que, cuando se registre una emergencia:

1. el sistema recopile automáticamente la información necesaria,
2. el agente analice la cobertura,
3. el agente revise las preexistencias,
4. el agente genere un informe,
5. y el resultado sea comunicado inmediatamente a los actores correspondientes.

---

# 6. Objetivo de la automatización

La automatización busca:

- reducir tiempos de respuesta,
- mejorar la coordinación entre hospital y aseguradora,
- disminuir errores manuales,
- centralizar la información,
- mejorar la trazabilidad,
- y facilitar el seguimiento de emergencias.

---

# 7. Importancia del agente de validación

El agente de validación representa el núcleo inteligente del sistema.

Su función es analizar automáticamente la información recibida y generar una decisión basada en reglas de negocio relacionadas con:

- vigencia de pólizas,
- cobertura,
- condiciones médicas,
- y preexistencias.

Además, el agente no solo determina un resultado, sino que también:

- genera el informe formal,
- crea las notificaciones,
- y comunica el resultado al sistema principal.

---

# 8. Actores involucrados

## 8.1 Usuario hospitalario

Responsable de registrar la emergencia médica dentro del sistema.

---

## 8.2 Área de admisiones

Necesita conocer rápidamente si la emergencia puede continuar bajo cobertura médica.

---

## 8.3 Gestor del seguro

Necesita revisar los casos enviados por el agente y analizar situaciones especiales o revisiones manuales.

---

## 8.4 Administrador

Gestiona usuarios, roles, permisos y configuración general del sistema.

---

## 8.5 Auditor

Consulta historial, trazabilidad y seguimiento de los casos.

---

# 9. Resultado esperado

Con el sistema implementado se espera que:

- las emergencias sean procesadas más rápido,
- la validación sea más consistente,
- exista trazabilidad completa,
- las notificaciones sean inmediatas,
- y la coordinación entre hospital y aseguradora mejore considerablemente.

---

# 10. Alcance del sistema

El sistema cubrirá:

- registro de emergencias,
- gestión de usuarios,
- gestión de pólizas,
- consulta de preexistencias,
- validación automática,
- generación de informes,
- notificaciones,
- historial,
- y visualización de resultados.

---

# 11. Limitaciones del sistema

El sistema no reemplaza completamente la decisión humana.

Existirán casos donde el agente determine que se requiere revisión manual, especialmente cuando:

- existan inconsistencias,
- la póliza tenga condiciones especiales,
- existan dudas sobre preexistencias,
- o la cobertura no pueda determinarse automáticamente.

---

# 12. Justificación del enfoque arquitectónico

El sistema se divide en:

- un Sistema de Emergencias,
- y un Agente de Validación.

Esta separación permite que la lógica operativa y la lógica inteligente no queden mezcladas.

El Sistema de Emergencias se concentra en:

- usuarios,
- emergencias,
- almacenamiento,
- historial,
- y frontend.

Mientras que el Agente de Validación se especializa en:

- análisis,
- toma de decisiones,
- generación de informes,
- y notificaciones.

Esto permite mantener una arquitectura más clara, organizada y mantenible.
# Borrador de Diseno de Base de Datos

## 1. Problema a resolver

El sistema necesita registrar emergencias medicas y ejecutar un flujo de validacion de poliza que permita determinar si un caso queda aprobado, rechazado o en revision manual.

La base de datos debe soportar:

- Gestion de usuarios, roles y permisos.
- Registro de hospitales, aseguradoras y pacientes.
- Administracion de polizas, coberturas y preexistencias.
- Registro y trazabilidad de emergencias.
- Almacenamiento del resultado de la validacion realizada por el agente.
- Generacion y seguimiento de notificaciones.
- Auditoria de acciones y cambios importantes.

## 2. Objetivo del diseno

Construir una base de datos relacional, normalizada y mantenible que garantice integridad, trazabilidad y escalabilidad para el Sistema de Emergencias y su integracion con el Agente de Validacion.

## 3. Principios de diseno aplicados

- Normalizacion hasta al menos tercera forma normal para evitar duplicidad innecesaria.
- Separacion entre catalogos, datos maestros y datos transaccionales.
- Uso de claves primarias sustitutas (`id`) y claves unicas de negocio cuando aplique.
- Integridad referencial con claves foraneas.
- Historial de estados para no perder trazabilidad.
- Campos de auditoria en tablas criticas.
- Estados y tipos controlados mediante catalogos, no con texto libre.

## 4. Dominios funcionales de la base de datos

La base de datos se divide en los siguientes dominios:

1. Seguridad y acceso.
2. Organizacion.
3. Gestion medica.
4. Operacion de emergencias.
5. Validacion.
6. Notificaciones.
7. Auditoria.

## 5. Propuesta inicial de entidades

### 5.1 Seguridad y acceso

#### `usuarios`

Guarda las cuentas del sistema.

Campos principales:

- `id`
- `username`
- `email`
- `password_hash`
- `nombre_completo`
- `estado_usuario_id`
- `hospital_id` nullable
- `aseguradora_id` nullable
- `created_at`
- `updated_at`

#### `roles`

Catalogo de roles funcionales.

Campos principales:

- `id`
- `codigo`
- `nombre`
- `descripcion`

#### `permisos`

Catalogo de permisos del sistema.

Campos principales:

- `id`
- `codigo`
- `nombre`
- `descripcion`

#### `usuario_roles`

Relacion muchos a muchos entre usuarios y roles.

Campos principales:

- `id`
- `usuario_id`
- `rol_id`
- `created_at`

#### `rol_permisos`

Relacion muchos a muchos entre roles y permisos.

Campos principales:

- `id`
- `rol_id`
- `permiso_id`

#### `estados_usuario`

Catalogo para controlar si el usuario esta activo, inactivo o bloqueado.

### 5.2 Organizacion

#### `hospitales`

Datos de las instituciones hospitalarias.

Campos principales:

- `id`
- `codigo`
- `nombre`
- `rnc` o identificador fiscal
- `telefono`
- `email`
- `direccion`
- `estado`
- `created_at`

#### `aseguradoras`

Datos de las companias aseguradoras.

Campos principales:

- `id`
- `codigo`
- `nombre`
- `telefono`
- `email`
- `direccion`
- `estado`
- `created_at`

### 5.3 Gestion medica

#### `pacientes`

Informacion principal del paciente.

Campos principales:

- `id`
- `tipo_documento`
- `numero_documento`
- `nombres`
- `apellidos`
- `fecha_nacimiento`
- `sexo`
- `telefono`
- `email`
- `direccion`
- `created_at`
- `updated_at`

Regla recomendada:

- `numero_documento` debe ser unico por tipo de documento.

#### `polizas`

Representa la poliza asociada al paciente y emitida por una aseguradora.

Campos principales:

- `id`
- `numero_poliza`
- `aseguradora_id`
- `paciente_id`
- `tipo_poliza_id`
- `fecha_inicio`
- `fecha_fin`
- `estado_poliza_id`
- `plan_nombre`
- `condiciones_generales`
- `created_at`
- `updated_at`

#### `tipos_poliza`

Catalogo del tipo de poliza.

Ejemplos:

- Individual
- Familiar
- Empresarial

#### `estados_poliza`

Catalogo para estados como vigente, vencida, suspendida o cancelada.

#### `coberturas`

Define las coberturas incluidas dentro de una poliza.

Campos principales:

- `id`
- `poliza_id`
- `tipo_cobertura_id`
- `monto_maximo`
- `porcentaje_cobertura`
- `descripcion`
- `aplica_emergencia`
- `created_at`

#### `tipos_cobertura`

Catalogo para clasificar cobertura de emergencia, internamiento, cirugia u otras.

#### `preexistencias`

Condiciones medicas previamente registradas para un paciente.

Campos principales:

- `id`
- `paciente_id`
- `codigo_cie` nullable
- `nombre_condicion`
- `descripcion`
- `fecha_diagnostico` nullable
- `activa`
- `created_at`

#### `poliza_preexistencias`

Tabla puente para indicar si una preexistencia afecta o excluye una poliza especifica.

Campos principales:

- `id`
- `poliza_id`
- `preexistencia_id`
- `observacion`
- `restriccion_tipo_id`

#### `tipos_restriccion_preexistencia`

Catalogo para exclusiones, carencias o revision especial.

### 5.4 Operacion de emergencias

#### `emergencias`

Entidad central del proceso operativo.

Campos principales:

- `id`
- `codigo_caso`
- `paciente_id`
- `hospital_id`
- `poliza_id`
- `usuario_registro_id`
- `tipo_emergencia_id`
- `fecha_ingreso`
- `descripcion_inicial`
- `estado_emergencia_id`
- `prioridad_id`
- `created_at`
- `updated_at`

Reglas recomendadas:

- `codigo_caso` debe ser unico.
- Una emergencia debe vincularse a un paciente, hospital y poliza analizada.

#### `tipos_emergencia`

Catalogo para clasificar trauma, cardiaca, respiratoria, neurologica u otras.

#### `estados_emergencia`

Catalogo de estados del caso.

Ejemplos:

- Registrada
- En validacion
- Validada
- Notificada
- Cerrada

#### `prioridades_emergencia`

Catalogo para prioridad alta, media o critica.

#### `historial_estados_emergencia`

Mantiene trazabilidad completa del cambio de estado.

Campos principales:

- `id`
- `emergencia_id`
- `estado_emergencia_id`
- `fecha_cambio`
- `usuario_id` nullable
- `origen_cambio`
- `comentario`

### 5.5 Validacion

#### `validaciones`

Registra cada ejecucion del proceso de validacion del agente.

Campos principales:

- `id`
- `emergencia_id`
- `fecha_solicitud`
- `fecha_respuesta` nullable
- `estado_validacion_id`
- `resultado_validacion_id` nullable
- `requiere_revision_manual`
- `motor_version` nullable
- `payload_resumen` nullable
- `created_at`

#### `estados_validacion`

Catalogo para pendiente, procesando, completada, fallida.

#### `resultados_validacion`

Catalogo del resultado de negocio.

Ejemplos:

- Aprobado
- Rechazado
- Revision manual

#### `informes_validacion`

Almacena el resultado formal del analisis del agente.

Campos principales:

- `id`
- `validacion_id`
- `codigo_informe`
- `resumen_ejecutivo`
- `analisis_cobertura`
- `analisis_preexistencias`
- `motivo_decision`
- `accion_sugerida`
- `fecha_generacion`
- `contenido_json` nullable
- `created_at`

Recomendacion:

- Guardar datos clave en columnas estructuradas y detalles adicionales en `contenido_json` si se requiere flexibilidad.

### 5.6 Notificaciones

#### `notificaciones`

Representa la notificacion generada a partir de una validacion.

Campos principales:

- `id`
- `emergencia_id`
- `validacion_id`
- `tipo_notificacion_id`
- `titulo`
- `mensaje`
- `estado_notificacion_id`
- `fecha_generacion`
- `fecha_envio` nullable
- `created_at`

#### `tipos_notificacion`

Catalogo para notificacion a admisiones, gestor del seguro, alerta interna u otras.

#### `estados_notificacion`

Catalogo para pendiente, enviada, leida, fallida.

#### `destinatarios_notificacion`

Relaciona la notificacion con sus destinatarios reales.

Campos principales:

- `id`
- `notificacion_id`
- `usuario_id` nullable
- `rol_id` nullable
- `canal_notificacion_id`
- `fecha_lectura` nullable
- `estado_entrega`

#### `canales_notificacion`

Catalogo para bandeja interna, correo, webhook u otros canales.

### 5.7 Auditoria

#### `auditoria_logs`

Registra eventos importantes del sistema.

Campos principales:

- `id`
- `modulo`
- `entidad`
- `entidad_id`
- `accion`
- `descripcion`
- `usuario_id` nullable
- `fecha_evento`
- `ip_origen` nullable
- `datos_anteriores` nullable
- `datos_nuevos` nullable

#### `historial_casos`

Bitacora funcional de cada caso de emergencia.

Campos principales:

- `id`
- `emergencia_id`
- `evento`
- `descripcion`
- `fecha_evento`
- `usuario_id` nullable
- `fuente`

## 6. Relaciones principales

- Un `usuario` puede pertenecer a uno o varios `roles`.
- Un `rol` puede tener varios `permisos`.
- Un `hospital` puede tener muchos `usuarios` y muchas `emergencias`.
- Una `aseguradora` puede tener muchas `polizas` y muchos `usuarios` asociados.
- Un `paciente` puede tener muchas `polizas`, `preexistencias` y `emergencias`.
- Una `poliza` pertenece a una `aseguradora` y a un `paciente`.
- Una `poliza` puede tener muchas `coberturas`.
- Una `emergencia` pertenece a un `paciente`, un `hospital` y una `poliza`.
- Una `emergencia` puede tener muchas entradas en `historial_estados_emergencia`.
- Una `emergencia` puede generar una o varias `validaciones`.
- Una `validacion` puede generar un `informe_validacion`.
- Una `validacion` puede generar muchas `notificaciones`.
- Una `notificacion` puede tener uno o varios `destinatarios_notificacion`.

## 7. Reglas de negocio que impactan la base de datos

- No debe existir una emergencia sin paciente, hospital ni poliza asociada.
- No debe existir una validacion sin emergencia.
- No debe existir un informe sin validacion.
- El numero de poliza debe ser unico por aseguradora.
- El codigo del caso debe ser unico en todo el sistema.
- Los cambios de estado de una emergencia deben quedar registrados en historial.
- Las notificaciones deben poder marcarse como leidas sin perder su trazabilidad de envio.
- Las preexistencias deben poder relacionarse tanto al paciente como a restricciones concretas de la poliza.

## 8. Recomendaciones tecnicas

- Usar `UUID` o `BIGINT` como clave primaria segun la estrategia del proyecto.
- Aplicar indices en `numero_documento`, `numero_poliza`, `codigo_caso`, `estado_emergencia_id`, `fecha_ingreso`, `fecha_generacion` y claves foraneas de alto uso.
- Implementar `deleted_at` solo si el negocio requiere borrado logico; en caso contrario, preferir estados.
- Separar los catalogos en tablas propias para facilitar mantenimiento y validaciones.
- Evitar guardar el resultado completo del negocio unicamente en texto libre.

## 9. Orden recomendado de implementacion

1. Crear catalogos base.
2. Crear tablas maestras de seguridad y organizacion.
3. Crear tablas de pacientes, polizas, coberturas y preexistencias.
4. Crear tablas operativas de emergencias e historial.
5. Crear tablas de validacion e informes.
6. Crear tablas de notificaciones y destinatarios.
7. Crear tablas de auditoria.
8. Agregar indices, restricciones unicas y validaciones adicionales.

## 10. Siguiente entregable sugerido

El siguiente paso debe ser convertir este borrador en un modelo logico final con:

- nombre exacto de cada tabla,
- tipo de dato por columna,
- claves primarias y foraneas,
- restricciones `NOT NULL`, `UNIQUE` y `CHECK`,
- y luego generar el script SQL inicial.
