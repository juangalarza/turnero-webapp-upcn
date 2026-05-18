'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Search, UserPlus, UserCheck, AlertCircle, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Database } from '@/types/database'

type Afiliado = Database['public']['Tables']['afiliados']['Row']

interface BuscadorAfiliadoProps {
  onSelect: (afiliado: Afiliado) => void
}

export function BuscadorAfiliado({ onSelect }: BuscadorAfiliadoProps) {
  const [dni, setDni] = useState('')
  const [loading, setLoading] = useState(false)
  const [afiliado, setAfiliado] = useState<Afiliado | null>(null)
  const [notFound, setNotFound] = useState(false)
  
  // Create form state
  const [isCreating, setIsCreating] = useState(false)
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [telefono, setTelefono] = useState('')
  const { toast } = useToast()
  
  const supabase = createClient()

  const handleSearch = async () => {
    if (!dni) return
    setLoading(true)
    setNotFound(false)
    setAfiliado(null)
    setIsCreating(false)

    const { data, error } = await supabase
      .from('afiliados')
      .select('*')
      .eq('dni', dni)
      .maybeSingle()

    setLoading(false)

    if (error) {
      console.error('Error buscando afiliado:', error)
      return
    }

    if (data) {
      setAfiliado(data)
    } else {
      setNotFound(true)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleCreate = async () => {
    if (!dni || !nombre || !apellido) {
      toast({ title: "Faltan datos", description: "DNI, Nombre y Apellido son obligatorios.", variant: "destructive" })
      return
    }
    
    setLoading(true)
    const { data, error } = await supabase
      .from('afiliados')
      .insert({ dni, nombre, apellido, telefono: telefono || null })
      .select()
      .single()
      
    setLoading(false)
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } else if (data) {
      toast({ title: "Afiliado registrado", description: "Se ha guardado exitosamente." })
      setAfiliado(data)
      setNotFound(false)
      setIsCreating(false)
      onSelect(data) // Auto-select on create
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por DNI..."
            value={dni}
            onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
            onKeyDown={handleKeyDown}
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch} disabled={loading} className="bg-slate-800 hover:bg-slate-700">
          {loading && !isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Buscar'}
        </Button>
      </div>

      {afiliado && !isCreating && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="flex flex-col gap-4 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                <UserCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-emerald-900">{(afiliado.nombre as string)} {(afiliado.apellido as string)}</p>
                <p className="text-sm text-emerald-700">DNI: {(afiliado.dni as string)}</p>
              </div>
            </div>
            <Button onClick={() => onSelect(afiliado)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
              Seleccionar Afiliado
            </Button>
          </CardContent>
        </Card>
      )}

      {notFound && !isCreating && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
            <AlertCircle className="h-8 w-8 text-amber-500" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-900">Afiliado no encontrado</p>
              <p className="text-sm text-amber-700">El DNI ingresado no está registrado.</p>
            </div>
            <Button onClick={() => setIsCreating(true)} className="mt-2 flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white">
              <UserPlus className="h-4 w-4" />
              Registrar nuevo
            </Button>
          </CardContent>
        </Card>
      )}
      
      {isCreating && (
        <Card className="border-sky-200 bg-sky-50">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-sky-800 font-semibold mb-2">
              <UserPlus className="h-4 w-4" /> Registrar Afiliado
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-sky-700">DNI</Label>
              <Input value={dni} disabled className="bg-white/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-sky-700">Nombre</Label>
              <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Juan" className="bg-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-sky-700">Apellido</Label>
              <Input value={apellido} onChange={e => setApellido(e.target.value)} placeholder="Ej: Pérez" className="bg-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-sky-700">Teléfono (Opcional)</Label>
              <Input value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="Ej: 2645123456" className="bg-white" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsCreating(false)} className="flex-1">Cancelar</Button>
              <Button onClick={handleCreate} disabled={loading} className="flex-1 bg-sky-600 hover:bg-sky-700 text-white">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar y Continuar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

