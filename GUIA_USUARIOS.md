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
3. Busca al paciente por su cédula. Si no existe, el sistema te pedirá **registrar al paciente**.
4. Tras registrar los datos personales del paciente, el sistema te preguntará si el paciente tiene **preexistencias médicas** (puedes agregar enfermedades como "Asma" o darle a "Omitir").
5. Luego, el sistema te pedirá **asignarle una póliza**. Selecciona la aseguradora (ej. Primera Salud Seguros) y el plan correspondiente.
6. Finalmente, llena los detalles de la emergencia (tipo, nivel de prioridad, observaciones) y haz clic en **"Registrar emergencia"**.

---

## 📋 Paso 2: El Receptor de Admisiones (Hospital)

Este usuario representa al departamento de facturación o admisiones del hospital, encargado de validar si la aseguradora va a cubrir la emergencia del paciente.

**Usuarios de prueba disponibles:**
- `admisiones.demo` (Hospital Central)
- `admisiones.norte` (Hospital Norte)

**Proceso:**
1. Inicia sesión en el sistema (ej: `admisiones.demo` / `123456`).
2. Notarás que tienes una alerta en la campana de **Notificaciones** informando que se ha registrado una nueva emergencia.
3. Ve a **"Validaciones"** y haz clic en **"Nueva validación"**.
4. Selecciona la emergencia que el registrador acaba de crear.
5. Haz clic en **"Solicitar validación por IA"**. 
6. ¡Aquí ocurre la magia! El sistema enviará toda la información clínica y de la póliza al **Agente de Inteligencia Artificial**.
7. En unos segundos, recibirás un **Informe Detallado** donde la IA determina si la emergencia tiene cobertura o no, evaluando las reglas del plan y las preexistencias declaradas.
8. Una vez la validación finalice, el sistema notificará automáticamente a la aseguradora.

---

## 🛡️ Paso 3: El Analista de la Aseguradora

Este usuario pertenece a la entidad aseguradora y supervisa las validaciones y los fondos aprobados para los distintos hospitales.

**Usuario de prueba disponible:**
- `aseguradora.demo` (Primera Salud Seguros)

**Proceso:**
1. Inicia sesión en el sistema (`aseguradora.demo` / `123456`).
2. Ve a tus **Notificaciones**. Verás una alerta indicando que el hospital acaba de procesar un informe de validación automatizado.
3. Ve a **"Reportes de Validación"** (o "Validaciones").
4. Busca el reporte generado recientemente para revisar la decisión tomada por el Agente de IA.
5. Aquí podrás leer el "Análisis de Cobertura" y el "Análisis de Preexistencias" que hizo el Agente para entender por qué se aprobó o denegó la cobertura de ese caso particular.
