CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Hospital que origina el caso de emergencia.
-- El flujo del reto inicia cuando un hospital registra un caso.
CREATE TABLE hospitales (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo varchar(50) NOT NULL UNIQUE,
    nombre varchar(150) NOT NULL,
    rnc varchar(30) UNIQUE,
    telefono varchar(30),
    email varchar(255),
    direccion text,
    activo boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Aseguradora responsable de la poliza evaluada.
-- Debe existir porque la validacion se hace contra una poliza emitida
-- por una entidad aseguradora concreta.
CREATE TABLE aseguradoras (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo varchar(50) NOT NULL UNIQUE,
    nombre varchar(150) NOT NULL,
    telefono varchar(30),
    email varchar(255),
    direccion text,
    activo boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Usuarios operativos del sistema.
-- Aqui solo viven los tres actores del reto: quien registra la emergencia,
-- quien recibe la notificacion en admisiones y quien la recibe en aseguradora.
-- No representa pacientes.
CREATE TABLE usuarios (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Define el rol operativo del usuario dentro del flujo.
    rol varchar(30) NOT NULL,
    -- Se usa para usuarios del lado hospitalario.
    hospital_id uuid REFERENCES hospitales(id) ON DELETE RESTRICT,
    -- Se usa para usuarios del lado aseguradora.
    aseguradora_id uuid REFERENCES aseguradoras(id) ON DELETE RESTRICT,
    username varchar(50) NOT NULL UNIQUE,
    email varchar(255) NOT NULL UNIQUE,
    password_hash text NOT NULL,
    nombre_completo varchar(200) NOT NULL,
    estado varchar(20) NOT NULL DEFAULT 'activo',
    ultimo_acceso_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_usuario_rol CHECK (rol IN ('registrador_emergencia', 'receptor_admisiones', 'receptor_aseguradora')),
    CONSTRAINT chk_usuario_estado CHECK (estado IN ('activo', 'inactivo', 'bloqueado')),
    CONSTRAINT chk_usuario_entidad_exclusiva CHECK (
        NOT (hospital_id IS NOT NULL AND aseguradora_id IS NOT NULL)
    ),
    CONSTRAINT chk_usuario_relacion_por_rol CHECK (
        (rol IN ('registrador_emergencia', 'receptor_admisiones') AND hospital_id IS NOT NULL AND aseguradora_id IS NULL)
        OR (rol = 'receptor_aseguradora' AND aseguradora_id IS NOT NULL AND hospital_id IS NULL)
    )
);

-- Persona atendida clinicamente.
-- Esta tabla se separa de usuarios porque el paciente no usa el sistema;
-- es la persona sobre la que se analiza la cobertura.
CREATE TABLE pacientes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_documento varchar(30) NOT NULL,
    numero_documento varchar(50) NOT NULL,
    nombres varchar(120) NOT NULL,
    apellidos varchar(120) NOT NULL,
    fecha_nacimiento date NOT NULL,
    sexo varchar(20),
    telefono varchar(30),
    email varchar(255),
    direccion text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_paciente_documento UNIQUE (tipo_documento, numero_documento),
    CONSTRAINT chk_paciente_fecha_nacimiento CHECK (fecha_nacimiento <= current_date)
);

-- Poliza medica asociada al paciente.
-- Existe porque el agente debe validar vigencia, tipo de plan y condiciones
-- antes de emitir una decision sobre la emergencia.
CREATE TABLE polizas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Cada poliza pertenece a una aseguradora concreta.
    aseguradora_id uuid NOT NULL REFERENCES aseguradoras(id) ON DELETE RESTRICT,
    -- La poliza evaluada debe corresponder al paciente atendido.
    paciente_id uuid NOT NULL REFERENCES pacientes(id) ON DELETE RESTRICT,
    numero_poliza varchar(100) NOT NULL,
    tipo varchar(20) NOT NULL,
    estado varchar(20) NOT NULL,
    plan_nombre varchar(150),
    condiciones_generales text,
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_poliza_aseguradora_numero UNIQUE (aseguradora_id, numero_poliza),
    CONSTRAINT chk_poliza_tipo CHECK (tipo IN ('individual', 'familiar', 'empresarial')),
    CONSTRAINT chk_poliza_estado CHECK (estado IN ('vigente', 'vencida', 'suspendida', 'cancelada')),
    CONSTRAINT chk_poliza_fechas CHECK (fecha_fin >= fecha_inicio)
);

-- Detalle de coberturas de una poliza.
-- Se mantiene en una tabla aparte para permitir varias coberturas por poliza
-- sin duplicar informacion del contrato principal.
CREATE TABLE coberturas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Una poliza puede tener multiples coberturas.
    poliza_id uuid NOT NULL REFERENCES polizas(id) ON DELETE CASCADE,
    tipo_cobertura varchar(30) NOT NULL,
    monto_maximo numeric(14,2),
    porcentaje_cobertura numeric(5,2),
    descripcion text,
    aplica_emergencia boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_cobertura_tipo CHECK (tipo_cobertura IN ('emergencia', 'internamiento', 'cirugia', 'medicamentos', 'otros')),
    CONSTRAINT chk_cobertura_porcentaje CHECK (
        porcentaje_cobertura IS NULL OR (porcentaje_cobertura >= 0 AND porcentaje_cobertura <= 100)
    ),
    CONSTRAINT chk_cobertura_monto CHECK (monto_maximo IS NULL OR monto_maximo >= 0)
);

-- Condiciones previas del paciente.
-- Son insumo del agente porque pueden influir en la cobertura o motivar
-- una revision manual.
CREATE TABLE preexistencias (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Las preexistencias pertenecen al paciente, no a la poliza.
    paciente_id uuid NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    codigo_cie varchar(20),
    nombre_condicion varchar(150) NOT NULL,
    descripcion text,
    fecha_diagnostico date,
    activa boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_preexistencia_fecha CHECK (
        fecha_diagnostico IS NULL OR fecha_diagnostico <= current_date
    )
);

-- Tabla central del reto.
-- Registra la emergencia reportada por el hospital y conecta paciente,
-- poliza y usuario registrador para disparar el proceso de validacion.
CREATE TABLE emergencias (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Indica sobre que paciente recae la emergencia.
    paciente_id uuid NOT NULL REFERENCES pacientes(id) ON DELETE RESTRICT,
    -- Identifica el hospital que reporta el caso.
    hospital_id uuid NOT NULL REFERENCES hospitales(id) ON DELETE RESTRICT,
    -- Poliza que el agente debe evaluar para este caso.
    poliza_id uuid NOT NULL REFERENCES polizas(id) ON DELETE RESTRICT,
    -- Usuario operativo que registra la emergencia.
    usuario_registro_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    codigo_caso varchar(50) NOT NULL UNIQUE,
    tipo_emergencia varchar(30) NOT NULL,
    prioridad varchar(20) NOT NULL,
    estado varchar(20) NOT NULL DEFAULT 'registrada',
    fecha_ingreso timestamptz NOT NULL,
    descripcion_inicial text,
    observaciones text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_emergencia_tipo CHECK (tipo_emergencia IN ('trauma', 'cardiaca', 'respiratoria', 'neurologica', 'general')),
    CONSTRAINT chk_emergencia_prioridad CHECK (prioridad IN ('alta', 'media', 'critica')),
    CONSTRAINT chk_emergencia_estado CHECK (estado IN ('registrada', 'en_validacion', 'validada', 'notificada', 'cerrada'))
);

-- Ejecucion del agente sobre una emergencia.
-- Se relaciona con emergencias porque el agente siempre analiza un caso
-- concreto y no una poliza en abstracto.
CREATE TABLE validaciones (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Toda validacion nace de una emergencia registrada.
    emergencia_id uuid NOT NULL REFERENCES emergencias(id) ON DELETE CASCADE,
    estado_proceso varchar(20) NOT NULL DEFAULT 'pendiente',
    decision varchar(20),
    requiere_revision_manual boolean NOT NULL DEFAULT false,
    fecha_solicitud timestamptz NOT NULL DEFAULT now(),
    fecha_respuesta timestamptz,
    motor_version varchar(100),
    payload_resumen jsonb,
    error_detalle text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_validacion_estado CHECK (estado_proceso IN ('pendiente', 'procesando', 'completada', 'fallida')),
    CONSTRAINT chk_validacion_decision CHECK (
        decision IS NULL OR decision IN ('aprobado', 'rechazado', 'revision_manual')
    ),
    CONSTRAINT chk_validacion_fechas CHECK (
        fecha_respuesta IS NULL OR fecha_respuesta >= fecha_solicitud
    )
);

-- Informe formal generado por el agente.
-- Se separa de validaciones para distinguir el proceso tecnico del
-- documento final consultado por hospital y aseguradora.
CREATE TABLE informes_validacion (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Relacion uno a uno con la validacion ejecutada.
    validacion_id uuid NOT NULL UNIQUE REFERENCES validaciones(id) ON DELETE CASCADE,
    codigo_informe varchar(50) NOT NULL UNIQUE,
    resumen_ejecutivo text NOT NULL,
    analisis_cobertura text,
    analisis_preexistencias text,
    motivo_decision text NOT NULL,
    accion_sugerida text,
    fecha_generacion timestamptz NOT NULL DEFAULT now(),
    contenido_json jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Notificaciones generadas a partir del resultado de la validacion.
-- Se relacionan con validaciones para evitar redundancia con emergencias
-- y para enviar el resultado a receptores concretos del reto.
CREATE TABLE notificaciones (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    -- La notificacion siempre nace de una validacion.
    validacion_id uuid NOT NULL REFERENCES validaciones(id) ON DELETE CASCADE,
    -- Usuario especifico que recibe la notificacion.
    usuario_destinatario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    -- Distingue si la notificacion se dirige a admisiones o aseguradora.
    tipo varchar(20) NOT NULL,
    canal varchar(20) NOT NULL DEFAULT 'bandeja_interna',
    estado varchar(20) NOT NULL DEFAULT 'pendiente',
    titulo varchar(200) NOT NULL,
    mensaje text NOT NULL,
    fecha_generacion timestamptz NOT NULL DEFAULT now(),
    fecha_envio timestamptz,
    fecha_lectura timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_notificacion_tipo CHECK (tipo IN ('admisiones', 'aseguradora')),
    CONSTRAINT chk_notificacion_canal CHECK (canal IN ('bandeja_interna', 'correo', 'webhook')),
    CONSTRAINT chk_notificacion_estado CHECK (estado IN ('pendiente', 'enviada', 'leida', 'fallida')),
    CONSTRAINT chk_notificacion_fechas_envio CHECK (
        fecha_envio IS NULL OR fecha_envio >= fecha_generacion
    ),
    CONSTRAINT chk_notificacion_fechas_lectura CHECK (
        fecha_lectura IS NULL OR fecha_envio IS NULL OR fecha_lectura >= fecha_envio
    )
);

CREATE INDEX idx_usuarios_rol ON usuarios (rol);
CREATE INDEX idx_usuarios_hospital ON usuarios (hospital_id);
CREATE INDEX idx_usuarios_aseguradora ON usuarios (aseguradora_id);
CREATE INDEX idx_pacientes_documento ON pacientes (tipo_documento, numero_documento);
CREATE INDEX idx_polizas_paciente ON polizas (paciente_id);
CREATE INDEX idx_polizas_aseguradora ON polizas (aseguradora_id);
CREATE INDEX idx_coberturas_poliza ON coberturas (poliza_id);
CREATE INDEX idx_preexistencias_paciente ON preexistencias (paciente_id);
CREATE INDEX idx_emergencias_paciente ON emergencias (paciente_id);
CREATE INDEX idx_emergencias_hospital ON emergencias (hospital_id);
CREATE INDEX idx_emergencias_poliza ON emergencias (poliza_id);
CREATE INDEX idx_emergencias_usuario_registro ON emergencias (usuario_registro_id);
CREATE INDEX idx_emergencias_estado ON emergencias (estado);
CREATE INDEX idx_emergencias_fecha_ingreso ON emergencias (fecha_ingreso);
CREATE INDEX idx_validaciones_emergencia ON validaciones (emergencia_id);
CREATE INDEX idx_validaciones_estado ON validaciones (estado_proceso);
CREATE INDEX idx_validaciones_decision ON validaciones (decision);
CREATE INDEX idx_notificaciones_validacion ON notificaciones (validacion_id);
CREATE INDEX idx_notificaciones_destinatario ON notificaciones (usuario_destinatario_id);
CREATE INDEX idx_notificaciones_estado ON notificaciones (estado);

CREATE TRIGGER trg_hospitales_updated_at
BEFORE UPDATE ON hospitales
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_aseguradoras_updated_at
BEFORE UPDATE ON aseguradoras
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_usuarios_updated_at
BEFORE UPDATE ON usuarios
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_pacientes_updated_at
BEFORE UPDATE ON pacientes
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_polizas_updated_at
BEFORE UPDATE ON polizas
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_coberturas_updated_at
BEFORE UPDATE ON coberturas
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_preexistencias_updated_at
BEFORE UPDATE ON preexistencias
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_emergencias_updated_at
BEFORE UPDATE ON emergencias
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_validaciones_updated_at
BEFORE UPDATE ON validaciones
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_informes_validacion_updated_at
BEFORE UPDATE ON informes_validacion
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_notificaciones_updated_at
BEFORE UPDATE ON notificaciones
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
