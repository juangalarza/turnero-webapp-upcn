'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RolGuard } from '@/components/layout/RolGuard'
import { useToast } from '@/hooks/use-toast'
import { Activity, Clock, Loader2, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'

export default function NuevaClasePage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  
  const [profesionales, setProfesionales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  type HorarioBloque = {
    id: number;
    dias_semana: string[];
    hora_inicio: string;
    hora_fin: string;
    cupo_maximo: number;
  }

  const [horarios, setHorarios] = useState<HorarioBloque[]>([{
    id: Date.now(),
    dias_semana: [],
    hora_inicio: '10:00',
    hora_fin: '11:00',
    cupo_maximo: 10
  }])

  const [formData, setFormData] = useState({
    profesional_id: '',
    nombre: '',
    descripcion: '',
    color: '#10b981',
    activa: true
  })

  useEffect(() => {
    fetchProfesionalesCupo()
  }, [])

  // Buscar solo profesionales que tengan una "prestación por cupo"
  async function fetchProfesionalesCupo() {
    try {
      const { data, error } = await supabase
        .from('profesionales')
        .select(`
          id,
          nombre,
          apellido,
          especialidades!inner(
            nombre,
            tipo_prestacion
          )
        `)
        .eq('activo', true)
        .eq('especialidades.tipo_prestacion', 'cupo')
        .order('nombre')
      
      if (error) throw error
      if (data) setProfesionales(data)
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)

    try {
      if (horarios.some(h => h.dias_semana.length === 0)) {
        toast({ title: "Faltan Días", description: "Todos los horarios deben tener al menos un día seleccionado.", variant: "destructive" })
        setIsSaving(false)
        return
      }

      const inserts = horarios.flatMap(bloque => 
        bloque.dias_semana.map(dia => ({
          profesional_id: formData.profesional_id,
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          dia_semana: dia,
          hora_inicio: bloque.hora_inicio,
          hora_fin: bloque.hora_fin,
          cupo_maximo: parseInt(bloque.cupo_maximo.toString()),
          activa: formData.activa
        }))
      )

      const { error } = await supabase
        .from('clases')
        .insert(inserts)

      if (error) throw error

      toast({
        title: "Clase creada",
        description: `Se ha registrado ${formData.nombre} correctamente.`
      })
      
      router.push('/dashboard/clases')
      router.refresh()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
      setIsSaving(false)
    }
  }

  return (
    <RolGuard roles={['admin', 'recepcion']}>
      <div className="w-full h-full pb-10 space-y-6 animate-in fade-in duration-500">
        
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-slate-800">Nueva Clase / Actividad</h1>
          <p className="text-slate-500 text-sm">Configura una nueva actividad por cupos regulares.</p>
        </div>

        <Card className="p-8 rounded-3xl shadow-xl border-emerald-100 bg-white">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          ) : profesionales.length === 0 ? (
            <div className="text-center py-10 space-y-4">
              <Activity className="h-12 w-12 text-slate-300 mx-auto" />
              <h3 className="text-lg font-bold text-slate-700">No hay instructores disponibles</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                Para crear una clase, primero necesitas registrar un profesional asignado a una Prestación configurada como "Por Cupo (Clases)".
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/dashboard/configuracion/especialidades">
                  Configurar Prestaciones
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Instructor / Profesional *</label>
                  <select
                    value={formData.profesional_id}
                    onChange={(e) => setFormData({...formData, profesional_id: e.target.value})}
                    required
                    className="w-full px-4 py-2 h-11 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Seleccionar instructor...</option>
                    {profesionales.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} {p.apellido} ({p.especialidades?.nombre})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Nombre de la Clase *</label>
                  <Input 
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    placeholder="Ej: Yoga Inicial, Pilates Reformer..."
                    required
                    className="bg-slate-50 h-11 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Descripción corta</label>
                <Textarea 
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  placeholder="Detalles sobre la clase, recomendaciones, etc."
                  className="bg-slate-50 rounded-xl resize-none h-20"
                />
              </div>

              <div className="space-y-4">
                {horarios.map((bloque, index) => (
                  <div key={bloque.id} className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-sm relative">
                    {horarios.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 text-slate-400 hover:text-rose-500"
                        onClick={() => setHorarios(horarios.filter(h => h.id !== bloque.id))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Clock className="h-4 w-4" /> Horario {index + 1}
                    </h3>
                    
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                      {/* Días */}
                      <div className="space-y-3">
                        <label className="text-slate-500 font-semibold text-xs uppercase">Días de la semana *</label>
                        <div className="flex flex-wrap gap-2">
                          {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(dia => {
                            const isSelected = bloque.dias_semana.includes(dia)
                            return (
                              <button
                                key={dia}
                                type="button"
                                onClick={() => {
                                  const newHorarios = [...horarios];
                                  if (isSelected) {
                                    newHorarios[index].dias_semana = bloque.dias_semana.filter(d => d !== dia)
                                  } else {
                                    newHorarios[index].dias_semana = [...bloque.dias_semana, dia]
                                  }
                                  setHorarios(newHorarios)
                                }}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                  isSelected 
                                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' 
                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                                }`}
                              >
                                {dia}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Tiempos */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-slate-500 font-semibold text-xs uppercase">Hora Inicio *</label>
                          <Input 
                            type="time" 
                            value={bloque.hora_inicio} 
                            onChange={e => {
                              const newHorarios = [...horarios];
                              newHorarios[index].hora_inicio = e.target.value;
                              setHorarios(newHorarios)
                            }} 
                            className="h-11 rounded-xl bg-white" 
                            required 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-slate-500 font-semibold text-xs uppercase">Hora Fin *</label>
                          <Input 
                            type="time" 
                            value={bloque.hora_fin} 
                            onChange={e => {
                              const newHorarios = [...horarios];
                              newHorarios[index].hora_fin = e.target.value;
                              setHorarios(newHorarios)
                            }} 
                            className="h-11 rounded-xl bg-white" 
                            required 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-slate-500 font-semibold text-xs uppercase">Cupo Máximo *</label>
                          <Input 
                            type="number"
                            min="1"
                            value={bloque.cupo_maximo}
                            onChange={(e) => {
                              const newHorarios = [...horarios];
                              newHorarios[index].cupo_maximo = parseInt(e.target.value) || 1;
                              setHorarios(newHorarios)
                            }}
                            className="h-11 rounded-xl bg-white" 
                            required 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex justify-start">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-dashed border-2 border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 rounded-xl w-full md:w-auto"
                    onClick={() => {
                      setHorarios([...horarios, {
                        id: Date.now(),
                        dias_semana: [],
                        hora_inicio: '10:00',
                        hora_fin: '11:00',
                        cupo_maximo: 10
                      }])
                    }}
                  >
                    + Añadir otro horario distinto
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Color (Calendario)</label>
                  <Input 
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                    className="bg-slate-50 h-11 rounded-xl cursor-pointer p-1 w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1 invisible">Estado</label>
                  <div className="flex items-center gap-3 bg-slate-50 px-4 h-11 rounded-xl border border-slate-200">
                    <Switch 
                      checked={formData.activa} 
                      onCheckedChange={(v) => setFormData({...formData, activa: v})} 
                    />
                    <span className="text-sm font-medium text-slate-700">Clase Activa</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  type="submit"
                  disabled={isSaving || !formData.profesional_id}
                  className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-200"
                >
                  {isSaving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                  Guardar Clase
                </Button>
              </div>

            </form>
          )}
        </Card>
      </div>
    </RolGuard>
  )
}
