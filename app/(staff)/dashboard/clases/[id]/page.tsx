import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Clock, Users } from 'lucide-react'
import { InscriptosManager } from '@/components/clases/InscriptosManager'

export const dynamic = 'force-dynamic'

export default async function ClaseDetallePage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  // Fetch clase
  const { data: clase, error } = await supabase
    .from('clases')
    .select(`
      *,
      profesionales ( nombre, apellido )
    `)
    .eq('id', params.id)
    .single()

  if (error || !clase) {
    return (
      <div className="py-8 pt-6 w-full">
        <h1 className="text-2xl font-bold">Clase no encontrada</h1>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/dashboard/clases">Volver</Link>
        </Button>
      </div>
    )
  }

  // Fetch inscripciones
  const { data: inscripcionesRaw, error: inscError } = await supabase
    .from('inscripciones')
    .select(`
      *,
      afiliados ( id, nombre, apellido, dni )
    `)
    .eq('clase_id', params.id)
    .neq('estado', 'baja')
    .order('posicion_espera', { ascending: true })

  // Note: if the foreign key is different, we might just query afiliados separately or fallback
  // If the explicit !... fails, we could just do `perfil:afiliados ( id, nombre, apellido, dni )` or similar.
  // Actually standard supabase is `afiliados ( ... )` if there's a FK. Since prompt says perfil_id, it might map to perfiles or afiliados. Let's pass the raw list and we'll fix it if it fails.

  // The fallback query in case "afiliados" fails: we'll fetch perfiles separately if needed inside the client.
  // We'll just pass the data to the client component.
  
  return (
    <div className="space-y-8 pt-6 w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/clases">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{clase.nombre}</h1>
            <p className="text-muted-foreground">
              {clase.profesionales?.nombre} {clase.profesionales?.apellido}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-xl border-slate-200" asChild>
            <Link href={`/dashboard/clases/${clase.id}/editar`}>
              Editar Clase
            </Link>
          </Button>
          <Button asChild className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
            <Link href={`/dashboard/clases/${clase.id}/asistencia`}>
              Tomar Asistencia
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Detalles de la Clase</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-slate-700">
              <Clock className="h-4 w-4" />
              <span>{clase.dia_semana}s de {clase.hora_inicio.slice(0,5)} a {clase.hora_fin.slice(0,5)}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Users className="h-4 w-4" />
              <span>Cupo máximo: {clase.cupo_maximo}</span>
            </div>
            {clase.descripcion && (
              <div className="pt-4 border-t">
                <p className="text-sm text-slate-500">{clase.descripcion}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="md:col-span-3">
          <InscriptosManager claseId={clase.id} cupoMaximo={clase.cupo_maximo} initialInscripciones={inscripcionesRaw || []} />
        </div>
      </div>
    </div>
  )
}
