import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookies().get(name)?.value } }
  )

  // 1. Verificar que el solicitante sea ADMIN
  const { data: { session } } = await supabaseAuth.auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: profile } = await supabaseAuth
    .from('staff_profiles')
    .select('rol')
    .eq('id', session.user.id)
    .single()

  if (profile?.rol !== 'admin') {
    return NextResponse.json({ error: 'Prohibido: Se requiere rol admin' }, { status: 403 })
  }

  // 2. Crear cliente administrativo (Service Role)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  try {
    const body = await req.json()
    const { email, password, nombre, apellido, rol, username, dni, telefono, sede_id } = body

    if (!email || !password || !nombre || !apellido || !rol) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    // 3. Crear usuario en Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nombre, apellido, rol }
    })

    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

    // 4. Crear perfil en staff_profiles
    const { error: profileError } = await supabaseAdmin
      .from('staff_profiles')
      .insert({
        id: authData.user.id,
        nombre,
        apellido,
        rol,
        username: username || (nombre.charAt(0) + apellido).toLowerCase().trim(),
        dni,
        telefono,
        email,
        sede_id: sede_id || null
      })

    if (profileError) {
      // Si falla el perfil, borramos el usuario auth
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, user: authData.user })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookies().get(name)?.value } }
  )

  const { data: { session } } = await supabaseAuth.auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: staff, error } = await supabaseAuth
    .from('staff_profiles')
    .select(`
      *,
      sedes(nombre)
    `)
    .order('apellido')

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json(staff)
}
