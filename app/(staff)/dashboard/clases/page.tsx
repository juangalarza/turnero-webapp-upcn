import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Link from 'next/link'
import { Plus, Users, Clock, Edit2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

const daysMap: Record<string, number> = {
  'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6, 'Domingo': 7
}

export default async function ClasesPage() {
  const supabase = createClient()
  
  const { data: clases, error } = await supabase
    .from('clases')
    .select(`
      *,
      profesionales ( nombre, apellido ),
      inscripciones ( estado )
    `)

  // Procesar counts y order
  const clasesProcesadas = (clases || []).map(c => {
    const inscripciones = c.inscripciones || []
    const activas = inscripciones.filter((i: any) => i.estado === 'activa').length
    const espera = inscripciones.filter((i: any) => i.estado === 'lista_espera').length
    
    // Indicador de cupo
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
  }).sort((a, b) => {
    const dayA = daysMap[a.dia_semana] || 0
    const dayB = daysMap[b.dia_semana] || 0
    if (dayA !== dayB) return dayA - dayB
    return a.hora_inicio.localeCompare(b.hora_inicio)
  })

  return (
    <div className="space-y-6 pt-6 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Clases</h1>
          <p className="text-muted-foreground">Administración de clases, cupos y listas de espera.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/clases/nueva">
            <Plus className="mr-2 h-4 w-4" /> Nueva Clase
          </Link>
        </Button>
      </div>

      <div className="border rounded-md bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Clase / Profesional</TableHead>
              <TableHead>Día y Horario</TableHead>
              <TableHead className="text-center">Cupo</TableHead>
              <TableHead className="text-center">Lista de Espera</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clasesProcesadas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">No hay clases registradas.</TableCell>
              </TableRow>
            ) : (
              clasesProcesadas.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800">{c.nombre}</span>
                      <span className="text-xs text-muted-foreground">
                        {c.profesionales?.nombre} {c.profesionales?.apellido}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-700">{c.dia_semana}</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {c.hora_inicio.slice(0,5)} - {c.hora_fin.slice(0,5)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold ${c.cupoColor}`}>
                      {c.inscriptosActivos} / {c.cupo_maximo}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {c.enListaEspera > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                        <Users className="h-3 w-3" /> {c.enListaEspera} en espera
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {c.activa ? (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">Activa</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200">Inactiva</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <div className="flex justify-end items-center gap-2">
                      <Button variant="ghost" size="sm" asChild className="rounded-xl">
                        <Link href={`/dashboard/clases/${c.id}`}>
                          Ver detalle
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild className="text-slate-400 hover:text-indigo-600 rounded-xl h-8 w-8">
                        <Link href={`/dashboard/clases/${c.id}/editar`}>
                          <Edit2 className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
