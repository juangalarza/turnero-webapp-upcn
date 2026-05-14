'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Search, UserPlus, UserCheck, AlertCircle } from 'lucide-react'
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
  const supabase = createClient()

  const handleSearch = async () => {
    if (!dni) return
    setLoading(true)
    setNotFound(false)
    setAfiliado(null)

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

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por DNI..."
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? 'Buscando...' : 'Buscar'}
        </Button>
      </div>

      {afiliado && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <UserCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{(afiliado.nombre as string)} {(afiliado.apellido as string)}</p>
                <p className="text-sm text-muted-foreground">DNI: {(afiliado.dni as string)}</p>
              </div>
            </div>
            <Button onClick={() => onSelect(afiliado)}>
              Confirmar
            </Button>
          </CardContent>
        </Card>
      )}

      {notFound && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div className="space-y-1">
              <p className="font-semibold text-destructive">Afiliado no encontrado</p>
              <p className="text-sm text-muted-foreground">El DNI ingresado no coincide con ningún afiliado registrado.</p>
            </div>
            <Button variant="outline" className="mt-2 flex items-center gap-2" asChild>
              <a href="/afiliados/nuevo">
                <UserPlus className="h-4 w-4" />
                Crear nuevo afiliado
              </a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

