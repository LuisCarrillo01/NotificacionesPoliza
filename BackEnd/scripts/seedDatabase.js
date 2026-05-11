const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const DEMO_IDS = {
  hospitals: {
    central: '10000000-0000-0000-0000-000000000001',
    north: '10000000-0000-0000-0000-000000000002'
  },
  insurers: {
    primera: '20000000-0000-0000-0000-000000000001',
    familiar: '20000000-0000-0000-0000-000000000002'
  },
  users: {
    registrarCentral: '30000000-0000-0000-0000-000000000001',
    admissionsCentral: '30000000-0000-0000-0000-000000000002',
    insurerReceiver: '30000000-0000-0000-0000-000000000003',
    registrarNorth: '30000000-0000-0000-0000-000000000004',
    admissionsNorth: '30000000-0000-0000-0000-000000000005'
  },
  patients: {
    juan: '40000000-0000-0000-0000-000000000001',
    maria: '40000000-0000-0000-0000-000000000002',
    ind_basico: '40000000-0000-0000-0000-000000000003',
    ind_plus: '40000000-0000-0000-0000-000000000004',
    fam_est: '40000000-0000-0000-0000-000000000005',
    emp_base: '40000000-0000-0000-0000-000000000006',
    emp_prem: '40000000-0000-0000-0000-000000000007'
  },
  policies: {
    juan: '50000000-0000-0000-0000-000000000001',
    maria: '50000000-0000-0000-0000-000000000002',
    ind_basico: '50000000-0000-0000-0000-000000000003',
    ind_plus: '50000000-0000-0000-0000-000000000004',
    fam_est: '50000000-0000-0000-0000-000000000005',
    emp_base: '50000000-0000-0000-0000-000000000006',
    emp_prem: '50000000-0000-0000-0000-000000000007'
  },
  emergencies: {
    completed: '60000000-0000-0000-0000-000000000001',
    readyForValidation: '60000000-0000-0000-0000-000000000002',
    northCase: '60000000-0000-0000-0000-000000000003'
  },
  validations: {
    completed: '70000000-0000-0000-0000-000000000001'
  },
  reports: {
    completed: '80000000-0000-0000-0000-000000000001'
  },
  notifications: {
    admissions: '90000000-0000-0000-0000-000000000001',
    insurer: '90000000-0000-0000-0000-000000000002'
  }
};

const TABLES_IN_DELETE_ORDER = [
  'notificaciones',
  'informes_validacion',
  'validaciones',
  'emergencias',
  'preexistencias',
  'coberturas',
  'polizas',
  'usuarios',
  'pacientes',
  'aseguradoras',
  'hospitales'
];

const SCHEMA_FILE_PATH = path.resolve(__dirname, '..', '..', 'schema_postgresql.sql');

function getDatabaseSslConfig() {
  return process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false;
}

function getRequiredEnvironmentVariable(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function insertHospital(client, hospital) {
  await client.query(
    `
      INSERT INTO hospitales (id, codigo, nombre, rnc, telefono, email, direccion, activo)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
    [
      hospital.id,
      hospital.code,
      hospital.name,
      hospital.rnc,
      hospital.phone,
      hospital.email,
      hospital.address,
      hospital.active
    ]
  );
}

async function insertInsurer(client, insurer) {
  await client.query(
    `
      INSERT INTO aseguradoras (id, codigo, nombre, telefono, email, direccion, activo)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
    [insurer.id, insurer.code, insurer.name, insurer.phone, insurer.email, insurer.address, insurer.active]
  );
}

async function insertUser(client, user) {
  await client.query(
    `
      INSERT INTO usuarios (
        id,
        rol,
        hospital_id,
        aseguradora_id,
        username,
        email,
        password_hash,
        nombre_completo,
        estado
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `,
    [
      user.id,
      user.role,
      user.hospitalId,
      user.insurerId,
      user.username,
      user.email,
      user.passwordHash,
      user.fullName,
      user.status
    ]
  );
}

async function insertPatient(client, patient) {
  await client.query(
    `
      INSERT INTO pacientes (
        id,
        tipo_documento,
        numero_documento,
        nombres,
        apellidos,
        fecha_nacimiento,
        sexo,
        telefono,
        email,
        direccion
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `,
    [
      patient.id,
      patient.documentType,
      patient.documentNumber,
      patient.firstName,
      patient.lastName,
      patient.birthDate,
      patient.gender,
      patient.phone,
      patient.email,
      patient.address
    ]
  );
}

async function insertPolicy(client, policy) {
  await client.query(
    `
      INSERT INTO polizas (
        id,
        aseguradora_id,
        paciente_id,
        numero_poliza,
        tipo,
        estado,
        plan_nombre,
        condiciones_generales,
        fecha_inicio,
        fecha_fin
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `,
    [
      policy.id,
      policy.insurerId,
      policy.patientId,
      policy.policyNumber,
      policy.type,
      policy.status,
      policy.planName,
      policy.generalConditions,
      policy.startDate,
      policy.endDate
    ]
  );
}

async function insertCoverage(client, coverage) {
  await client.query(
    `
      INSERT INTO coberturas (
        poliza_id,
        tipo_cobertura,
        monto_maximo,
        porcentaje_cobertura,
        descripcion,
        aplica_emergencia
      )
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [
      coverage.policyId,
      coverage.coverageType,
      coverage.maximumAmount,
      coverage.coveragePercentage,
      coverage.description,
      coverage.appliesToEmergency
    ]
  );
}

async function insertPreexistingCondition(client, condition) {
  await client.query(
    `
      INSERT INTO preexistencias (
        paciente_id,
        codigo_cie,
        nombre_condicion,
        descripcion,
        fecha_diagnostico,
        activa
      )
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [
      condition.patientId,
      condition.icdCode,
      condition.conditionName,
      condition.description,
      condition.diagnosisDate,
      condition.active
    ]
  );
}

async function insertEmergency(client, emergency) {
  await client.query(
    `
      INSERT INTO emergencias (
        id,
        paciente_id,
        hospital_id,
        poliza_id,
        usuario_registro_id,
        codigo_caso,
        tipo_emergencia,
        prioridad,
        estado,
        fecha_ingreso,
        descripcion_inicial,
        observaciones
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `,
    [
      emergency.id,
      emergency.patientId,
      emergency.hospitalId,
      emergency.policyId,
      emergency.registeredByUserId,
      emergency.caseCode,
      emergency.emergencyType,
      emergency.priorityLevel,
      emergency.status,
      emergency.admissionDate,
      emergency.initialDescription,
      emergency.observations
    ]
  );
}

async function insertValidation(client, validation) {
  await client.query(
    `
      INSERT INTO validaciones (
        id,
        emergencia_id,
        estado_proceso,
        decision,
        requiere_revision_manual,
        fecha_solicitud,
        fecha_respuesta,
        motor_version,
        payload_resumen,
        error_detalle
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10)
    `,
    [
      validation.id,
      validation.emergencyId,
      validation.processStatus,
      validation.decision,
      validation.requiresManualReview,
      validation.requestDate,
      validation.responseDate,
      validation.engineVersion,
      JSON.stringify(validation.payloadSummary),
      validation.errorDetails
    ]
  );
}

async function insertReport(client, report) {
  await client.query(
    `
      INSERT INTO informes_validacion (
        id,
        validacion_id,
        codigo_informe,
        resumen_ejecutivo,
        analisis_cobertura,
        analisis_preexistencias,
        motivo_decision,
        accion_sugerida,
        fecha_generacion,
        contenido_json
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
    `,
    [
      report.id,
      report.validationId,
      report.reportCode,
      report.executiveSummary,
      report.coverageAnalysis,
      report.preexistingAnalysis,
      report.decisionReason,
      report.suggestedAction,
      report.generatedAt,
      JSON.stringify(report.contentJson)
    ]
  );
}

async function insertNotification(client, notification) {
  await client.query(
    `
      INSERT INTO notificaciones (
        id,
        validacion_id,
        usuario_destinatario_id,
        tipo,
        canal,
        estado,
        titulo,
        mensaje,
        fecha_generacion,
        fecha_envio,
        fecha_lectura
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `,
    [
      notification.id,
      notification.validationId,
      notification.recipientUserId,
      notification.type,
      notification.channel,
      notification.status,
      notification.title,
      notification.message,
      notification.generatedAt,
      notification.sentAt,
      notification.readAt
    ]
  );
}

async function ensureSchemaExists(client) {
  const queryResult = await client.query("SELECT to_regclass('public.hospitales') AS hospitales");

  if (queryResult.rows[0]?.hospitales) {
    return;
  }

  const schemaSql = fs.readFileSync(SCHEMA_FILE_PATH, 'utf8');
  await client.query(schemaSql);
  console.log(`Esquema aplicado desde ${SCHEMA_FILE_PATH}`);
}

async function seedDatabase() {
  const databaseUrl = getRequiredEnvironmentVariable('DATABASE_URL');
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: getDatabaseSslConfig()
  });

  const client = await pool.connect();

  try {
    const demoPasswordHash = await bcrypt.hash('123456', 10);

    await client.query('BEGIN');
    await ensureSchemaExists(client);
    await client.query(`TRUNCATE TABLE ${TABLES_IN_DELETE_ORDER.join(', ')} RESTART IDENTITY CASCADE`);

    const hospitals = [
      {
        id: DEMO_IDS.hospitals.central,
        code: 'HOSP-CENTRAL',
        name: 'Hospital Central Santo Domingo',
        rnc: '101000001',
        phone: '8095551001',
        email: 'central@hospital.demo',
        address: 'Av. Independencia 100, Santo Domingo',
        active: true
      },
      {
        id: DEMO_IDS.hospitals.north,
        code: 'HOSP-NORTE',
        name: 'Hospital Norte Santiago',
        rnc: '101000002',
        phone: '8095551002',
        email: 'norte@hospital.demo',
        address: 'Av. Las Carreras 45, Santiago',
        active: true
      }
    ];

    const insurers = [
      {
        id: DEMO_IDS.insurers.primera,
        code: 'ASEG-PRIMERA',
        name: 'Primera Salud Seguros',
        phone: '8095552001',
        email: 'contacto@primerasalud.demo',
        address: 'Torre Empresarial, Santo Domingo',
        active: true
      },
      {
        id: DEMO_IDS.insurers.familiar,
        code: 'ASEG-FAMILIAR',
        name: 'Familiar Proteccion Medica',
        phone: '8095552002',
        email: 'servicio@familiar.demo',
        address: 'Av. 27 de Febrero 250, Santo Domingo',
        active: true
      }
    ];

    const users = [
      {
        id: DEMO_IDS.users.registrarCentral,
        role: 'registrador_emergencia',
        hospitalId: DEMO_IDS.hospitals.central,
        insurerId: null,
        username: 'registrador.demo',
        email: 'registrador@hospital.demo',
        passwordHash: demoPasswordHash,
        fullName: 'Laura Martinez',
        status: 'activo'
      },
      {
        id: DEMO_IDS.users.admissionsCentral,
        role: 'receptor_admisiones',
        hospitalId: DEMO_IDS.hospitals.central,
        insurerId: null,
        username: 'admisiones.demo',
        email: 'admisiones@hospital.demo',
        passwordHash: demoPasswordHash,
        fullName: 'Carlos Gomez',
        status: 'activo'
      },
      {
        id: DEMO_IDS.users.insurerReceiver,
        role: 'receptor_aseguradora',
        hospitalId: null,
        insurerId: DEMO_IDS.insurers.primera,
        username: 'aseguradora.demo',
        email: 'analista@primerasalud.demo',
        passwordHash: demoPasswordHash,
        fullName: 'Ana Rodriguez',
        status: 'activo'
      },
      {
        id: DEMO_IDS.users.registrarNorth,
        role: 'registrador_emergencia',
        hospitalId: DEMO_IDS.hospitals.north,
        insurerId: null,
        username: 'registrador.norte',
        email: 'registrador.norte@hospital.demo',
        passwordHash: demoPasswordHash,
        fullName: 'Pedro Castillo',
        status: 'activo'
      },
      {
        id: DEMO_IDS.users.admissionsNorth,
        role: 'receptor_admisiones',
        hospitalId: DEMO_IDS.hospitals.north,
        insurerId: null,
        username: 'admisiones.norte',
        email: 'admisiones.norte@hospital.demo',
        passwordHash: demoPasswordHash,
        fullName: 'Marta Nunez',
        status: 'activo'
      }
    ];

    const patients = [
      {
        id: DEMO_IDS.patients.juan,
        documentType: 'cedula',
        documentNumber: '00112345678',
        firstName: 'Juan',
        lastName: 'Perez',
        birthDate: '1990-05-12',
        gender: 'masculino',
        phone: '8095553001',
        email: 'juan.perez@paciente.demo',
        address: 'Los Rios, Santo Domingo'
      },
      {
        id: DEMO_IDS.patients.maria,
        documentType: 'pasaporte',
        documentNumber: 'A1234567',
        firstName: 'Maria',
        lastName: 'Lopez',
        birthDate: '1985-11-03',
        gender: 'femenino',
        phone: '8095553002',
        email: 'maria.lopez@paciente.demo',
        address: 'Villa Olga, Santiago'
      },
      {
        id: DEMO_IDS.patients.ind_basico,
        documentType: 'cedula',
        documentNumber: '00111111111',
        firstName: 'Carlos',
        lastName: 'Basico',
        birthDate: '1995-01-01',
        gender: 'masculino',
        phone: '8095554001',
        email: 'carlos.basico@paciente.demo',
        address: 'Santo Domingo'
      },
      {
        id: DEMO_IDS.patients.ind_plus,
        documentType: 'cedula',
        documentNumber: '00122222222',
        firstName: 'Ana',
        lastName: 'Plus',
        birthDate: '1992-02-02',
        gender: 'femenino',
        phone: '8095554002',
        email: 'ana.plus@paciente.demo',
        address: 'Santiago'
      },
      {
        id: DEMO_IDS.patients.fam_est,
        documentType: 'cedula',
        documentNumber: '00133333333',
        firstName: 'Luis',
        lastName: 'Familiar',
        birthDate: '1980-03-03',
        gender: 'masculino',
        phone: '8095554003',
        email: 'luis.familiar@paciente.demo',
        address: 'La Vega'
      },
      {
        id: DEMO_IDS.patients.emp_base,
        documentType: 'cedula',
        documentNumber: '00144444444',
        firstName: 'Elena',
        lastName: 'Empresarial',
        birthDate: '1988-04-04',
        gender: 'femenino',
        phone: '8095554004',
        email: 'elena.emp@paciente.demo',
        address: 'San Cristobal'
      },
      {
        id: DEMO_IDS.patients.emp_prem,
        documentType: 'cedula',
        documentNumber: '00155555555',
        firstName: 'Pedro',
        lastName: 'Premium',
        birthDate: '1975-05-05',
        gender: 'masculino',
        phone: '8095554005',
        email: 'pedro.premium@paciente.demo',
        address: 'Punta Cana'
      }
    ];

    const policies = [
      {
        id: DEMO_IDS.policies.juan,
        insurerId: DEMO_IDS.insurers.primera,
        patientId: DEMO_IDS.patients.juan,
        policyNumber: 'POL-0001',
        type: 'individual',
        status: 'vigente',
        planName: 'Plan Premium Emergencias',
        generalConditions: 'Cobertura nacional con deducible preferencial para emergencias.',
        startDate: '2025-01-01',
        endDate: '2026-12-31'
      },
      {
        id: DEMO_IDS.policies.maria,
        insurerId: DEMO_IDS.insurers.familiar,
        patientId: DEMO_IDS.patients.maria,
        policyNumber: 'POL-0002',
        type: 'familiar',
        status: 'suspendida',
        planName: 'Plan Familiar Basico',
        generalConditions: 'Poliza suspendida por mora. Requiere regularizacion antes de usar beneficios.',
        startDate: '2024-01-01',
        endDate: '2026-01-01'
      },
      {
        id: DEMO_IDS.policies.ind_basico,
        insurerId: DEMO_IDS.insurers.primera,
        patientId: DEMO_IDS.patients.ind_basico,
        policyNumber: 'POL-IND-BAS-01',
        type: 'individual',
        status: 'vigente',
        planName: 'Plan Individual Básico',
        generalConditions: 'Cliente individual con cobertura mínima.',
        startDate: '2025-01-01',
        endDate: '2026-12-31'
      },
      {
        id: DEMO_IDS.policies.ind_plus,
        insurerId: DEMO_IDS.insurers.primera,
        patientId: DEMO_IDS.patients.ind_plus,
        policyNumber: 'POL-IND-PLUS-01',
        type: 'individual',
        status: 'vigente',
        planName: 'Plan Individual Plus',
        generalConditions: 'Cliente individual con cobertura media.',
        startDate: '2025-01-01',
        endDate: '2026-12-31'
      },
      {
        id: DEMO_IDS.policies.fam_est,
        insurerId: DEMO_IDS.insurers.familiar,
        patientId: DEMO_IDS.patients.fam_est,
        policyNumber: 'POL-FAM-EST-01',
        type: 'familiar',
        status: 'vigente',
        planName: 'Plan Familiar Estándar',
        generalConditions: 'Paciente que pertenece a una póliza familiar.',
        startDate: '2025-01-01',
        endDate: '2026-12-31'
      },
      {
        id: DEMO_IDS.policies.emp_base,
        insurerId: DEMO_IDS.insurers.primera,
        patientId: DEMO_IDS.patients.emp_base,
        policyNumber: 'POL-EMP-BASE-01',
        type: 'empresarial',
        status: 'vigente',
        planName: 'Plan Empresarial Base',
        generalConditions: 'Empleado afiliado por convenio empresarial.',
        startDate: '2025-01-01',
        endDate: '2026-12-31'
      },
      {
        id: DEMO_IDS.policies.emp_prem,
        insurerId: DEMO_IDS.insurers.primera,
        patientId: DEMO_IDS.patients.emp_prem,
        policyNumber: 'POL-EMP-PREM-01',
        type: 'empresarial',
        status: 'vigente',
        planName: 'Plan Empresarial Premium',
        generalConditions: 'Empleado con convenio empresarial amplio.',
        startDate: '2025-01-01',
        endDate: '2026-12-31'
      }
    ];

    const coverages = [
      {
        policyId: DEMO_IDS.policies.juan,
        coverageType: 'emergencia',
        maximumAmount: 150000,
        coveragePercentage: 90,
        description: 'Cobertura para sala de emergencias y estabilizacion inicial.',
        appliesToEmergency: true
      },
      {
        policyId: DEMO_IDS.policies.juan,
        coverageType: 'internamiento',
        maximumAmount: 500000,
        coveragePercentage: 80,
        description: 'Internamiento por hasta 10 dias por evento.',
        appliesToEmergency: false
      },
      {
        policyId: DEMO_IDS.policies.maria,
        coverageType: 'emergencia',
        maximumAmount: 50000,
        coveragePercentage: 60,
        description: 'Cobertura suspendida hasta regularizar la cuenta.',
        appliesToEmergency: false
      },
      // Plan Individual Básico
      {
        policyId: DEMO_IDS.policies.ind_basico,
        coverageType: 'emergencia',
        maximumAmount: 800.00,
        coveragePercentage: 70,
        description: 'Cobertura de emergencia.',
        appliesToEmergency: true
      },
      {
        policyId: DEMO_IDS.policies.ind_basico,
        coverageType: 'medicamentos',
        maximumAmount: 200.00,
        coveragePercentage: 60,
        description: 'Cobertura de medicamentos.',
        appliesToEmergency: true
      },
      {
        policyId: DEMO_IDS.policies.ind_basico,
        coverageType: 'otros',
        maximumAmount: 150.00,
        coveragePercentage: 50,
        description: 'Otras coberturas.',
        appliesToEmergency: false
      },
      // Plan Individual Plus
      {
        policyId: DEMO_IDS.policies.ind_plus,
        coverageType: 'emergencia',
        maximumAmount: 2000.00,
        coveragePercentage: 85,
        description: 'Cobertura de emergencia.',
        appliesToEmergency: true
      },
      {
        policyId: DEMO_IDS.policies.ind_plus,
        coverageType: 'internamiento',
        maximumAmount: 1500.00,
        coveragePercentage: 80,
        description: 'Cobertura de internamiento.',
        appliesToEmergency: true
      },
      {
        policyId: DEMO_IDS.policies.ind_plus,
        coverageType: 'medicamentos',
        maximumAmount: 500.00,
        coveragePercentage: 75,
        description: 'Cobertura de medicamentos.',
        appliesToEmergency: true
      },
      {
        policyId: DEMO_IDS.policies.ind_plus,
        coverageType: 'cirugia',
        maximumAmount: 2500.00,
        coveragePercentage: 70,
        description: 'Cobertura de cirugia.',
        appliesToEmergency: true
      },
      // Plan Familiar Estándar
      {
        policyId: DEMO_IDS.policies.fam_est,
        coverageType: 'emergencia',
        maximumAmount: 2500.00,
        coveragePercentage: 85,
        description: 'Cobertura de emergencia.',
        appliesToEmergency: true
      },
      {
        policyId: DEMO_IDS.policies.fam_est,
        coverageType: 'internamiento',
        maximumAmount: 2000.00,
        coveragePercentage: 80,
        description: 'Cobertura de internamiento.',
        appliesToEmergency: true
      },
      {
        policyId: DEMO_IDS.policies.fam_est,
        coverageType: 'medicamentos',
        maximumAmount: 600.00,
        coveragePercentage: 75,
        description: 'Cobertura de medicamentos.',
        appliesToEmergency: true
      },
      {
        policyId: DEMO_IDS.policies.fam_est,
        coverageType: 'cirugia',
        maximumAmount: 3000.00,
        coveragePercentage: 75,
        description: 'Cobertura de cirugia.',
        appliesToEmergency: true
      },
      // Plan Empresarial Base
      {
        policyId: DEMO_IDS.policies.emp_base,
        coverageType: 'emergencia',
        maximumAmount: 1800.00,
        coveragePercentage: 80,
        description: 'Cobertura de emergencia.',
        appliesToEmergency: true
      },
      {
        policyId: DEMO_IDS.policies.emp_base,
        coverageType: 'internamiento',
        maximumAmount: 1500.00,
        coveragePercentage: 75,
        description: 'Cobertura de internamiento.',
        appliesToEmergency: true
      },
      {
        policyId: DEMO_IDS.policies.emp_base,
        coverageType: 'medicamentos',
        maximumAmount: 400.00,
        coveragePercentage: 70,
        description: 'Cobertura de medicamentos.',
        appliesToEmergency: true
      },
      // Plan Empresarial Premium
      {
        policyId: DEMO_IDS.policies.emp_prem,
        coverageType: 'emergencia',
        maximumAmount: 5000.00,
        coveragePercentage: 95,
        description: 'Cobertura de emergencia.',
        appliesToEmergency: true
      },
      {
        policyId: DEMO_IDS.policies.emp_prem,
        coverageType: 'internamiento',
        maximumAmount: 4000.00,
        coveragePercentage: 90,
        description: 'Cobertura de internamiento.',
        appliesToEmergency: true
      },
      {
        policyId: DEMO_IDS.policies.emp_prem,
        coverageType: 'medicamentos',
        maximumAmount: 1000.00,
        coveragePercentage: 85,
        description: 'Cobertura de medicamentos.',
        appliesToEmergency: true
      },
      {
        policyId: DEMO_IDS.policies.emp_prem,
        coverageType: 'cirugia',
        maximumAmount: 6000.00,
        coveragePercentage: 85,
        description: 'Cobertura de cirugia.',
        appliesToEmergency: true
      },
      {
        policyId: DEMO_IDS.policies.emp_prem,
        coverageType: 'otros',
        maximumAmount: 1000.00,
        coveragePercentage: 70,
        description: 'Otras coberturas.',
        appliesToEmergency: false
      }
    ];

    const preexistingConditions = [
      {
        patientId: DEMO_IDS.patients.juan,
        icdCode: 'I10',
        conditionName: 'Hipertension arterial',
        description: 'Controlada con tratamiento ambulatorio.',
        diagnosisDate: '2021-08-14',
        active: true
      },
      {
        patientId: DEMO_IDS.patients.maria,
        icdCode: 'J45',
        conditionName: 'Asma bronquial',
        description: 'Sin crisis reportadas en el ultimo ano.',
        diagnosisDate: '2019-03-10',
        active: false
      }
    ];

    const emergencies = [
      {
        id: DEMO_IDS.emergencies.completed,
        patientId: DEMO_IDS.patients.juan,
        hospitalId: DEMO_IDS.hospitals.central,
        policyId: DEMO_IDS.policies.juan,
        registeredByUserId: DEMO_IDS.users.registrarCentral,
        caseCode: 'EM-0001',
        emergencyType: 'cardiaca',
        priorityLevel: 'critica',
        status: 'notificada',
        admissionDate: '2026-05-09T10:30:00.000Z',
        initialDescription: 'Paciente con dolor toracico intenso y mareo.',
        observations: 'Caso usado como referencia de validacion completada.'
      },
      {
        id: DEMO_IDS.emergencies.readyForValidation,
        patientId: DEMO_IDS.patients.juan,
        hospitalId: DEMO_IDS.hospitals.central,
        policyId: DEMO_IDS.policies.juan,
        registeredByUserId: DEMO_IDS.users.registrarCentral,
        caseCode: 'EM-0002',
        emergencyType: 'respiratoria',
        priorityLevel: 'alta',
        status: 'registrada',
        admissionDate: '2026-05-10T08:15:00.000Z',
        initialDescription: 'Paciente con dificultad respiratoria y saturacion baja.',
        observations: 'Caso listo para probar el endpoint de validaciones con el mock agent.'
      },
      {
        id: DEMO_IDS.emergencies.northCase,
        patientId: DEMO_IDS.patients.maria,
        hospitalId: DEMO_IDS.hospitals.north,
        policyId: DEMO_IDS.policies.maria,
        registeredByUserId: DEMO_IDS.users.registrarNorth,
        caseCode: 'EM-0003',
        emergencyType: 'general',
        priorityLevel: 'media',
        status: 'registrada',
        admissionDate: '2026-05-10T09:00:00.000Z',
        initialDescription: 'Paciente con dolor abdominal persistente.',
        observations: 'Caso del hospital norte para probar aislamiento por hospital.'
      }
    ];

    const validations = [
      {
        id: DEMO_IDS.validations.completed,
        emergencyId: DEMO_IDS.emergencies.completed,
        processStatus: 'completada',
        decision: 'aprobado',
        requiresManualReview: false,
        requestDate: '2026-05-09T10:32:00.000Z',
        responseDate: '2026-05-09T10:35:00.000Z',
        engineVersion: 'demo-agent-v1',
        payloadSummary: {
          coverageStatus: 'covered',
          confidence: 'high',
          notes: 'Cobertura de emergencia encontrada y poliza vigente.'
        },
        errorDetails: null
      }
    ];

    const reports = [
      {
        id: DEMO_IDS.reports.completed,
        validationId: DEMO_IDS.validations.completed,
        reportCode: 'INF-0001',
        executiveSummary: 'La poliza esta vigente y la cobertura de emergencia aplica para el evento reportado.',
        coverageAnalysis: 'La poliza POL-0001 incluye cobertura de emergencia por RD$150,000 con 90% de cobertura.',
        preexistingAnalysis: 'Existe hipertension controlada, pero no modifica la decision automatica para este caso.',
        decisionReason: 'Se confirma cobertura activa y sin restricciones bloqueantes para el evento cardiaco.',
        suggestedAction: 'Continuar con admision y seguimiento clinico habitual.',
        generatedAt: '2026-05-09T10:35:00.000Z',
        contentJson: {
          result: 'approved',
          recommendedNextStep: 'admission'
        }
      }
    ];

    const notifications = [
      {
        id: DEMO_IDS.notifications.admissions,
        validationId: DEMO_IDS.validations.completed,
        recipientUserId: DEMO_IDS.users.admissionsCentral,
        type: 'admisiones',
        channel: 'bandeja_interna',
        status: 'enviada',
        title: 'Resultado de validacion EM-0001',
        message: 'La poliza del paciente Juan Perez fue aprobada para el caso EM-0001.',
        generatedAt: '2026-05-09T10:35:00.000Z',
        sentAt: '2026-05-09T10:35:05.000Z',
        readAt: null
      },
      {
        id: DEMO_IDS.notifications.insurer,
        validationId: DEMO_IDS.validations.completed,
        recipientUserId: DEMO_IDS.users.insurerReceiver,
        type: 'aseguradora',
        channel: 'correo',
        status: 'enviada',
        title: 'Caso aprobado EM-0001',
        message: 'Se aprobo la cobertura de emergencia del caso EM-0001 para seguimiento interno.',
        generatedAt: '2026-05-09T10:35:00.000Z',
        sentAt: '2026-05-09T10:35:10.000Z',
        readAt: null
      }
    ];

    for (const hospital of hospitals) {
      await insertHospital(client, hospital);
    }

    for (const insurer of insurers) {
      await insertInsurer(client, insurer);
    }

    for (const user of users) {
      await insertUser(client, user);
    }

    for (const patient of patients) {
      await insertPatient(client, patient);
    }

    for (const policy of policies) {
      await insertPolicy(client, policy);
    }

    for (const condition of preexistingConditions) {
      await insertPreexistingCondition(client, condition);
    }

    for (const coverage of coverages) {
      await insertCoverage(client, coverage);
    }

    for (const emergency of emergencies) {
      await insertEmergency(client, emergency);
    }

    for (const validation of validations) {
      await insertValidation(client, validation);
    }

    for (const report of reports) {
      await insertReport(client, report);
    }

    for (const notification of notifications) {
      await insertNotification(client, notification);
    }

    await client.query('COMMIT');

    console.log('Base de datos demo cargada correctamente.');
    console.log('Usuarios de prueba (password: 123456):');
    console.log('- registrador.demo');
    console.log('- admisiones.demo');
    console.log('- aseguradora.demo');
    console.log('- registrador.norte');
    console.log('- admisiones.norte');
    console.log('IDs utiles para pruebas:');
    console.log(`- Emergency lista para validar: ${DEMO_IDS.emergencies.readyForValidation}`);
    console.log(`- Emergency validada: ${DEMO_IDS.emergencies.completed}`);
    console.log(`- Validation completada: ${DEMO_IDS.validations.completed}`);
    console.log(`- Reporte demo: ${DEMO_IDS.reports.completed}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('No se pudo cargar la data demo.');
    console.error(error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seedDatabase();
