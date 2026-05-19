import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Plus, Clock, Users, ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ProfesionalDetallePage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: profesional, error } = await supabase
    .from('profesionales')
    .select(`
      *,
      clases (
        *,
        inscripciones ( estado )
      )
    `)
    .eq('id', params.id)
    .single()

  if (error || !profesional) {
    return (
      <div className="py-8 w-full">
        <h1 className="text-2xl font-bold">Profesional no encontrado</h1>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/dashboard/profesionales">Volver</Link>
        </Button>
      </div>
    )
  }

  // Procesar clases
  const clases = (profesional.clases || []).map((c: any) => {
    const inscripciones = c.inscripciones || []
    const activas = inscripciones.filter((i: any) => i.estado === 'activa').length
    const espera = inscripciones.filter((i: any) => i.estado === 'lista_espera').length

    const cupoOcupado = activas / c.cupo_maximo
    let cupoColor = "bg-emerald-100 text-emerald-700"
    if (cupoOcupado >= 1) cupoColor = "bg-rose-100 text-rose-700"
    else if (cupoOcupado >= 0.8) cupoColor = "bg-amber-100 text-amber-700"

    return {
      ...c,
      inscriptosActivos: activas,
      enListaEspera: espera,
      cupoColor
    }
  })

  return (
    <div className="space-y-8 pt-6 w-full">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/profesionales">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{profesional.nombre} {profesional.apellido}</h1>
          <p className="text-muted-foreground">Matrícula: {profesional.matricula || 'Sin matrícula'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Datos Personales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Teléfono</p>
              <p className="text-slate-800">{profesional.telefono || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Estado</p>
              {profesional.activo ? (
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 mt-1">Activo</Badge>
              ) : (
                <Badge variant="secondary" className="mt-1">Inactivo</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Clases Asignadas</CardTitle>
            <Button size="sm" asChild>
              <Link href={`/dashboard/clases/nueva?profesional=${profesional.id}`}>
                <Plus className="mr-2 h-4 w-4" /> Nueva Clase
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {clases.length === 0 ? (
              <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed">
                Este profesional no tiene clases asignadas aún.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {clases.map((c: any) => (
                  <div key={c.id} className="border rounded-xl p-4 bg-white shadow-sm flex flex-col justify-between group hover:border-sky-200 transition-colors">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-lg text-slate-800">{c.nombre}</h4>
                        {c.activa ? (
                          <div className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${c.cupoColor}`}>
                            {c.inscriptosActivos} / {c.cupo_maximo} cupo
                          </div>
                        ) : (
                          <div className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Inactiva</div>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 line-clamp-2 mb-4">{c.descripcion}</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-slate-600 font-medium bg-slate-50 p-2 rounded-lg">
                        <Clock className="h-4 w-4 text-sky-500" />
                        {c.dia_semana}s de {c.hora_inicio.slice(0,5)} a {c.hora_fin.slice(0,5)}
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                          {c.enListaEspera > 0 && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 gap-1">
                              <Users className="h-3 w-3" /> {c.enListaEspera} espera
                            </Badge>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" className="group-hover:bg-sky-50 group-hover:text-sky-600" asChild>
                          <Link href={`/dashboard/clases/${c.id}`}>Ver detalle</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
