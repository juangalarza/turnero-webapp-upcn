'use client'

import { useState, useEffect } from 'react'
import { 
  UserPlus, 
  Users, 
  Shield, 
  Mail, 
  Lock, 
  Phone, 
  Fingerprint, 
  MapPin, 
  Save, 
  X,
  Loader2,
  Trash2,
  UserCheck,
  UserCog,
  Plus
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { RolGuard } from '@/components/layout/RolGuard'

export default function StaffManagementPage() {
  const { toast } = useToast()
  const [staff, setStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    rol: 'recepcion',
    dni: '',
    telefono: '',
    sede_id: ''
  })

  useEffect(() => {
    fetchStaff()
  }, [])

  async function fetchStaff() {
    try {
      const res = await fetch('/api/staff')
      const data = await res.json()
      if (res.ok) setStaff(data)
    } catch (error) {
      console.error('Error fetching staff:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddStaff(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)

    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (res.ok) {
        toast({
          title: "Usuario creado",
          description: `Se ha registrado a ${formData.nombre} ${formData.apellido} correctamente.`
        })
        setIsAdding(false)
        setFormData({
          nombre: '',
          apellido: '',
          email: '',
          password: '',
          rol: 'recepcion',
          dni: '',
          telefono: '',
          sede_id: ''
        })
        fetchStaff()
      } else {
        throw new Error(data.error || 'Error al crear usuario')
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <RolGuard roles={['admin']}>
      <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestión de Staff</h1>
          <p className="text-slate-500">Administra los usuarios del sistema y sus permisos.</p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {isAdding ? 'Cancelar' : 'Nuevo Usuario'}
        </Button>
      </div>

      {isAdding && (
        <Card className="p-8 rounded-3xl shadow-xl border-sky-100 bg-sky-50/30">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <UserCog className="h-5 w-5 text-sky-500" />
            Registrar Nuevo Miembro del Staff
          </h2>
          <form onSubmit={handleAddStaff} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Nombre</label>
              <Input 
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                placeholder="Nombre"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Apellido</label>
              <Input 
                value={formData.apellido}
                onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                placeholder="Apellido"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Rol</label>
              <select 
                value={formData.rol}
                onChange={(e) => setFormData({...formData, rol: e.target.value})}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition-all h-10"
                required
              >
                <option value="recepcion">Recepción / Usuario</option>
                <option value="admin">Administrador</option>
                <option value="profesional">Profesional</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Email (Acceso)</label>
              <Input 
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="email@upcn.org"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Contraseña Inicial</label>
              <Input 
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="••••••••"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">DNI</label>
              <Input 
                value={formData.dni}
                onChange={(e) => setFormData({...formData, dni: e.target.value})}
                placeholder="DNI"
              />
            </div>
            <div className="col-span-1 md:col-span-3 flex justify-end gap-3 mt-2">
              <Button 
                type="submit"
                disabled={isSaving}
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl px-8 shadow-lg shadow-sky-200 h-auto py-3"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Crear Usuario Staff
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="py-5 px-6">Miembro</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Sede</TableHead>
              <TableHead className="text-right px-6">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-sky-500" />
                </TableCell>
              </TableRow>
            ) : staff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-400">
                  No hay usuarios registrados.
                </TableCell>
              </TableRow>
            ) : (
              staff.map((member) => (
                <TableRow key={member.id} className="group hover:bg-slate-50/50 transition-colors">
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center font-bold text-xs">
                        {member.nombre?.charAt(0)}{member.apellido?.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700">{member.nombre} {member.apellido}</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">{member.rol}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-slate-500">{member.username}</TableCell>
                  <TableCell>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      member.rol === 'admin' ? 'bg-amber-100 text-amber-600' : 
                      member.rol === 'profesional' ? 'bg-indigo-100 text-indigo-600' : 
                      'bg-sky-100 text-sky-600'
                    }`}>
                      {member.rol}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {member.email}</span>
                      {member.telefono && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {member.telefono}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {member.sedes?.nombre || 'No asignada'}
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-sky-600 rounded-lg">
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
