'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { RolGuard } from '@/components/layout/RolGuard'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Loader2, Save, Trash2, Clock, X, AlertTriangle, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'

export default function EditarProfesionalPage({ params }: { params: { id: string } }) {
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [especialidades, setEspecialidades] = useState<any[]>([])

  type HorarioProfBloque = {
    id: number;
    dias: number[];
    hora_inicio: string;
    hora_fin: string;
    duracion: number;
    isCustomDuration: boolean;
  }

  const [horariosProf, setHorariosProf] = useState<HorarioProfBloque[]>([])

  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    matricula: '',
    telefono: '',
    especialidad_id: '',
    activo: true
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

  const isCupoSelected = especialidades.find(e => e.id === formData.especialidad_id)?.tipo_prestacion === 'cupo'

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      // 1. Fetch especialidades
      const { data: esp, error: espError } = await supabase.from('especialidades').select('*').order('nombre')
      if (espError) throw espError
      if (esp) setEspecialidades(esp)

      // 2. Fetch profesional
      const { data: prof, error: profError } = await supabase
        .from('profesionales')
        .select('*')
        .eq('id', params.id)
        .single()
      
      if (profError) throw profError
      if (prof) {
        setFormData({
          nombre: prof.nombre || '',
          apellido: prof.apellido || '',
          matricula: prof.matricula || '',
          telefono: prof.telefono || '',
          especialidad_id: prof.especialidad_id || '',
          activo: prof.activo ?? true
        })
      }

      // 3. Fetch schedules
      const { data: hor, error: horError } = await supabase
        .from('horarios_atencion')
        .select('*')
        .eq('profesional_id', params.id)

      if (horError) throw horError

      if (hor && hor.length > 0) {
        // Group by (hora_inicio, hora_fin, duracion_turno_minutos)
        const groups: Record<string, { dias: number[], hora_inicio: string, hora_fin: string, duracion: number }> = {}
        
        hor.forEach(h => {
          const key = `${h.hora_inicio.slice(0,5)}-${h.hora_fin.slice(0,5)}-${h.duracion_turno_minutos}`
          if (!groups[key]) {
            groups[key] = {
              dias: [],
              hora_inicio: h.hora_inicio.slice(0,5),
              hora_fin: h.hora_fin.slice(0,5),
              duracion: h.duracion_turno_minutos ?? 20
            }
          }
          groups[key].dias.push(h.dia_semana)
        })

        const mappedBlocks = Object.values(groups).map((g, idx) => {
          const standardDurations = [15, 20, 30, 45, 60]
          return {
            id: Date.now() + idx,
            dias: g.dias,
            hora_inicio: g.hora_inicio,
            hora_fin: g.hora_fin,
            duracion: g.duracion,
            isCustomDuration: !standardDurations.includes(g.duracion)
          }
        })
        setHorariosProf(mappedBlocks)
      } else {
        // Default empty block
        setHorariosProf([{
          id: Date.now(),
          dias: [],
          hora_inicio: '08:00',
          hora_fin: '16:00',
          duracion: 20,
          isCustomDuration: false
        }])
      }

    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
      router.push('/dashboard/profesionales')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.especialidad_id) {
      toast({ title: "Falta Especialidad", description: "Selecciona una prestación.", variant: "destructive" })
      return
    }

    if (!isCupoSelected && horariosProf.some(h => h.dias.length === 0)) {
      toast({ title: "Faltan Horarios", description: "Todos los horarios deben tener al menos un día seleccionado.", variant: "destructive" })
      return
    }

    setIsSaving(true)
    try {
      // 1. Actualizar Profesional
      const { error: profError } = await supabase
        .from('profesionales')
        .update({
          nombre: formData.nombre,
          apellido: formData.apellido,
          matricula: formData.matricula || null,
          telefono: formData.telefono || null,
          especialidad_id: formData.especialidad_id,
          activo: formData.activo
        })
        .eq('id', params.id)

      if (profError) throw profError

      // 2. Actualizar Horarios (sólo para Turnos)
      // Primero eliminamos los viejos
      const { error: delError } = await supabase
        .from('horarios_atencion')
        .delete()
        .eq('profesional_id', params.id)

      if (delError) throw delError

      if (!isCupoSelected) {
        const horarios = horariosProf.flatMap(bloque => 
          bloque.dias.map(dia => ({
            profesional_id: params.id,
            dia_semana: dia,
            hora_inicio: bloque.hora_inicio,
            hora_fin: bloque.hora_fin,
            duracion_turno_minutos: bloque.duracion,
            activo: true
          }))
        )

        const { error: horError } = await supabase.from('horarios_atencion').insert(horarios)
        if (horError) throw horError
      }

      toast({ title: "Profesional actualizado", description: "Los datos y horarios fueron guardados correctamente." })
      router.push('/dashboard/profesionales')
    } catch (error: any) {
      toast({ title: "Error al guardar", description: error.message, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm("¿Estás seguro de que deseas eliminar permanentemente a este profesional? Se borrarán todos sus horarios de atención.")) return

    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('profesionales')
        .delete()
        .eq('id', params.id)

      if (error) throw error

      toast({ title: "Profesional eliminado", description: "El registro ha sido removido con éxito." })
      router.push('/dashboard/profesionales')
    } catch (error: any) {
      toast({ title: "Error al eliminar", description: error.message, variant: "destructive" })
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <RolGuard roles={['admin']}>
      <div className="space-y-6 w-full pb-10">
        
        {/* Header navigation */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="rounded-xl border border-slate-100 bg-white">
            <Link href="/dashboard/profesionales">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Editar Profesional</h1>
            <p className="text-xs text-slate-500">Actualiza los datos personales y de agenda del profesional.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-8 rounded-3xl shadow-sm border border-slate-100 bg-white space-y-6">
            <h2 className="text-sm font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-2 mb-2">
              <ShieldCheck className="h-4 w-4 text-indigo-500" /> Ficha del Profesional
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-slate-500 font-semibold ml-1">Nombre *</Label>
                <Input 
                  value={formData.nombre} 
                  onChange={e => setFormData({...formData, nombre: e.target.value})} 
                  placeholder="Ej: Laura" 
                  required 
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-500 font-semibold ml-1">Apellido *</Label>
                <Input 
                  value={formData.apellido} 
                  onChange={e => setFormData({...formData, apellido: e.target.value})} 
                  placeholder="Ej: Gómez" 
                  required 
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-slate-500 font-semibold ml-1">Prestación / Especialidad *</Label>
                <Select 
                  value={formData.especialidad_id}
                  onValueChange={(val) => setFormData({...formData, especialidad_id: val})}
                >
                  <SelectTrigger className="h-11 rounded-xl bg-white">
                    <SelectValue placeholder="Selecciona una especialidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {especialidades.map(e => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.nombre} ({e.tipo_prestacion === 'cupo' ? 'Cupo' : 'Turno'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!isCupoSelected ? (
                <div className="space-y-2">
                  <Label className="text-slate-500 font-semibold ml-1">Matrícula Nacional/Provincial *</Label>
                  <Input 
                    value={formData.matricula} 
                    onChange={e => setFormData({...formData, matricula: e.target.value})} 
                    placeholder="Ej: MN-12345" 
                    required={!isCupoSelected}
                    className="h-11 rounded-xl"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-slate-400 font-semibold ml-1">Matrícula</Label>
                  <div className="h-11 bg-slate-50 text-slate-400 text-xs px-4 flex items-center rounded-xl border border-slate-200">
                    No aplica para prestaciones por cupo
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-slate-500 font-semibold ml-1">Teléfono</Label>
                <Input 
                  value={formData.telefono} 
                  onChange={e => setFormData({...formData, telefono: e.target.value})} 
                  placeholder="Ej: 2644998877" 
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2 max-w-sm">
              <Label className="text-slate-500 font-semibold ml-1">Estado</Label>
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <Switch 
                  checked={formData.activo} 
                  onCheckedChange={(v) => setFormData({...formData, activo: v})} 
                />
                <span className="text-sm font-medium">{formData.activo ? 'Activo (Disponible para turnos)' : 'De licencia / Inactivo'}</span>
              </div>
            </div>
          </Card>

          {/* Horarios dinámicos en bloques (sólo para Turnos) */}
          {!isCupoSelected && (
            <div className="space-y-4">
              {horariosProf.map((bloque, index) => (
                <div key={bloque.id} className="bg-white border border-indigo-100 rounded-3xl p-8 shadow-sm relative">
                  {horariosProf.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 rounded-xl"
                      onClick={() => setHorariosProf(horariosProf.filter(h => h.id !== bloque.id))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-indigo-500" /> Horario {index + 1}
                  </h3>
                  
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* Días */}
                    <div className="space-y-3">
                      <Label className="text-slate-500 font-semibold uppercase text-xs">Días de la semana *</Label>
                      <div className="flex flex-wrap gap-2">
                        {DIAS_SEMANA.map(dia => {
                          const isSelected = bloque.dias.includes(dia.id)
                          return (
                            <button
                              key={dia.id}
                              type="button"
                              onClick={() => {
                                const newHorarios = [...horariosProf];
                                if (isSelected) {
                                  newHorarios[index].dias = bloque.dias.filter(d => d !== dia.id)
                                } else {
                                  newHorarios[index].dias = [...bloque.dias, dia.id]
                                }
                                setHorariosProf(newHorarios)
                              }}
                              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                isSelected 
                                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
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
                        <Label className="text-slate-500 font-semibold uppercase text-xs">Hora Inicio</Label>
                        <Input 
                          type="time" 
                          value={bloque.hora_inicio} 
                          onChange={e => {
                            const newHorarios = [...horariosProf];
                            newHorarios[index].hora_inicio = e.target.value;
                            setHorariosProf(newHorarios)
                          }} 
                          className="h-11 rounded-xl bg-white" required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-500 font-semibold uppercase text-xs">Hora Fin</Label>
                        <Input 
                          type="time" 
                          value={bloque.hora_fin} 
                          onChange={e => {
                            const newHorarios = [...horariosProf];
                            newHorarios[index].hora_fin = e.target.value;
                            setHorariosProf(newHorarios)
                          }} 
                          className="h-11 rounded-xl bg-white" required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-500 font-semibold uppercase text-xs">Duración (min)</Label>
                        {!bloque.isCustomDuration ? (
                          <Select 
                            value={bloque.duracion.toString()} 
                            onValueChange={(v) => {
                              const newHorarios = [...horariosProf];
                              if (v === 'custom') {
                                newHorarios[index].isCustomDuration = true;
                              } else {
                                newHorarios[index].duracion = parseInt(v);
                              }
                              setHorariosProf(newHorarios)
                            }}
                          >
                            <SelectTrigger className="h-11 rounded-xl bg-white">
                              <SelectValue placeholder="Duración..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="15">15 min</SelectItem>
                              <SelectItem value="20">20 min</SelectItem>
                              <SelectItem value="30">30 min</SelectItem>
                              <SelectItem value="45">45 min</SelectItem>
                              <SelectItem value="60">1 hora</SelectItem>
                              <SelectItem value="custom" className="text-indigo-600 font-medium">Personalizado...</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Input 
                              type="number" 
                              min="1"
                              value={bloque.duracion || ''}
                              onChange={(e) => {
                                const newHorarios = [...horariosProf];
                                newHorarios[index].duracion = parseInt(e.target.value) || 0;
                                setHorariosProf(newHorarios)
                              }}
                              className="h-11 rounded-xl bg-white" 
                              placeholder="Min"
                            />
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                const newHorarios = [...horariosProf];
                                newHorarios[index].isCustomDuration = false;
                                newHorarios[index].duracion = 20;
                                setHorariosProf(newHorarios)
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-start">
                <Button
                  type="button"
                  variant="outline"
                  className="border-dashed border-2 border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 rounded-xl w-full md:w-auto"
                  onClick={() => {
                    setHorariosProf([...horariosProf, {
                      id: Date.now(),
                      dias: [],
                      hora_inicio: '08:00',
                      hora_fin: '16:00',
                      duracion: 20,
                      isCustomDuration: false
                    }])
                  }}
                >
                  + Añadir otro horario distinto
                </Button>
              </div>
            </div>
          )}

          {/* Danger Zone */}
          <Card className="p-8 rounded-3xl shadow-sm border border-rose-100 bg-rose-50/20 space-y-4">
            <h2 className="text-sm font-bold text-rose-950 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600" /> Zona de Peligro
            </h2>
            <p className="text-xs text-rose-700">
              Al eliminar a este profesional, se borrarán todos sus horarios de atención. Esta acción no se puede deshacer.
            </p>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 rounded-xl"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Eliminar Profesional
            </Button>
          </Card>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" asChild className="rounded-xl px-6 h-11 border-slate-200">
              <Link href="/dashboard/profesionales">Cancelar</Link>
            </Button>
            <Button 
              type="submit"
              disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-8 shadow-lg shadow-indigo-100 h-11"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Guardar Profesional y Horarios
            </Button>
          </div>
        </form>
      </div>
    </RolGuard>
  )
}
