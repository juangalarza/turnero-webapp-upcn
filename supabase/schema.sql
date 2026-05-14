-- ============================================================
-- UPCN Sistema de Turnos — Schema SQL completo
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ============================================================
-- TABLAS
-- ============================================================

-- Sedes (multi-sede listo desde el schema, una sola activa por ahora)
CREATE TABLE IF NOT EXISTS sedes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     TEXT NOT NULL,
  direccion  TEXT,
  activa     BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Especialidades médicas
CREATE TABLE IF NOT EXISTS especialidades (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre  TEXT NOT NULL UNIQUE,
  color   TEXT DEFAULT '#3B82F6',
  activa  BOOLEAN DEFAULT true
);

-- Profesionales
CREATE TABLE IF NOT EXISTS profesionales (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre           TEXT NOT NULL,
  apellido         TEXT NOT NULL,
  matricula        TEXT,
  especialidad_id  UUID REFERENCES especialidades(id),
  sede_id          UUID REFERENCES sedes(id),
  telefono         TEXT,
  activo           BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- Horarios de atención (plantilla semanal por profesional)
CREATE TABLE IF NOT EXISTS horarios_atencion (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profesional_id          UUID REFERENCES profesionales(id) ON DELETE CASCADE,
  dia_semana              SMALLINT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0=domingo
  hora_inicio             TIME NOT NULL,
  hora_fin                TIME NOT NULL,
  duracion_turno_minutos  SMALLINT DEFAULT 20,
  activo                  BOOLEAN DEFAULT true
);

-- Bloqueos de agenda (licencias, feriados, ausencias)
CREATE TABLE IF NOT EXISTS bloqueos_agenda (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profesional_id  UUID REFERENCES profesionales(id) ON DELETE CASCADE,
  fecha_inicio    DATE NOT NULL,
  fecha_fin       DATE NOT NULL,
  motivo          TEXT,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Afiliados (gestionados por el staff)
CREATE TABLE IF NOT EXISTS afiliados (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_afiliado           TEXT UNIQUE,
  dni                       TEXT NOT NULL UNIQUE,
  nombre                    TEXT NOT NULL,
  apellido                  TEXT NOT NULL,
  fecha_nacimiento          DATE,
  telefono                  TEXT,        -- celular para WhatsApp vía Make
  email                     TEXT,
  grupo_familiar_titular_id UUID REFERENCES afiliados(id),
  observaciones             TEXT,
  created_at                TIMESTAMPTZ DEFAULT now(),
  updated_at                TIMESTAMPTZ DEFAULT now()
);

-- Turnos
CREATE TABLE IF NOT EXISTS turnos (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  afiliado_id          UUID REFERENCES afiliados(id),
  profesional_id       UUID REFERENCES profesionales(id),
  sede_id              UUID REFERENCES sedes(id),
  fecha                DATE NOT NULL,
  hora                 TIME NOT NULL,
  estado               TEXT DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'confirmado', 'cancelado', 'ausente', 'atendido')),
  motivo_consulta      TEXT,
  notas_internas       TEXT,
  recordatorio_enviado BOOLEAN DEFAULT false,
  created_by           UUID REFERENCES auth.users(id),
  updated_by           UUID REFERENCES auth.users(id),
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now(),
  cancelled_at         TIMESTAMPTZ,
  cancel_reason        TEXT
);

-- Perfiles extendidos del staff (complementa auth.users de Supabase)
CREATE TABLE IF NOT EXISTS staff_profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id),
  nombre          TEXT NOT NULL,
  apellido        TEXT NOT NULL,
  rol             TEXT NOT NULL CHECK (rol IN ('admin', 'recepcion', 'profesional')),
  profesional_id  UUID REFERENCES profesionales(id),  -- si rol = 'profesional'
  sede_id         UUID REFERENCES sedes(id),
  activo          BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_turnos_fecha             ON turnos(fecha);
CREATE INDEX IF NOT EXISTS idx_turnos_profesional_fecha ON turnos(profesional_id, fecha);
CREATE INDEX IF NOT EXISTS idx_turnos_estado            ON turnos(estado);
CREATE INDEX IF NOT EXISTS idx_turnos_recordatorio      ON turnos(fecha, recordatorio_enviado) WHERE estado != 'cancelado';
CREATE INDEX IF NOT EXISTS idx_afiliados_dni            ON afiliados(dni);
CREATE INDEX IF NOT EXISTS idx_afiliados_numero         ON afiliados(numero_afiliado);
CREATE INDEX IF NOT EXISTS idx_bloqueos_profesional     ON bloqueos_agenda(profesional_id, fecha_inicio, fecha_fin);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Turnos: solo staff autenticado
ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff autenticado gestiona turnos" ON turnos
  FOR ALL USING (auth.role() = 'authenticated');

-- Afiliados: solo staff autenticado
ALTER TABLE afiliados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff gestiona afiliados" ON afiliados
  FOR ALL USING (auth.role() = 'authenticated');

-- Staff profiles: cada usuario ve el propio; admin ve todos
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff ve su propio perfil" ON staff_profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admin gestiona todos los perfiles" ON staff_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM staff_profiles sp
      WHERE sp.id = auth.uid() AND sp.rol = 'admin'
    )
  );

-- Tablas de soporte: solo staff autenticado (lectura/escritura)
ALTER TABLE sedes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff autenticado gestiona sedes" ON sedes
  FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE especialidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff autenticado gestiona especialidades" ON especialidades
  FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE profesionales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff autenticado gestiona profesionales" ON profesionales
  FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE horarios_atencion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff autenticado gestiona horarios" ON horarios_atencion
  FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE bloqueos_agenda ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff autenticado gestiona bloqueos" ON bloqueos_agenda
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- FUNCIÓN: actualizar updated_at automáticamente
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_turnos_updated_at
  BEFORE UPDATE ON turnos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_afiliados_updated_at
  BEFORE UPDATE ON afiliados
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SEED: datos iniciales
-- ============================================================

-- Sede principal UPCN San Juan
INSERT INTO sedes (nombre, direccion, activa)
VALUES ('UPCN San Juan', 'San Juan, Argentina', true)
ON CONFLICT DO NOTHING;

-- Especialidades base
INSERT INTO especialidades (nombre, color) VALUES
  ('Clinica Medica',        '#3B82F6'),
  ('Cardiologia',           '#EF4444'),
  ('Odontologia',           '#10B981'),
  ('Traumatologia',         '#F59E0B'),
  ('Ginecologia',           '#EC4899'),
  ('Pediatria',             '#8B5CF6'),
  ('Oftalmologia',          '#06B6D4'),
  ('Dermatologia',          '#F97316'),
  ('Psicologia',            '#6366F1'),
  ('Kinesiologia',          '#14B8A6')
ON CONFLICT (nombre) DO NOTHING;
