'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RolGuard } from '@/components/layout/RolGuard'
import { useToast } from '@/hooks/use-toast'
import { User, Plus, Search, Loader2, Edit2, Trash2, Phone, Mail, FileText, ArrowRight, UserPlus, X, Save } from 'lucide-react'
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
import Link from 'next/link'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

export default function AfiliadosPage() {
  const { toast } = useToast()
  const supabase = createClient()
  
  const [afiliados, setAfiliados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Nuevo afiliado form state
  const [newAfiliado, setNewAfiliado] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    numero_afiliado: '',
    telefono: '',
    email: '',
    observaciones: ''
  })

  useEffect(() => {
    fetchAfiliados()
  }, [])

  async function fetchAfiliados() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('afiliados')
        .select('*')
        .order('apellido', { ascending: true })
      
      if (error) throw error
      if (data) setAfiliados(data)
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAfiliado.dni || !newAfiliado.nombre || !newAfiliado.apellido) {
      toast({ title: "Datos incompletos", description: "DNI, Nombre y Apellido son obligatorios.", variant: "destructive" })
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('afiliados')
        .insert([{
          dni: newAfiliado.dni,
          nombre: newAfiliado.nombre,
          apellido: newAfiliado.apellido,
          numero_afiliado: newAfiliado.numero_afiliado || null,
          telefono: newAfiliado.telefono || null,
          email: newAfiliado.email || null,
          observaciones: newAfiliado.observaciones || null
        }])

      if (error) throw error

      toast({ title: "Afiliado registrado", description: `Se ha guardado a ${newAfiliado.apellido}, ${newAfiliado.nombre} correctamente.` })
      setIsAdding(false)
      setNewAfiliado({ nombre: '', apellido: '', dni: '', numero_afiliado: '', telefono: '', email: '', observaciones: '' })
      fetchAfiliados()
    } catch (error: any) {
      toast({ title: "Error al guardar", description: error.message, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Estás seguro de que deseas eliminar al afiliado ${name}? Esta acción no se puede deshacer y podría afectar sus turnos activos.`)) return

    try {
      const { error } = await supabase
        .from('afiliados')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({ title: "Afiliado eliminado", description: `Se ha removido a ${name} de los registros.` })
      setAfiliados(afiliados.filter(a => a.id !== id))
    } catch (error: any) {
      toast({ title: "Error al eliminar", description: error.message, variant: "destructive" })
    }
  }

  // Filtrado de afiliados en el cliente
  const filteredAfiliados = afiliados.filter(a => {
    const query = searchQuery.toLowerCase()
    return (
      a.nombre?.toLowerCase().includes(query) ||
      a.apellido?.toLowerCase().includes(query) ||
      a.dni?.includes(query) ||
      a.numero_afiliado?.toLowerCase().includes(query)
    )
  })

  return (
    <RolGuard roles={['admin', 'recepcion']}>
      <div className="space-y-6 animate-in fade-in duration-500 pb-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Padrón de Afiliados</h1>
            <p className="text-slate-500 text-sm">Administra la base de afiliados de UPCN San Juan.</p>
          </div>
          
          <Dialog open={isAdding} onOpenChange={setIsAdding}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-100 px-5">
                <Plus className="mr-2 h-4 w-4" /> Registrar Afiliado
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-indigo-500" /> Registrar Nuevo Afiliado
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-500">Nombre *</Label>
                    <Input 
                      value={newAfiliado.nombre} 
                      onChange={e => setNewAfiliado({...newAfiliado, nombre: e.target.value})} 
                      placeholder="Ej: Juan" 
                      required 
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-500">Apellido *</Label>
                    <Input 
                      value={newAfiliado.apellido} 
                      onChange={e => setNewAfiliado({...newAfiliado, apellido: e.target.value})} 
                      placeholder="Ej: Pérez" 
                      required 
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-500">DNI (Sin puntos) *</Label>
                    <Input 
                      value={newAfiliado.dni} 
                      onChange={e => setNewAfiliado({...newAfiliado, dni: e.target.value.replace(/\D/g, '')})} 
                      placeholder="Ej: 34123456" 
                      required 
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-500">Nº de Afiliado (Opcional)</Label>
                    <Input 
                      value={newAfiliado.numero_afiliado} 
                      onChange={e => setNewAfiliado({...newAfiliado, numero_afiliado: e.target.value})} 
                      placeholder="Ej: AR-99887" 
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-500">Teléfono (WhatsApp)</Label>
                    <Input 
                      value={newAfiliado.telefono} 
                      onChange={e => setNewAfiliado({...newAfiliado, telefono: e.target.value})} 
                      placeholder="Ej: 2644123456" 
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-500">Correo Electrónico</Label>
                    <Input 
                      type="email"
                      value={newAfiliado.email} 
                      onChange={e => setNewAfiliado({...newAfiliado, email: e.target.value})} 
                      placeholder="Ej: juan@mail.com" 
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-500">Observaciones</Label>
                  <Input 
                    value={newAfiliado.observaciones} 
                    onChange={e => setNewAfiliado({...newAfiliado, observaciones: e.target.value})} 
                    placeholder="Notas o datos médicos importantes" 
                    className="rounded-xl"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsAdding(false)} className="rounded-xl">Cancelar</Button>
                  <Button type="submit" disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Guardar Afiliado
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Buscador */}
        <Card className="p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
          <Search className="h-5 w-5 text-slate-400" />
          <Input 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar afiliado por Nombre, Apellido, DNI o Número de Afiliado..."
            className="border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-10 text-sm flex-1"
          />
          {searchQuery && (
            <Button variant="ghost" size="icon" onClick={() => setSearchQuery('')} className="rounded-full h-8 w-8 text-slate-400">
              <X className="h-4 w-4" />
            </Button>
          )}
        </Card>

        {/* Tabla */}
        <Card className="rounded-3xl shadow-sm border border-slate-100 overflow-hidden bg-white">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="py-5 px-6">Afiliado</TableHead>
                <TableHead>DNI</TableHead>
                <TableHead>Nº Afiliado</TableHead>
                <TableHead>Contacto</TableHead>
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
              ) : filteredAfiliados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-slate-400">
                    No se encontraron afiliados.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAfiliados.map((a) => (
                  <TableRow key={a.id} className="group hover:bg-slate-50/50 transition-colors">
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                          {a.nombre?.charAt(0)}{a.apellido?.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700">{a.apellido}, {a.nombre}</span>
                          {a.observaciones && (
                            <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-full w-fit mt-1 flex items-center gap-1">
                              <FileText className="h-3 w-3" /> {a.observaciones.slice(0, 30)}{a.observaciones.length > 30 ? '...' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-slate-600">
                      {a.dni}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">
                      {a.numero_afiliado || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-[11px]">
                        {a.telefono && (
                          <span className="text-slate-500 flex items-center gap-1 font-semibold">
                            <Phone className="h-3 w-3 text-slate-400" /> {a.telefono}
                          </span>
                        )}
                        {a.email && (
                          <span className="text-slate-400 flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {a.email}
                          </span>
                        )}
                        {!a.telefono && !a.email && <span className="text-slate-300">-</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild className="text-slate-400 hover:text-indigo-600 rounded-lg">
                          <Link href={`/dashboard/afiliados/${a.id}/editar`}>
                            <Edit2 className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(a.id, `${a.apellido}, ${a.nombre}`)}
                          className="text-slate-400 hover:text-rose-600 rounded-lg"
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
