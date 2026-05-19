import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AsistenciaManager } from '@/components/clases/AsistenciaManager'

export const dynamic = 'force-dynamic'

export default async function AsistenciaClasePage({ params }: { params: { id: string } }) {
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
          <Link href={`/dashboard/clases/${params.id}`}>Volver</Link>
        </Button>
      </div>
    )
  }

  // Fetch inscriptos activos
  const { data: inscriptosRaw } = await supabase
    .from('inscripciones')
    .select(`
      id,
      perfil_id,
      afiliados ( id, nombre, apellido, dni )
    `)
    .eq('clase_id', params.id)
    .eq('estado', 'activa')

  return (
    <div className="space-y-6 pt-6 w-full">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/clases/${clase.id}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Tomar Asistencia</h1>
          <p className="text-muted-foreground">
            Clase: {clase.nombre} — {(clase.profesionales as any)?.nombre} {(clase.profesionales as any)?.apellido}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <AsistenciaManager inscriptos={inscriptosRaw || []} claseId={clase.id} />
        </CardContent>
      </Card>
    </div>
  )
}
