'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { RolGuard } from '@/components/layout/RolGuard'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Loader2, Save, Trash2, Clock, Activity, AlertTriangle, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'

export default function EditarClasePage({ params }: { params: { id: string } }) {
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [profesionales, setProfesionales] = useState<any[]>([])

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    profesional_id: '',
    dia_semana: '',
    hora_inicio: '',
    hora_fin: '',
    cupo_maximo: 10,
    activa: true
  })

  const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      // 1. Fetch professionals de cupo
      const { data: profs, error: profError } = await supabase
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

      if (profError) throw profError
      if (profs) setProfesionales(profs)

      // 2. Fetch class details
      const { data: clase, error: claseError } = await supabase
        .from('clases')
        .select('*')
        .eq('id', params.id)
        .single()

      if (claseError) throw claseError
      if (clase) {
        setFormData({
          nombre: clase.nombre || '',
          descripcion: clase.descripcion || '',
          profesional_id: clase.profesional_id || '',
          dia_semana: clase.dia_semana || '',
          hora_inicio: clase.hora_inicio ? clase.hora_inicio.slice(0, 5) : '',
          hora_fin: clase.hora_fin ? clase.hora_fin.slice(0, 5) : '',
          cupo_maximo: clase.cupo_maximo || 10,
          activa: clase.activa ?? true
        })
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
      router.push('/dashboard/clases')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.nombre || !formData.profesional_id || !formData.dia_semana || !formData.hora_inicio || !formData.hora_fin) {
      toast({ title: "Faltan datos", description: "Todos los campos con asterisco son requeridos.", variant: "destructive" })
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('clases')
        .update({
          nombre: formData.nombre,
          descripcion: formData.descripcion || null,
          profesional_id: formData.profesional_id,
          dia_semana: formData.dia_semana,
          hora_inicio: formData.hora_inicio,
          hora_fin: formData.hora_fin,
          cupo_maximo: parseInt(formData.cupo_maximo.toString()),
          activa: formData.activa
        })
        .eq('id', params.id)

      if (error) throw error

      toast({ title: "Clase actualizada", description: "La clase ha sido modificada con éxito." })
      router.push(`/dashboard/clases/${params.id}`)
    } catch (error: any) {
      toast({ title: "Error al actualizar", description: error.message, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm("¿Estás seguro de que deseas eliminar permanentemente esta clase? Se eliminarán todas las inscripciones asociadas.")) return

    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('clases')
        .delete()
        .eq('id', params.id)

      if (error) throw error

      toast({ title: "Clase eliminada", description: "La clase ha sido borrada del sistema." })
      router.push('/dashboard/clases')
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
    <RolGuard roles={['admin', 'recepcion']}>
      <div className="space-y-6 w-full pb-10">
        
        {/* Navigation */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="rounded-xl border border-slate-100 bg-white">
            <Link href={`/dashboard/clases/${params.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Editar Clase</h1>
            <p className="text-xs text-slate-500">Actualiza los datos de la clase de cupos.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-8 rounded-3xl shadow-sm border border-slate-100 bg-white space-y-6">
            <h2 className="text-sm font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-indigo-500" /> Detalles de la Clase
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-slate-500 font-semibold ml-1">Nombre de la Clase *</Label>
                <Input 
                  value={formData.nombre} 
                  onChange={e => setFormData({...formData, nombre: e.target.value})} 
                  placeholder="Ej: Yoga Avanzado, Aquagym..." 
                  required 
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-500 font-semibold ml-1">Instructor / Profesional *</Label>
                <Select 
                  value={formData.profesional_id}
                  onValueChange={(val) => setFormData({...formData, profesional_id: val})}
                >
                  <SelectTrigger className="h-11 rounded-xl bg-white">
                    <SelectValue placeholder="Selecciona un instructor" />
                  </SelectTrigger>
                  <SelectContent>
                    {profesionales.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.apellido}, {p.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-500 font-semibold ml-1">Día de la semana *</Label>
                <Select 
                  value={formData.dia_semana}
                  onValueChange={(val) => setFormData({...formData, dia_semana: val})}
                >
                  <SelectTrigger className="h-11 rounded-xl bg-white">
                    <SelectValue placeholder="Selecciona un día" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIAS_SEMANA.map(d => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-500 font-semibold ml-1">Hora Inicio *</Label>
                <Input 
                  type="time" 
                  value={formData.hora_inicio} 
                  onChange={e => setFormData({...formData, hora_inicio: e.target.value})} 
                  required 
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-500 font-semibold ml-1">Hora Fin *</Label>
                <Input 
                  type="time" 
                  value={formData.hora_fin} 
                  onChange={e => setFormData({...formData, hora_fin: e.target.value})} 
                  required 
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-slate-500 font-semibold ml-1">Cupo Máximo *</Label>
                <Input 
                  type="number" 
                  min="1"
                  value={formData.cupo_maximo} 
                  onChange={e => setFormData({...formData, cupo_maximo: parseInt(e.target.value) || 0})} 
                  required 
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-500 font-semibold ml-1">Estado de la Clase</Label>
                <div className="flex items-center gap-3 bg-slate-50 px-4 h-11 rounded-xl border border-slate-200">
                  <Switch 
                    checked={formData.activa} 
                    onCheckedChange={(v) => setFormData({...formData, activa: v})} 
                  />
                  <span className="text-sm font-medium">{formData.activa ? 'Activa' : 'Suspendida / Inactiva'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-500 font-semibold ml-1">Descripción / Notas</Label>
              <Textarea 
                value={formData.descripcion} 
                onChange={e => setFormData({...formData, descripcion: e.target.value})} 
                placeholder="Detalles sobre el nivel, vestimenta recomendada o materiales..." 
                className="rounded-xl min-h-[100px]"
              />
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className="p-8 rounded-3xl shadow-sm border border-rose-100 bg-rose-50/20 space-y-4">
            <h2 className="text-sm font-bold text-rose-950 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600" /> Zona de Peligro
            </h2>
            <p className="text-xs text-rose-700">
              Al eliminar esta clase se cancelarán y borrarán todas las inscripciones correspondientes. Esta acción no se puede revertir.
            </p>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 rounded-xl"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Eliminar Clase Permanentemente
            </Button>
          </Card>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" asChild className="rounded-xl px-6 h-11 border-slate-200">
              <Link href={`/dashboard/clases/${params.id}`}>Cancelar</Link>
            </Button>
            <Button 
              type="submit"
              disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-8 shadow-lg shadow-indigo-100 h-11"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Guardar Cambios
            </Button>
          </div>
        </form>
      </div>
    </RolGuard>
  )
}
