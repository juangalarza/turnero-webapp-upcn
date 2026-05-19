-- ============================================================
-- Módulo de Clases - Tablas adicionales
-- ============================================================

-- Configuraciones globales (Fila única)
CREATE TABLE IF NOT EXISTS configuraciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lista_espera_limite INT DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insertar fila inicial si no existe
INSERT INTO configuraciones (lista_espera_limite)
SELECT 10
WHERE NOT EXISTS (SELECT 1 FROM configuraciones);

-- Clases
CREATE TABLE IF NOT EXISTS clases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profesional_id UUID REFERENCES profesionales(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  dia_semana TEXT NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  cupo_maximo INT NOT NULL DEFAULT 10,
  lista_espera_limite INT, -- Nullable, si es nulo usa el de configuraciones
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Inscripciones
CREATE TABLE IF NOT EXISTS inscripciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clase_id UUID REFERENCES clases(id) ON DELETE CASCADE,
  perfil_id UUID REFERENCES afiliados(id) ON DELETE CASCADE,
  estado TEXT NOT NULL CHECK (estado IN ('activa', 'lista_espera', 'baja')),
  posicion_espera INT,
  fecha_inscripcion TIMESTAMPTZ DEFAULT now(),
  fecha_baja TIMESTAMPTZ,
  notas_admin TEXT
);

-- Asistencia
CREATE TABLE IF NOT EXISTS asistencia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inscripcion_id UUID REFERENCES inscripciones(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  presente BOOLEAN DEFAULT false,
  justificada BOOLEAN DEFAULT false,
  nota TEXT,
  registrado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(inscripcion_id, fecha)
);

-- ============================================================
-- Trigger para validación automática de cupo (trg_validar_inscripcion)
-- ============================================================

CREATE OR REPLACE FUNCTION trg_validar_inscripcion_fn()
RETURNS trigger AS $$
DECLARE
  v_cupo_maximo INT;
  v_limite_espera INT;
  v_limite_global INT;
  v_count_activos INT;
  v_count_espera INT;
BEGIN
  -- Obtener info de la clase
  SELECT cupo_maximo, lista_espera_limite INTO v_cupo_maximo, v_limite_espera
  FROM clases WHERE id = NEW.clase_id;

  -- Si no tiene limite de espera propio, buscar el global
  IF v_limite_espera IS NULL THEN
    SELECT lista_espera_limite INTO v_limite_global FROM configuraciones LIMIT 1;
    v_limite_espera := COALESCE(v_limite_global, 10);
  END IF;

  -- Contar inscriptos activos actuales
  SELECT COUNT(*) INTO v_count_activos 
  FROM inscripciones 
  WHERE clase_id = NEW.clase_id AND estado = 'activa';

  -- Contar en lista de espera actuales
  SELECT COUNT(*) INTO v_count_espera 
  FROM inscripciones 
  WHERE clase_id = NEW.clase_id AND estado = 'lista_espera';

  -- Lógica de asignación de estado
  IF NEW.estado IS NULL OR NEW.estado != 'baja' THEN
    IF v_count_activos < v_cupo_maximo THEN
      NEW.estado := 'activa';
      NEW.posicion_espera := NULL;
    ELSIF v_count_espera < v_limite_espera THEN
      NEW.estado := 'lista_espera';
      NEW.posicion_espera := v_count_espera + 1;
    ELSE
      RAISE EXCEPTION 'El cupo y la lista de espera de esta clase están llenos.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validar_inscripcion ON inscripciones;
CREATE TRIGGER trg_validar_inscripcion
  BEFORE INSERT ON inscripciones
  FOR EACH ROW
  EXECUTE FUNCTION trg_validar_inscripcion_fn();

-- Recargar cache de PostgREST
NOTIFY pgrst, 'reload schema';
