'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { RolGuard } from '@/components/layout/RolGuard'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Loader2, Save, Trash2, User, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export default function EditarAfiliadoPage({ params }: { params: { id: string } }) {
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    numero_afiliado: '',
    telefono: '',
    email: '',
    observaciones: ''
  })

  useEffect(() => {
    fetchAfiliado()
  }, [])

  async function fetchAfiliado() {
    try {
      const { data, error } = await supabase
        .from('afiliados')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      if (data) {
        setFormData({
          nombre: data.nombre || '',
          apellido: data.apellido || '',
          dni: data.dni || '',
          numero_afiliado: data.numero_afiliado || '',
          telefono: data.telefono || '',
          email: data.email || '',
          observaciones: data.observaciones || ''
        })
      }
    } catch (error: any) {
      toast({ title: "Error", description: "No se pudo cargar la información del afiliado.", variant: "destructive" })
      router.push('/dashboard/afiliados')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.dni || !formData.nombre || !formData.apellido) {
      toast({ title: "Faltan datos", description: "DNI, Nombre y Apellido son obligatorios.", variant: "destructive" })
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('afiliados')
        .update({
          nombre: formData.nombre,
          apellido: formData.apellido,
          dni: formData.dni,
          numero_afiliado: formData.numero_afiliado || null,
          telefono: formData.telefono || null,
          email: formData.email || null,
          observaciones: formData.observaciones || null
        })
        .eq('id', params.id)

      if (error) throw error

      toast({ title: "Afiliado actualizado", description: "Los datos se guardaron correctamente." })
      router.push('/dashboard/afiliados')
    } catch (error: any) {
      toast({ title: "Error al actualizar", description: error.message, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm("¿Estás seguro de que deseas eliminar permanentemente a este afiliado? Esta acción no se puede deshacer y cancelará sus turnos y clases activas.")) return

    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('afiliados')
        .delete()
        .eq('id', params.id)

      if (error) throw error

      toast({ title: "Afiliado eliminado", description: "El registro ha sido removido del sistema." })
      router.push('/dashboard/afiliados')
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
        
        {/* Breadcrumb / Back button */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="rounded-xl border border-slate-100 bg-white">
            <Link href="/dashboard/afiliados">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Editar Afiliado</h1>
            <p className="text-xs text-slate-500">Modifica la información o elimina el registro.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6 bg-white">
            <h2 className="text-sm font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-indigo-500" /> Datos Generales
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-slate-500 font-semibold ml-1">Nombre *</Label>
                <Input 
                  value={formData.nombre} 
                  onChange={e => setFormData({...formData, nombre: e.target.value})} 
                  placeholder="Ej: Juan" 
                  required 
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-500 font-semibold ml-1">Apellido *</Label>
                <Input 
                  value={formData.apellido} 
                  onChange={e => setFormData({...formData, apellido: e.target.value})} 
                  placeholder="Ej: Pérez" 
                  required 
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-slate-500 font-semibold ml-1">DNI *</Label>
                <Input 
                  value={formData.dni} 
                  onChange={e => setFormData({...formData, dni: e.target.value.replace(/\D/g, '')})} 
                  placeholder="Ej: 34123456" 
                  required 
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-500 font-semibold ml-1">Nº de Afiliado</Label>
                <Input 
                  value={formData.numero_afiliado} 
                  onChange={e => setFormData({...formData, numero_afiliado: e.target.value})} 
                  placeholder="Ej: AR-99887" 
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-slate-500 font-semibold ml-1">Teléfono (WhatsApp)</Label>
                <Input 
                  value={formData.telefono} 
                  onChange={e => setFormData({...formData, telefono: e.target.value})} 
                  placeholder="Ej: 2644123456" 
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-500 font-semibold ml-1">Correo Electrónico</Label>
                <Input 
                  type="email"
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  placeholder="Ej: juan@mail.com" 
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-500 font-semibold ml-1">Observaciones / Historial Clínico Corto</Label>
              <Input 
                value={formData.observaciones} 
                onChange={e => setFormData({...formData, observaciones: e.target.value})} 
                placeholder="Ej: Paciente hipertenso, diabético..." 
                className="h-11 rounded-xl"
              />
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className="p-8 rounded-3xl shadow-sm border border-rose-100 bg-rose-50/20 space-y-4">
            <h2 className="text-sm font-bold text-rose-950 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600" /> Zona de Peligro
            </h2>
            <p className="text-xs text-rose-700">
              Al eliminar a este afiliado, se borrarán todos sus registros, historial de turnos y clases. Esta acción no se puede revertir.
            </p>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 rounded-xl"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Eliminar Afiliado de UPCN
            </Button>
          </Card>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" asChild className="rounded-xl px-6 h-11 border-slate-200">
              <Link href="/dashboard/afiliados">Cancelar</Link>
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
