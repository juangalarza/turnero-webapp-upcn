'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RolGuard } from '@/components/layout/RolGuard'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { Building2, Loader2, Save, ArrowLeft, Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from 'next/link'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function EditSedePage({ params }: { params: { slug: string } }) {
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [staff, setStaff] = useState<any[]>([])
  const [sedeId, setSedeId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    responsable_id: 'none',
    activa: true
  })

  function createSlug(name: string) {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
  }

  useEffect(() => {
    fetchData()
  }, [params.slug])

  async function fetchData() {
    try {
      const [sedesRes, staffRes] = await Promise.all([
        supabase.from('sedes').select('*'),
        supabase.from('staff_profiles').select('id, nombre, apellido').order('apellido')
      ])
      
      if (sedesRes.error) throw sedesRes.error
      if (staffRes.error) throw staffRes.error
      
      // Encontrar la sede cuyo slug coincide con el parámetro
      const sede = sedesRes.data.find(s => createSlug(s.nombre) === params.slug)
      
      if (!sede) {
        toast({ title: "No encontrada", description: "La sede solicitada no existe.", variant: "destructive" })
        router.push('/dashboard/configuracion/sedes')
        return
      }

      setSedeId(sede.id)
      setFormData({
        nombre: sede.nombre,
        direccion: sede.direccion || '',
        telefono: sede.telefono || '',
        responsable_id: sede.responsable_id || 'none',
        activa: sede.activa ?? false
      })
      
      setStaff(staffRes.data || [])
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
      router.push('/dashboard/configuracion/sedes')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!sedeId) return
    setIsSaving(true)

    const payload = {
      nombre: formData.nombre,
      direccion: formData.direccion,
      telefono: formData.telefono,
      responsable_id: formData.responsable_id === 'none' ? null : formData.responsable_id,
      activa: formData.activa
    }

    try {
      const { error } = await supabase
        .from('sedes')
        .update(payload)
        .eq('id', sedeId)

      if (error) throw error

      toast({
        title: "Sede actualizada",
        description: `Los datos de ${formData.nombre} han sido guardados.`
      })
      router.push('/dashboard/configuracion/sedes')
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!sedeId) return
    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('sedes')
        .delete()
        .eq('id', sedeId)

      if (error) throw error

      toast({
        title: "Sede eliminada",
        description: "La sede ha sido borrada de forma permanente."
      })
      router.push('/dashboard/configuracion/sedes')
    } catch (error: any) {
      toast({ 
        title: "No se pudo eliminar", 
        description: "Es probable que haya profesionales o turnos asociados a esta sede. Te recomendamos desactivarla en lugar de eliminarla.", 
        variant: "destructive" 
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <RolGuard roles={['admin']}>
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
        
        <div className="flex items-center gap-4">
          <Link href="/dashboard/configuracion/sedes">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Editar Sede</h1>
            <p className="text-slate-500">Modifica los detalles o el estado de operación de la sede.</p>
          </div>
        </div>

        <Card className="p-8 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-500" />
            Datos de la Sede
          </h2>
          
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Nombre de la Sede *</label>
                <Input 
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  placeholder="Ej: Sede Central UPCN"
                  required
                  className="bg-white h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Dirección Física</label>
                <Input 
                  value={formData.direccion}
                  onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                  placeholder="Ej: Sarmiento 123 Sur"
                  className="bg-white h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Teléfono</label>
                <Input 
                  value={formData.telefono}
                  onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                  placeholder="Ej: 264 123 4567"
                  className="bg-white h-11"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Responsable / Encargado</label>
                </div>
                <Select value={formData.responsable_id} onValueChange={(val) => setFormData({...formData, responsable_id: val})}>
                  <SelectTrigger className="bg-white h-11">
                    <SelectValue placeholder="Seleccionar encargado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin asignar</SelectItem>
                    {staff.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.apellido}, {user.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
              <Switch 
                checked={formData.activa} 
                onCheckedChange={(v) => setFormData({...formData, activa: v})} 
              />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-emerald-900">
                  {formData.activa ? 'Sede Operativa' : 'Sede Cerrada Temporalmente'}
                </span>
                <span className="text-xs text-emerald-700/80">
                  {formData.activa 
                    ? 'La sede se mostrará en los selectores y permitirá asignar turnos.' 
                    : 'La sede no aparecerá en las opciones de nuevos turnos ni afiliaciones.'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between border-t border-slate-100 pt-6 mt-6">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" type="button" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Dar de baja (Eliminar)
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="h-5 w-5" />
                      ¿Estás completamente seguro?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción intentará eliminar la sede de la base de datos de forma permanente. Si esta sede ya tiene turnos médicos o profesionales asignados, el sistema bloqueará la eliminación por seguridad. En ese caso, deberías simplemente "desactivar" la sede usando el interruptor.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
                      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Sí, eliminar sede
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button 
                type="submit"
                disabled={isSaving}
                className="h-11 px-8 bg-emerald-600 hover:bg-emerald-700"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Guardar Cambios
              </Button>
            </div>
          </form>
        </Card>

      </div>
    </RolGuard>
  )
}
