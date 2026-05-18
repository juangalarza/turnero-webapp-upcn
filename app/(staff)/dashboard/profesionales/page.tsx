'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  UserPlus, 
  Stethoscope, 
  Clock, 
  Save, 
  X,
  Loader2,
  UserCog,
  Check,
  AlertCircle,
  Plus
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { RolGuard } from '@/components/layout/RolGuard'

export default function ProfesionalesPage() {
  const { toast } = useToast()
  const supabase = createClient()
  
  const [profesionales, setProfesionales] = useState<any[]>([])
  const [especialidades, setEspecialidades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    matricula: '',
    telefono: '',
    especialidad_id: '',
    activo: true,
    // Horarios
    dias: [] as number[],
    hora_inicio: '08:00',
    hora_fin: '16:00',
    duracion: 20
  })

  const DIAS_SEMANA = [
    { id: 1, label: 'Lunes' },
    { id: 2, label: 'Martes' },
    { id: 3, label: 'Miércoles' },
    { id: 4, label: 'Jueves' },
    { id: 5, label: 'Viernes' },
    { id: 6, label: 'Sábado' },
    { id: 0, label: 'Domingo' }
  ]

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      // Fetch Especialidades
      const { data: esp } = await supabase.from('especialidades').select('*').order('nombre')
      if (esp) setEspecialidades(esp)

      // Fetch Profesionales
      const { data: prof } = await supabase
        .from('profesionales')
        .select(`
          *,
          especialidades ( nombre, color )
        `)
        .order('apellido')
        
      if (prof) setProfesionales(prof)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleDia = (diaId: number) => {
    setFormData(prev => {
      if (prev.dias.includes(diaId)) {
        return { ...prev, dias: prev.dias.filter(d => d !== diaId) }
      } else {
        return { ...prev, dias: [...prev.dias, diaId] }
      }
    })
  }

  async function handleAddProfesional(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.especialidad_id) {
      toast({ title: "Falta Especialidad", description: "Selecciona una prestación.", variant: "destructive" })
      return
    }

    if (formData.dias.length === 0) {
      toast({ title: "Faltan Horarios", description: "Selecciona al menos un día de atención.", variant: "destructive" })
      return
    }

    setIsSaving(true)

    try {
      // 1. Crear Profesional
      const { data: newProf, error: profError } = await supabase
        .from('profesionales')
        .insert({
          nombre: formData.nombre,
          apellido: formData.apellido,
          matricula: formData.matricula || null,
          telefono: formData.telefono || null,
          especialidad_id: formData.especialidad_id,
          activo: formData.activo
        })
        .select()
        .single()

      if (profError) throw profError

      // 2. Crear Horarios
      const horarios = formData.dias.map(dia => ({
        profesional_id: newProf.id,
        dia_semana: dia,
        hora_inicio: formData.hora_inicio,
        hora_fin: formData.hora_fin,
        duracion_turno_minutos: formData.duracion,
        activo: true
      }))

      const { error: horError } = await supabase.from('horarios_atencion').insert(horarios)
      if (horError) throw horError

      toast({
        title: "Profesional registrado",
        description: `Se ha registrado a Dr/a. ${formData.apellido} correctamente.`
      })
      
      setIsAdding(false)
      setFormData({
        nombre: '', apellido: '', matricula: '', telefono: '',
        especialidad_id: '', activo: true,
        dias: [], hora_inicio: '08:00', hora_fin: '16:00', duracion: 20
      })
      fetchData()

    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  async function toggleActivo(id: string, currentStatus: boolean) {
    const { error } = await supabase
      .from('profesionales')
      .update({ activo: !currentStatus })
      .eq('id', id)
      
    if (error) {
      toast({ title: "Error", description: "No se pudo actualizar el estado.", variant: "destructive" })
    } else {
      toast({ title: "Estado actualizado", description: "El estado del profesional ha cambiado." })
      setProfesionales(profesionales.map(p => p.id === id ? { ...p, activo: !currentStatus } : p))
    }
  }

  return (
    <RolGuard roles={['admin', 'recepcion']}>
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Profesionales</h1>
          <p className="text-slate-500">Gestiona los médicos y prestadores del sistema.</p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {isAdding ? 'Cancelar' : 'Nuevo Profesional'}
        </Button>
      </div>

      {isAdding && (
        <Card className="p-8 rounded-3xl shadow-xl border-indigo-100 bg-indigo-50/30">
          <h2 className="text-lg font-bold text-indigo-900 mb-6 flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-indigo-500" />
            Registrar Nuevo Profesional
          </h2>
          <form onSubmit={handleAddProfesional} className="space-y-8">
            
            {/* Datos Personales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-indigo-700 font-semibold ml-1">Prestación / Especialidad *</Label>
                <Select value={formData.especialidad_id} onValueChange={(v) => setFormData({...formData, especialidad_id: v})}>
                  <SelectTrigger className="bg-white h-11 rounded-xl">
                    <SelectValue placeholder="Seleccionar especialidad..." />
                  </SelectTrigger>
                  <SelectContent>
                    {especialidades.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-indigo-700 font-semibold ml-1">Nombre *</Label>
                <Input value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="bg-white h-11 rounded-xl" required />
              </div>

              <div className="space-y-2">
                <Label className="text-indigo-700 font-semibold ml-1">Apellido *</Label>
                <Input value={formData.apellido} onChange={e => setFormData({...formData, apellido: e.target.value})} className="bg-white h-11 rounded-xl" required />
              </div>

              <div className="space-y-2">
                <Label className="text-indigo-700 font-semibold ml-1">Matrícula</Label>
                <Input value={formData.matricula} onChange={e => setFormData({...formData, matricula: e.target.value})} placeholder="Ej: MP 1234" className="bg-white h-11 rounded-xl" />
              </div>

              <div className="space-y-2">
                <Label className="text-indigo-700 font-semibold ml-1">Teléfono</Label>
                <Input value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} placeholder="Ej: 2645123456" className="bg-white h-11 rounded-xl" />
              </div>
              
              <div className="space-y-2 flex flex-col justify-center">
                <Label className="text-indigo-700 font-semibold ml-1 mb-2">Estado del Profesional</Label>
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
                  <Switch 
                    checked={formData.activo} 
                    onCheckedChange={(v) => setFormData({...formData, activo: v})} 
                  />
                  <span className="text-sm font-medium">{formData.activo ? 'Activo (Recibe turnos)' : 'De Licencia / Inactivo'}</span>
                </div>
              </div>
            </div>

            {/* Horarios */}
            <div className="bg-white border border-indigo-100 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4" /> Días y Horarios de Atención
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Días */}
                <div className="space-y-3">
                  <Label className="text-slate-500 font-semibold">Días de la semana *</Label>
                  <div className="flex flex-wrap gap-2">
                    {DIAS_SEMANA.map(dia => {
                      const isSelected = formData.dias.includes(dia.id)
                      return (
                        <button
                          key={dia.id}
                          type="button"
                          onClick={() => toggleDia(dia.id)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            isSelected 
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {dia.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Tiempos */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-500 font-semibold">Hora Inicio</Label>
                    <Input type="time" value={formData.hora_inicio} onChange={e => setFormData({...formData, hora_inicio: e.target.value})} className="h-11 rounded-xl" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-500 font-semibold">Hora Fin</Label>
                    <Input type="time" value={formData.hora_fin} onChange={e => setFormData({...formData, hora_fin: e.target.value})} className="h-11 rounded-xl" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-500 font-semibold">Duración (min)</Label>
                    <Select value={formData.duracion.toString()} onValueChange={(v) => setFormData({...formData, duracion: parseInt(v)})}>
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 min</SelectItem>
                        <SelectItem value="20">20 min</SelectItem>
                        <SelectItem value="30">30 min</SelectItem>
                        <SelectItem value="60">1 hora</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button 
                type="submit"
                disabled={isSaving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-8 shadow-lg shadow-indigo-200 h-auto py-3"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Guardar Profesional y Horarios
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Lista */}
      <Card className="rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="py-5 px-6">Profesional</TableHead>
              <TableHead>Especialidad</TableHead>
              <TableHead>Matrícula</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right px-6">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-500" />
                </TableCell>
              </TableRow>
            ) : profesionales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-slate-400">
                  No hay profesionales registrados.
                </TableCell>
              </TableRow>
            ) : (
              profesionales.map((p) => (
                <TableRow key={p.id} className={`group hover:bg-slate-50/50 transition-colors ${!p.activo ? 'opacity-70' : ''}`}>
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${p.activo ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                        {p.nombre?.charAt(0)}{p.apellido?.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700">Dr/a. {p.apellido}, {p.nombre}</span>
                        {p.telefono && <span className="text-[11px] text-slate-500 flex items-center gap-1">Tel: {p.telefono}</span>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-[11px] font-bold tracking-wider">
                      {p.especialidades?.nombre || 'Sin especialidad'}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-500">
                    {p.matricula || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={p.activo} 
                        onCheckedChange={() => toggleActivo(p.id, p.activo)} 
                      />
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${p.activo ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {p.activo ? 'Activo' : 'Licencia'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-indigo-600 rounded-lg">
                      <UserCog className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
    </RolGuard>
  )
}
