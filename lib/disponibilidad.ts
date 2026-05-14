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

  const hData = horario as { hora_inicio: string; hora_fin: string; duracion_turno_minutos: number }

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

  const ocupadosData = (ocupados || []) as { hora: string }[]
  const horasOcupadas = new Set(ocupadosData.map(t => t.hora.slice(0, 5)))

  // 4. Generar slots
  const slots: string[] = []
  const [hI, mI] = hData.hora_inicio.split(':').map(Number)
  const [hF, mF] = hData.hora_fin.split(':').map(Number)
  let minutos = hI * 60 + mI
  const finMinutos = hF * 60 + mF

  while (minutos < finMinutos) {
    const h = String(Math.floor(minutos / 60)).padStart(2, '0')
    const m = String(minutos % 60).padStart(2, '0')
    const slot = `${h}:${m}`
    if (!horasOcupadas.has(slot)) slots.push(slot)
    minutos += hData.duracion_turno_minutos ?? 20
  }

  return slots
}

