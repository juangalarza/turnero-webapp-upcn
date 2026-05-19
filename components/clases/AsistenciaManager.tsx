'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save } from 'lucide-react'

interface AsistenciaState {
  id?: string
  inscripcion_id: string
  presente: boolean
  justificada: boolean
  nota: string
}

export function AsistenciaManager({ inscriptos, claseId }: { inscriptos: any[]; claseId: string }) {
  const supabase = createClient()
  const { toast } = useToast()

  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [estado, setEstado] = useState<Record<string, AsistenciaState>>({})

  // Fetch existing records for this date
  useEffect(() => {
    async function loadAsistencia() {
      setLoading(true)
      const { data, error } = await supabase
        .from('asistencia')
        .select('*')
        .eq('fecha', fecha)
        .in('inscripcion_id', inscriptos.map(i => i.id))

      const newEstado: Record<string, AsistenciaState> = {}

      // Inicializar todo como no presente
      inscriptos.forEach(ins => {
        newEstado[ins.id] = {
          inscripcion_id: ins.id,
          presente: false,
          justificada: false,
          nota: ''
        }
      })

      // Sobrescribir con lo guardado
      if (data) {
        data.forEach(asist => {
          if (!asist.inscripcion_id) return
          newEstado[asist.inscripcion_id] = {
            id: asist.id,
            inscripcion_id: asist.inscripcion_id,
            presente: asist.presente ?? false,
            justificada: asist.justificada ?? false,
            nota: asist.nota ?? ''
          }
        })
      }

      setEstado(newEstado)
      setLoading(false)
    }

    loadAsistencia()
  }, [fecha, inscriptos, supabase])

  const handleTogglePresente = (insId: string, checked: boolean) => {
    setEstado(prev => ({
      ...prev,
      [insId]: {
        ...prev[insId],
        presente: checked,
        justificada: checked ? false : prev[insId].justificada // limpiar justificada si está presente
      }
    }))
  }

  const handleToggleJustificada = (insId: string, checked: boolean) => {
    setEstado(prev => ({
      ...prev,
      [insId]: {
        ...prev[insId],
        justificada: checked
      }
    }))
  }

  const handleNotaChange = (insId: string, value: string) => {
    setEstado(prev => ({
      ...prev,
      [insId]: {
        ...prev[insId],
        nota: value
      }
    }))
  }

  const handleSave = async () => {
    setSaving(true)

    // Obtener info del usuario actual para registrado_por
    const { data: userData } = await supabase.auth.getUser()

    const upsertData = Object.values(estado).map(s => {
      const payload: any = {
        inscripcion_id: s.inscripcion_id,
        fecha,
        presente: s.presente,
        justificada: s.justificada,
        nota: s.nota,
        registrado_por: userData?.user?.id || null
      }
      if (s.id) payload.id = s.id // Mantener el id si ya existía
      return payload
    })

    const { error } = await supabase
      .from('asistencia')
      .upsert(upsertData, { onConflict: 'inscripcion_id, fecha' })

    if (error) {
      toast({ title: 'Error', description: 'No se pudo guardar la asistencia.', variant: 'destructive' })
    } else {
      toast({ title: 'Éxito', description: 'Asistencia guardada correctamente.' })
      // Recargar para obtener los IDs generados por si se vuelve a guardar
      const { data } = await supabase
        .from('asistencia')
        .select('*')
        .eq('fecha', fecha)
        .in('inscripcion_id', inscriptos.map(i => i.id))
      
      if (data) {
        setEstado(prev => {
          const updated = { ...prev }
          data.forEach(asist => {
            if (!asist.inscripcion_id) return
            if (updated[asist.inscripcion_id]) {
              updated[asist.inscripcion_id].id = asist.id
            }
          })
          return updated
        })
      }
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-48 space-y-1">
          <label className="text-sm font-medium">Fecha de la clase</label>
          <Input 
            type="date" 
            value={fecha} 
            onChange={e => setFecha(e.target.value)} 
          />
        </div>
        <div className="flex-1" />
        <Button onClick={handleSave} disabled={loading || saving} className="self-end">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Guardar Asistencia
        </Button>
      </div>

      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre y Apellido</TableHead>
              <TableHead className="w-32 text-center">Presente</TableHead>
              <TableHead className="w-32 text-center">Falta Justificada</TableHead>
              <TableHead>Nota / Observación</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" /></TableCell>
              </TableRow>
            ) : inscriptos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-slate-500">No hay inscriptos activos para esta clase.</TableCell>
              </TableRow>
            ) : (
              inscriptos.map(ins => {
                const st = estado[ins.id]
                if (!st) return null
                return (
                  <TableRow key={ins.id}>
                    <TableCell className="font-medium">
                      {ins.afiliados?.nombre} {ins.afiliados?.apellido}
                      <p className="text-xs text-slate-400 font-normal">DNI: {ins.afiliados?.dni}</p>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch 
                        checked={st.presente} 
                        onCheckedChange={(c) => handleTogglePresente(ins.id, c)} 
                        className="data-[state=checked]:bg-emerald-500"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      {!st.presente ? (
                        <Switch 
                          checked={st.justificada} 
                          onCheckedChange={(c) => handleToggleJustificada(ins.id, c)}
                          className="data-[state=checked]:bg-amber-500" 
                        />
                      ) : (
                        <span className="text-slate-300 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input 
                        placeholder="Nota opcional..." 
                        value={st.nota} 
                        onChange={(e) => handleNotaChange(ins.id, e.target.value)} 
                        className="h-8 text-sm"
                      />
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
