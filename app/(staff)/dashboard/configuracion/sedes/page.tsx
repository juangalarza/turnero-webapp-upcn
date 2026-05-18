'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RolGuard } from '@/components/layout/RolGuard'
import { useToast } from '@/hooks/use-toast'
import { Building2, Plus, Loader2, Save, X, Edit2, Phone, User } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from 'next/link'

export default function SedesPage() {
  const { toast } = useToast()
  const supabase = createClient()
  
  const [sedes, setSedes] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    responsable_id: 'none',
    activa: true
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [sedesRes, staffRes] = await Promise.all([
        supabase.from('sedes').select('*, responsable:staff_profiles!responsable_id(nombre, apellido)').order('nombre'),
        supabase.from('staff_profiles').select('id, nombre, apellido').order('apellido')
      ])
      
      if (sedesRes.error) throw sedesRes.error
      if (staffRes.error) throw staffRes.error
      
      setSedes(sedesRes.data || [])
      setStaff(staffRes.data || [])
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
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
        .insert([payload])

      if (error) throw error

      toast({
        title: "Sede creada",
        description: `Se ha registrado ${formData.nombre} correctamente.`
      })
      
      setIsAdding(false)
      setFormData({ nombre: '', direccion: '', telefono: '', responsable_id: 'none', activa: true })
      fetchData()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  async function toggleActivo(id: string, currentStatus: boolean) {
    const { error } = await supabase
      .from('sedes')
      .update({ activa: !currentStatus })
      .eq('id', id)
      
    if (error) {
      toast({ title: "Error", description: "No se pudo actualizar.", variant: "destructive" })
    } else {
      toast({ title: "Actualizado", description: "El estado ha cambiado." })
      setSedes(sedes.map(s => s.id === id ? { ...s, activa: !currentStatus } : s))
    }
  }

  function createSlug(name: string) {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
  }

  return (
    <RolGuard roles={['admin']}>
      <div className="space-y-6 animate-in fade-in duration-500 pb-10">
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Sedes y Consultorios</h1>
            <p className="text-slate-500">Administra las ubicaciones físicas de atención.</p>
          </div>
          <Button onClick={() => setIsAdding(!isAdding)}>
            {isAdding ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
            {isAdding ? 'Cancelar' : 'Nueva Sede'}
          </Button>
        </div>

        {isAdding && (
          <Card className="p-8 rounded-3xl shadow-xl border-emerald-100 bg-emerald-50/30">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-500" />
              Registrar Nueva Sede
            </h2>
            <form onSubmit={handleAdd} className="space-y-6">
              
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
                    <Link href="/dashboard/configuracion/staff" className="text-xs text-sky-600 hover:underline">
                      + Crear Usuario
                    </Link>
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

              <div className="flex items-center justify-between border-t border-emerald-100/50 pt-6">
                <div className="flex items-center gap-3 bg-white px-4 h-11 rounded-md border border-slate-200">
                  <Switch 
                    checked={formData.activa} 
                    onCheckedChange={(v) => setFormData({...formData, activa: v})} 
                  />
                  <span className="text-sm font-medium">Activa</span>
                </div>
                
                <Button 
                  type="submit"
                  disabled={isSaving}
                  className="h-11 px-8 bg-emerald-600 hover:bg-emerald-700"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Guardar Sede
                </Button>
              </div>
            </form>
          </Card>
        )}

        <Card className="rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="py-5 px-6">Sede</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right px-6">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-500" />
                  </TableCell>
                </TableRow>
              ) : sedes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-slate-400">
                    No hay sedes registradas.
                  </TableCell>
                </TableRow>
              ) : (
                sedes.map((s) => (
                  <TableRow key={s.id} className="group hover:bg-slate-50/50 transition-colors">
                    <TableCell className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700">{s.nombre}</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          {s.direccion || 'Sin dirección registrada'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {s.telefono ? (
                        <span className="text-sm text-slate-600 flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {s.telefono}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {s.responsable ? (
                        <span className="text-sm text-slate-600 flex items-center gap-1">
                          <User className="h-3 w-3" /> {s.responsable.nombre} {s.responsable.apellido}
                        </span>
                      ) : <span className="text-xs text-slate-400">No asignado</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={s.activa} 
                          onCheckedChange={() => toggleActivo(s.id, s.activa)} 
                        />
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${s.activa ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {s.activa ? 'Operativa' : 'Cerrada'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <Link href={`/dashboard/configuracion/sedes/${createSlug(s.nombre)}`}>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-emerald-600">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </Link>
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
