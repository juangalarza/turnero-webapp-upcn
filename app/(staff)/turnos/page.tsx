'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BadgeEstado } from '@/components/turnos/BadgeEstado'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar as CalendarIcon, Filter, MoreHorizontal, User, RefreshCw, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function TurnosPage() {
  const { toast } = useToast()
  const supabase = createClient()

  const [turnos, setTurnos] = useState<any[]>([])
  const [profesionales, setProfesionales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [profesionalId, setProfesionalId] = useState<string>('all')
  const [estado, setEstado] = useState<string>('all')

  const fetchTurnos = useCallback(async () => {
    setLoading(true)
    let url = `/api/turnos?fecha=${fecha}`
    if (profesionalId !== 'all') url += `&profesional_id=${profesionalId}`
    if (estado !== 'all') url += `&estado=${estado}`

    try {
      const res = await fetch(url)
      const data = await res.json()
      if (res.ok) setTurnos(data)
    } catch (error) {
      console.error('Error fetching turnos:', error)
    } finally {
      setLoading(false)
    }
  }, [fecha, profesionalId, estado])

  useEffect(() => {
    const fetchProfesionales = async () => {
      const { data } = await supabase
        .from('profesionales')
        .select('id, nombre, apellido')
        .eq('activo', true)
        .order('apellido')
      if (data) setProfesionales(data)
    }
    fetchProfesionales()
  }, [supabase])

  useEffect(() => {
    fetchTurnos()
  }, [fetchTurnos])

  const handleUpdateEstado = async (id: string, nuevoEstado: string) => {
    try {
      const res = await fetch(`/api/turnos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      })

      if (res.ok) {
        toast({ title: "Estado actualizado", description: `Turno marcado como ${nuevoEstado}.` })
        fetchTurnos()
      } else {
        throw new Error('Error al actualizar')
      }
    } catch (error) {
      toast({ title: "Error", description: "No se pudo actualizar el estado.", variant: "destructive" })
    }
  }

  return (
    <div className="container py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Turnos</h1>
          <p className="text-muted-foreground">Listado y control de citas médicas.</p>
        </div>
        <Button asChild>
          <Link href="/turnos/nuevo">
            <Plus className="mr-2 h-4 w-4" /> Nuevo Turno
          </Link>
        </Button>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium">Fecha</label>
            <div className="relative">
              <CalendarIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Profesional</label>
            <Select value={profesionalId} onValueChange={setProfesionalId}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los profesionales" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los profesionales</SelectItem>
                {profesionales.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.apellido}, {p.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Estado</label>
            <Select value={estado} onValueChange={setEstado}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="atendido">Atendido</SelectItem>
                <SelectItem value="ausente">Ausente</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" onClick={fetchTurnos} className="flex items-center gap-2">
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Actualizar
          </Button>
        </div>
      </Card>

      {/* Tabla */}
      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Hora</TableHead>
              <TableHead>Afiliado</TableHead>
              <TableHead>Profesional</TableHead>
              <TableHead>Especialidad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">Cargando turnos...</TableCell>
              </TableRow>
            ) : turnos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">No se encontraron turnos para los filtros seleccionados.</TableCell>
              </TableRow>
            ) : (
              turnos.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono font-medium">{t.hora.slice(0, 5)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{t.afiliados?.nombre} {t.afiliados?.apellido}</span>
                      <span className="text-xs text-muted-foreground">DNI: {t.afiliados?.dni}</span>
                    </div>
                  </TableCell>
                  <TableCell>{t.profesionales?.nombre} {t.profesionales?.apellido}</TableCell>
                  <TableCell>{t.profesionales?.especialidades?.nombre}</TableCell>
                  <TableCell>
                    <BadgeEstado estado={t.estado} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleUpdateEstado(t.id, 'confirmado')}>
                          Confirmar turno
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateEstado(t.id, 'atendido')}>
                          Marcar atendido
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateEstado(t.id, 'ausente')}>
                          Marcar ausente
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleUpdateEstado(t.id, 'cancelado')}
                        >
                          Cancelar turno
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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


