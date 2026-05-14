import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const fecha = searchParams.get('fecha')
  const profesionalId = searchParams.get('profesional_id')
  const estado = searchParams.get('estado')

  const supabase = createClient()
  let query = supabase
    .from('turnos')
    .select(`
      *,
      afiliados ( nombre, apellido, dni ),
      profesionales ( nombre, apellido, especialidades ( nombre ) )
    `)
    .order('hora', { ascending: true })

  if (fecha) query = query.eq('fecha', fecha)
  if (profesionalId) query = query.eq('profesional_id', profesionalId)
  if (estado) query = query.eq('estado', estado)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const body = await req.json()

  // 1. Obtener usuario autenticado
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Validar que el slot sigue libre (race condition check)
  const { data: existente } = await supabase
    .from('turnos')
    .select('id')
    .eq('profesional_id', body.profesional_id)
    .eq('fecha', body.fecha)
    .eq('hora', body.hora)
    .neq('estado', 'cancelado')
    .maybeSingle()

  if (existente) {
    return NextResponse.json({ error: 'El slot ya ha sido ocupado.' }, { status: 409 })
  }

  // 3. Insertar turno
  const { data, error } = await supabase
    .from('turnos')
    .insert({
      ...body,
      created_by: user.id,
      estado: 'pendiente'
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

