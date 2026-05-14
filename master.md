# master.md — Sistema de Turnos UPCN
> Documento de referencia técnica y arquitectura del proyecto. Usar como contexto en cada sesión de desarrollo.

---

## 1. Visión del Producto

Sistema web interno de gestión de turnos médicos para UPCN San Juan. El personal de recepción carga y gestiona todos los turnos. Los profesionales ven su agenda. Make automatiza los recordatorios por WhatsApp a los afiliados 24h antes del turno.

**No hay portal público.** Los afiliados llaman o se presentan, el staff gestiona todo desde el panel interno.

**Usuarios del sistema:**
- **Recepción** — crea, edita y cancela turnos; busca afiliados; ve la agenda del día
- **Profesional médico** — vista de solo lectura de su propia agenda
- **Admin** — configuración general, gestión de usuarios internos, reportes, gestión de profesionales y horarios

---

## 2. Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14+ (App Router) |
| Estilos | Tailwind CSS + shadcn/ui |
| Iconos | Lucide React |
| Base de datos | Supabase (PostgreSQL) |
| Autenticación | Supabase Auth (todo el staff) |
| Email transaccional | Resend + React Email |
| Automatizaciones | Make (recordatorios WhatsApp) |
| Deploy | Vercel |

---

## 3. Arquitectura de Directorios

```
upcn-turnos/
├── app/
│   ├── login/page.tsx               # Login staff
│   ├── (staff)/                     # Todas las rutas protegidas
│   │   ├── layout.tsx               # Verifica sesión activa
│   │   ├── dashboard/page.tsx       # Resumen del día: turnos, ocupación, ausencias
│   │   ├── turnos/
│   │   │   ├── page.tsx             # Lista de turnos con filtros
│   │   │   ├── nuevo/page.tsx       # Formulario nuevo turno
│   │   │   └── [id]/page.tsx        # Detalle y edición de turno
│   │   ├── agenda/page.tsx          # Vista de agenda (grilla por hora/profesional)
│   │   ├── afiliados/
│   │   │   ├── page.tsx             # Listado + búsqueda
│   │   │   └── [id]/page.tsx        # Historial de turnos del afiliado
│   │   ├── profesionales/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── reportes/page.tsx        # Ocupación, demanda, ausencias
│   │   └── configuracion/page.tsx   # Especialidades, horarios, usuarios staff
│   ├── api/
│   │   ├── turnos/
│   │   │   ├── route.ts             # GET lista / POST crear
│   │   │   └── [id]/route.ts        # GET / PATCH / DELETE
│   │   ├── disponibilidad/
│   │   │   └── route.ts             # GET slots libres por profesional+fecha
│   │   └── webhooks/
│   │       └── make/route.ts        # Recibe confirmaciones de Make (opcional)
│   └── layout.tsx
├── components/
│   ├── ui/                          # shadcn/ui (auto-generado)
│   ├── turnos/
│   │   ├── FormNuevoTurno.tsx       # Busca afiliado → profesional → slot
│   │   ├── CalendarioDisponibilidad.tsx
│   │   ├── TarjetaTurno.tsx
│   │   └── BadgeEstado.tsx          # pendiente | confirmado | cancelado | atendido | ausente
│   ├── agenda/
│   │   ├── GrillaAgenda.tsx         # Vista tipo calendario por hora
│   │   └── SelectorFechaAgenda.tsx
│   ├── afiliados/
│   │   └── BuscadorAfiliado.tsx     # Búsqueda por nombre, DNI, nro afiliado
│   └── layout/
│       ├── Sidebar.tsx
│       ├── Header.tsx
│       └── RolGuard.tsx             # Oculta/muestra secciones por rol
├── lib/
│   ├── supabase/
│   │   ├── client.ts                # Browser client
│   │   ├── server.ts                # Server client (cookies)
│   │   └── admin.ts                 # Admin client (service role, para API Routes)
│   ├── resend/
│   │   └── emails.ts
│   ├── make/
│   │   └── triggers.ts              # Dispara webhooks a Make
│   ├── disponibilidad.ts            # Lógica de slots libres
│   └── utils.ts
├── emails/
│   └── RecordatorioInternoStaff.tsx
├── middleware.ts                    # Redirige a /login si no hay sesión
└── types/
    └── database.ts                  # Tipos generados por Supabase CLI
```

---

## 4. Base de Datos (Supabase / PostgreSQL)

### 4.1 Tablas

```sql
-- Sedes (multi-sede listo desde el schema, una sola activa por ahora)
CREATE TABLE sedes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     TEXT NOT NULL,
  direccion  TEXT,
  activa     BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Especialidades médicas
CREATE TABLE especialidades (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre  TEXT NOT NULL UNIQUE,
  color   TEXT DEFAULT '#3B82F6',
  activa  BOOLEAN DEFAULT true
);

-- Profesionales
CREATE TABLE profesionales (
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
CREATE TABLE horarios_atencion (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profesional_id          UUID REFERENCES profesionales(id) ON DELETE CASCADE,
  dia_semana              SMALLINT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0=domingo
  hora_inicio             TIME NOT NULL,
  hora_fin                TIME NOT NULL,
  duracion_turno_minutos  SMALLINT DEFAULT 20,
  activo                  BOOLEAN DEFAULT true
);

-- Bloqueos de agenda (licencias, feriados, ausencias)
CREATE TABLE bloqueos_agenda (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profesional_id  UUID REFERENCES profesionales(id) ON DELETE CASCADE,
  fecha_inicio    DATE NOT NULL,
  fecha_fin       DATE NOT NULL,
  motivo          TEXT,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Afiliados (gestionados por el staff)
CREATE TABLE afiliados (
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
CREATE TABLE turnos (
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
CREATE TABLE staff_profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id),
  nombre          TEXT NOT NULL,
  apellido        TEXT NOT NULL,
  rol             TEXT NOT NULL CHECK (rol IN ('admin', 'recepcion', 'profesional')),
  profesional_id  UUID REFERENCES profesionales(id),  -- si rol = 'profesional'
  sede_id         UUID REFERENCES sedes(id),
  activo          BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

### 4.2 Índices clave

```sql
CREATE INDEX idx_turnos_fecha             ON turnos(fecha);
CREATE INDEX idx_turnos_profesional_fecha ON turnos(profesional_id, fecha);
CREATE INDEX idx_turnos_estado            ON turnos(estado);
CREATE INDEX idx_turnos_recordatorio      ON turnos(fecha, recordatorio_enviado) WHERE estado != 'cancelado';
CREATE INDEX idx_afiliados_dni            ON afiliados(dni);
CREATE INDEX idx_afiliados_numero         ON afiliados(numero_afiliado);
CREATE INDEX idx_bloqueos_profesional     ON bloqueos_agenda(profesional_id, fecha_inicio, fecha_fin);
```

### 4.3 Row Level Security (RLS)

```sql
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
```

---

## 5. Autenticación (Supabase Auth)

Todo el sistema requiere login. No hay acceso público.

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => req.cookies.get(name)?.value } }
  )
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  return res
}

export const config = {
  matcher: ['/((?!login|_next|favicon.ico).*)']
}
```

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  )
}
```

```typescript
// lib/auth.ts — obtener perfil y rol del usuario actual
export async function getStaffProfile() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('staff_profiles')
    .select('*, profesionales(*), sedes(*)')
    .eq('id', user.id)
    .single()

  return data
}
```

---

## 6. Integración con Make

### Flujo principal: recordatorio WhatsApp 24h antes

```
Cron en Make (todos los días a las 8:00am)
  → GET /api/turnos?fecha=[mañana]&recordatorio_enviado=false&estado=pendiente
      (con header x-make-secret)
  → Por cada turno con teléfono de afiliado:
      → Envía WhatsApp vía módulo WhatsApp Business en Make
      → PATCH /api/turnos/[id]  →  { recordatorio_enviado: true }
```

### API Route para Make (GET turnos)

```typescript
// app/api/turnos/route.ts
export async function GET(req: Request) {
  // Autenticar llamada de Make
  const secret = req.headers.get('x-make-secret')
  if (secret !== process.env.MAKE_WEBHOOK_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const supabase = createAdminClient()

  let query = supabase
    .from('turnos')
    .select(`
      id, fecha, hora, estado, recordatorio_enviado, motivo_consulta,
      afiliados ( nombre, apellido, telefono ),
      profesionales ( nombre, apellido, especialidades ( nombre ) )
    `)

  const fecha = searchParams.get('fecha')
  const recordatorio = searchParams.get('recordatorio_enviado')
  const estado = searchParams.get('estado')

  if (fecha) query = query.eq('fecha', fecha)
  if (recordatorio !== null) query = query.eq('recordatorio_enviado', recordatorio === 'true')
  if (estado) query = query.eq('estado', estado)

  const { data, error } = await query
  if (error) return Response.json({ error }, { status: 500 })

  return Response.json(data)
}
```

### Webhook opcional: notificación al crear turno

```typescript
// lib/make/triggers.ts
export async function notificarNuevoTurno(turno: TurnoCompleto) {
  if (!process.env.MAKE_WEBHOOK_NUEVO_TURNO) return

  await fetch(process.env.MAKE_WEBHOOK_NUEVO_TURNO, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      afiliado_nombre:   `${turno.afiliados.nombre} ${turno.afiliados.apellido}`,
      afiliado_telefono: turno.afiliados.telefono,
      profesional:       `${turno.profesionales.nombre} ${turno.profesionales.apellido}`,
      especialidad:      turno.profesionales.especialidades?.nombre,
      fecha:             turno.fecha,
      hora:              turno.hora,
      motivo:            turno.motivo_consulta ?? ''
    })
  })
}
```

### Scenarios de Make

| Scenario | Trigger | Qué hace |
|----------|---------|---------|
| Recordatorio 24h | Cron diario 8am | GET turnos de mañana → WhatsApp por cada uno con teléfono |
| Confirmación inmediata (opcional) | Webhook desde API al crear turno | WhatsApp de confirmación al afiliado |
| Cancelación (opcional) | Webhook desde API al cancelar | WhatsApp de aviso al afiliado |

---

## 7. Lógica de Disponibilidad de Slots

```typescript
// lib/disponibilidad.ts
import { createClient } from '@/lib/supabase/server'

export async function getSlotsDisponibles(
  profesionalId: string,
  fecha: string  // 'YYYY-MM-DD'
): Promise<string[]> {
  const supabase = createClient()
  const diaSemana = new Date(fecha + 'T12:00:00').getDay()  // T12 evita desfase por zona horaria

  // 1. Horario del profesional para ese día de la semana
  const { data: horario } = await supabase
    .from('horarios_atencion')
    .select('hora_inicio, hora_fin, duracion_turno_minutos')
    .eq('profesional_id', profesionalId)
    .eq('dia_semana', diaSemana)
    .eq('activo', true)
    .single()

  if (!horario) return []

  // 2. Verificar si hay bloqueo en esa fecha
  const { data: bloqueo } = await supabase
    .from('bloqueos_agenda')
    .select('id')
    .eq('profesional_id', profesionalId)
    .lte('fecha_inicio', fecha)
    .gte('fecha_fin', fecha)
    .maybeSingle()

  if (bloqueo) return []

  // 3. Turnos ya asignados ese día
  const { data: ocupados } = await supabase
    .from('turnos')
    .select('hora')
    .eq('profesional_id', profesionalId)
    .eq('fecha', fecha)
    .neq('estado', 'cancelado')

  const horasOcupadas = new Set(ocupados?.map(t => t.hora.slice(0, 5)) ?? [])

  // 4. Generar slots
  const slots: string[] = []
  const [hI, mI] = horario.hora_inicio.split(':').map(Number)
  const [hF, mF] = horario.hora_fin.split(':').map(Number)
  let minutos = hI * 60 + mI
  const finMinutos = hF * 60 + mF

  while (minutos < finMinutos) {
    const h = String(Math.floor(minutos / 60)).padStart(2, '0')
    const m = String(minutos % 60).padStart(2, '0')
    const slot = `${h}:${m}`
    if (!horasOcupadas.has(slot)) slots.push(slot)
    minutos += horario.duracion_turno_minutos
  }

  return slots
}
```

---

## 8. Roles y Permisos

| Acción | Admin | Recepción | Profesional |
|--------|-------|-----------|-------------|
| Ver todos los turnos | ✅ | ✅ | Solo propios |
| Crear turno | ✅ | ✅ | ❌ |
| Editar turno | ✅ | ✅ | ❌ |
| Cancelar turno | ✅ | ✅ | ❌ |
| Marcar atendido / ausente | ✅ | ✅ | ✅ (propios) |
| Ver agenda completa | ✅ | ✅ | Solo propia |
| Gestionar afiliados (ABM) | ✅ | ✅ | ❌ |
| Gestionar profesionales | ✅ | ❌ | ❌ |
| Bloquear agenda | ✅ | ✅ | ❌ |
| Ver reportes | ✅ | Limitado | ❌ |
| Gestionar usuarios staff | ✅ | ❌ | ❌ |
| Configuración del sistema | ✅ | ❌ | ❌ |

```typescript
// components/layout/RolGuard.tsx
'use client'
import { useStaffProfile } from '@/hooks/useStaffProfile'

type Rol = 'admin' | 'recepcion' | 'profesional'

export function RolGuard({ roles, children }: { roles: Rol[], children: React.ReactNode }) {
  const { profile } = useStaffProfile()
  if (!profile || !roles.includes(profile.rol)) return null
  return <>{children}</>
}

// Uso:
// <RolGuard roles={['admin']}>
//   <SeccionConfiguracion />
// </RolGuard>
```

---

## 9. Variables de Entorno

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=sistema@upcn.org.ar

# Make
MAKE_WEBHOOK_SECRET=           # header x-make-secret para autenticar llamadas de Make a la API
MAKE_WEBHOOK_NUEVO_TURNO=      # URL webhook Make (opcional)
MAKE_WEBHOOK_CANCELACION=      # URL webhook Make (opcional)

# App
NEXT_PUBLIC_APP_URL=https://turnos.upcn.org.ar
```

---

## 10. Roadmap de Desarrollo

### Fase 1 — Fundación (Semana 1-2)
- [ ] Setup Next.js 14 + Tailwind + shadcn/ui + Supabase
- [ ] Schema completo con RLS y seed de datos iniciales (especialidades, una sede, horarios tipo)
- [ ] Supabase Auth + middleware de protección total
- [ ] Layout base: Sidebar con navegación por rol, Header con usuario activo

### Fase 2 — Gestión de turnos (Semana 3-4)
- [ ] Buscador de afiliados (nombre, DNI, número)
- [ ] Formulario nuevo turno: afiliado → especialidad → profesional → fecha → slot
- [ ] Lógica de disponibilidad de slots
- [ ] Lista de turnos con filtros (fecha, profesional, estado)
- [ ] Edición y cancelación de turnos

### Fase 3 — Agenda y afiliados (Semana 5)
- [ ] Grilla de agenda por día/profesional
- [ ] Módulo ABM de afiliados + historial de turnos
- [ ] Bloqueos de agenda (licencias, feriados)

### Fase 4 — Make + WhatsApp (Semana 6)
- [ ] API Route GET /api/turnos autenticada por secret
- [ ] API Route PATCH /api/turnos/[id] para marcar recordatorio enviado
- [ ] Scenario de recordatorio en Make configurado y testeado
- [ ] Test end-to-end del flujo completo

### Fase 5 — Admin y reportes (Semana 7-8)
- [ ] ABM de profesionales, especialidades, horarios de atención
- [ ] Gestión de usuarios staff (crear, asignar rol, desactivar)
- [ ] Dashboard: métricas del día (turnos, ocupación %, ausencias)
- [ ] Reportes: demanda por especialidad, ocupación por período

### Fase 6 — QA y lanzamiento (Semana 9)
- [ ] Testing en dispositivos del equipo de recepción
- [ ] Deploy Vercel + dominio + DNS
- [ ] Capacitación al equipo

---

## 11. Notas de Arquitectura

- **Sin portal público.** Simplifica radicalmente la seguridad. Todo el acceso pasa por Supabase Auth con usuarios reales del staff.
- **Make como capa de WhatsApp.** La app no integra WhatsApp directamente. Make consulta la API de turnos y gestiona el envío. Cambiar de canal (ej: pasar a Twilio) no requiere tocar código.
- **Multi-sede en el schema desde el día uno.** `sede_id` en todas las tablas críticas. Hoy una sede activa; agregar otra no requiere migración.
- **Profesional como rol de staff.** Un médico puede loguearse y ver solo su agenda. Sin permisos de escritura salvo marcar atendido/ausente en sus propios turnos.
- **`recordatorio_enviado` como flag de idempotencia.** Evita duplicados si el scenario de Make se ejecuta más de una vez en el día.
- **Resend para emails internos** (ej: notificaciones al admin, avisos de bloqueo de agenda). Los recordatorios al afiliado van por WhatsApp vía Make.