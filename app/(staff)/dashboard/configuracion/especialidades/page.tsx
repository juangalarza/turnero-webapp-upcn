'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RolGuard } from '@/components/layout/RolGuard'
import { useToast } from '@/hooks/use-toast'
import { Stethoscope, Plus, Loader2, Save, X, Edit2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'

export default function EspecialidadesPage() {
  const { toast } = useToast()
  const supabase = createClient()
  
  const [especialidades, setEspecialidades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<{
    nombre: string;
    color: string;
    tipo_prestacion: 'turno' | 'cupo';
    activa: boolean;
  }>({
    nombre: '',
    color: '#3B82F6',
    tipo_prestacion: 'turno',
    activa: true
  })

  useEffect(() => {
    fetchEspecialidades()
  }, [])

  async function fetchEspecialidades() {
    try {
      const { data, error } = await supabase
        .from('especialidades')
        .select('*')
        .order('nombre')
      
      if (error) throw error
      if (data) setEspecialidades(data)
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
      if (editingId) {
        const { error } = await supabase
          .from('especialidades')
          .update(formData)
          .eq('id', editingId)

        if (error) throw error

        toast({
          title: "Prestación actualizada",
          description: `Se ha modificado ${formData.nombre} correctamente.`
        })
      } else {
        const { error } = await supabase
          .from('especialidades')
          .insert([formData])

        if (error) throw error

        toast({
          title: "Prestación creada",
          description: `Se ha registrado ${formData.nombre} correctamente.`
        })
      }
      
      setIsAdding(false)
      setEditingId(null)
      setFormData({ nombre: '', color: '#3B82F6', tipo_prestacion: 'turno', activa: true })
      fetchEspecialidades()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Estás seguro de que deseas eliminar la prestación ${name}? Esta acción podría afectar a todos los profesionales, turnos y clases asociados.`)) return

    try {
      const { error } = await supabase
        .from('especialidades')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({ title: "Prestación eliminada", description: `Se ha removido ${name} del sistema.` })
      setEspecialidades(especialidades.filter(e => e.id !== id))
      if (editingId === id) {
        setIsAdding(false)
        setEditingId(null)
        setFormData({ nombre: '', color: '#3B82F6', tipo_prestacion: 'turno', activa: true })
      }
    } catch (error: any) {
      toast({ title: "Error al eliminar", description: error.message, variant: "destructive" })
    }
  }

  async function toggleActivo(id: string, currentStatus: boolean) {
    const { error } = await supabase
      .from('especialidades')
      .update({ activa: !currentStatus })
      .eq('id', id)
      
    if (error) {
      toast({ title: "Error", description: "No se pudo actualizar.", variant: "destructive" })
    } else {
      toast({ title: "Actualizado", description: "El estado ha cambiado." })
      setEspecialidades(especialidades.map(e => e.id === id ? { ...e, activa: !currentStatus } : e))
    }
  }

  return (
    <RolGuard roles={['admin']}>
      <div className="space-y-6 animate-in fade-in duration-500 pb-10">
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Prestaciones y Especialidades</h1>
            <p className="text-slate-500">Administra los tipos de atención disponibles (por turno o por cupo).</p>
          </div>
          <Button onClick={() => {
            if (isAdding || editingId) {
              setIsAdding(false)
              setEditingId(null)
              setFormData({ nombre: '', color: '#3B82F6', tipo_prestacion: 'turno', activa: true })
            } else {
              setIsAdding(true)
            }
          }}>
            {isAdding || editingId ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
            {isAdding || editingId ? 'Cancelar' : 'Nueva Prestación'}
          </Button>
        </div>

        {(isAdding || editingId) && (
          <Card className="p-8 rounded-3xl shadow-xl border-indigo-100 bg-indigo-50/30">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-indigo-500" />
              {editingId ? 'Modificar Prestación' : 'Registrar Nueva Prestación'}
            </h2>
            <form onSubmit={handleSave} className="flex flex-col md:flex-row gap-6 items-end flex-wrap w-full">
              <div className="space-y-2 flex-1 min-w-[200px]">
                <label className="text-sm font-semibold text-slate-700 ml-1">Nombre de la Prestación *</label>
                <Input 
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  placeholder="Ej: Nutrición, Yoga..."
                  required
                  className="bg-white h-11 w-full"
                />
              </div>
              
              <div className="space-y-2 w-full md:w-[280px]">
                <label className="text-sm font-semibold text-slate-700 ml-1">Modalidad de Atención *</label>
                <select
                  value={formData.tipo_prestacion}
                  onChange={(e) => setFormData({...formData, tipo_prestacion: e.target.value as 'turno' | 'cupo'})}
                  required
                  className="w-full px-4 py-2 h-11 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="turno">Atención por Turno (1 a 1)</option>
                  <option value="cupo">Atención por Cupo (Clases)</option>
                </select>
              </div>

              <div className="space-y-2 w-full md:w-[100px]">
                <label className="text-sm font-semibold text-slate-700 ml-1">Color ID</label>
                <Input 
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                  className="bg-white h-11 cursor-pointer p-1"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-3 bg-white px-4 h-11 rounded-md border border-slate-200">
                  <Switch 
                    checked={formData.activa} 
                    onCheckedChange={(v) => setFormData({...formData, activa: v})} 
                  />
                  <span className="text-sm font-medium">Activa</span>
                </div>
              </div>

              <Button 
                type="submit"
                disabled={isSaving}
                className="h-11 px-8"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Guardar
              </Button>
            </form>
          </Card>
        )}

        <Card className="rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="py-5 px-6">Prestación / Especialidad</TableHead>
                <TableHead>Modalidad</TableHead>
                <TableHead>Identificador</TableHead>
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
              ) : especialidades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-slate-400">
                    No hay prestaciones registradas.
                  </TableCell>
                </TableRow>
              ) : (
                especialidades.map((e) => (
                  <TableRow key={e.id} className="group hover:bg-slate-50/50 transition-colors">
                    <TableCell className="py-4 px-6 font-bold text-slate-700 flex items-center gap-3">
                      <div className="h-4 w-4 rounded-full shadow-sm" style={{ backgroundColor: e.color }} />
                      {e.nombre}
                    </TableCell>
                    <TableCell>
                      {e.tipo_prestacion === 'cupo' ? (
                        <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-md">Por Cupo (Clases)</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 bg-sky-100 text-sky-700 text-xs font-bold rounded-md">Por Turno (1 a 1)</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">
                      {e.color}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={e.activa} 
                          onCheckedChange={() => toggleActivo(e.id, e.activa)} 
                        />
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${e.activa ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {e.activa ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                    </TableCell>
                     <TableCell className="text-right px-6">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-slate-400 hover:text-indigo-600 rounded-lg h-8 w-8 p-0"
                          onClick={() => {
                            setEditingId(e.id)
                            setIsAdding(true)
                            setFormData({
                              nombre: e.nombre,
                              color: e.color,
                              tipo_prestacion: e.tipo_prestacion,
                              activa: e.activa
                            })
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-slate-400 hover:text-rose-600 rounded-lg h-8 w-8 p-0"
                          onClick={() => handleDelete(e.id, e.nombre)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
