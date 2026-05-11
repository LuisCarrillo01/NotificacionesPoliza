# Guía de Uso del Sistema de Validaciones de Pólizas

Este documento explica el flujo paso a paso de cómo utilizar el sistema, qué acciones realiza cada tipo de usuario y cuáles son sus credenciales de acceso para la versión de demostración.

---

## 🔑 Credenciales Generales
Para todos los usuarios de prueba, la contraseña es la misma:
- **Contraseña:** `123456`

---

## 🏥 Paso 1: El Registrador de Emergencias (Hospital)

Este usuario es la persona que se encuentra en la sala de emergencias (front-desk) recibiendo a los pacientes.

**Usuarios de prueba disponibles:**
- `registrador.demo` (Hospital Central)
- `registrador.norte` (Hospital Norte)

**Proceso:**
1. Inicia sesión en el sistema (ej: `registrador.demo` / `123456`).
2. Ve al menú **"Emergencias"** y haz clic en **"Nueva emergencia"**.
3. Busca al paciente por su cédula. Si no existe, regístralo, agrega sus **preexistencias médicas** y asígnale una **póliza**.
4. Llena los detalles de la emergencia y haz clic en **"Registrar emergencia"**.
5. Una vez registrada, serás redirigido al detalle de la emergencia. Aquí **debes hacer clic en "Enviar a validación"**. 
6. Esto enviará el caso al **Agente de Inteligencia Artificial** para que determine la cobertura. El estado pasará a "en validación".

---

## 📋 Paso 2: El Receptor de Admisiones (Hospital)

Este usuario representa al departamento de facturación o admisiones del hospital. **Solo tiene permisos de lectura** para auditar y revisar las validaciones de su hospital.

**Usuarios de prueba disponibles:**
- `admisiones.demo` (Hospital Central)
- `admisiones.norte` (Hospital Norte)

**Proceso:**
1. Inicia sesión en el sistema (ej: `admisiones.demo` / `123456`).
2. Ve a **"Emergencias"**. Verás la lista de todos los casos, pero notarás que no tienes habilitado el botón de "Nueva emergencia" ni el de "Validar", ya que tu rol es solo revisar.
3. Ve a **"Notificaciones"**. Cuando el Agente de Inteligencia Artificial termine de procesar la validación que solicitó el registrador, **recibirás una notificación aquí**.
4. Haz clic en la notificación o busca la emergencia en la lista, haz clic en "Ver detalle" y luego en **"Ver informe"** para leer la decisión tomada por la IA.

---

## 🛡️ Paso 3: El Analista de la Aseguradora

Este usuario pertenece a la entidad aseguradora y supervisa las validaciones de sus afiliados en distintos hospitales.

**Usuario de prueba disponible:**
- `aseguradora.demo` (Primera Salud Seguros)

**Proceso:**
1. Inicia sesión en el sistema (`aseguradora.demo` / `123456`).
2. Ve a tus **Notificaciones**. Recibirás una alerta cada vez que el Agente de IA finalice una evaluación para un afiliado de tu aseguradora.
3. Haz clic en la notificación para abrir el reporte y leer el "Análisis de Cobertura" y "Análisis de Preexistencias" que la IA realizó automáticamente.
