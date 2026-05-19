'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save } from 'lucide-react'

export function ListaEsperaConfig() {
  const supabase = createClient()
  const { toast } = useToast()

  const [limite, setLimite] = useState<number | ''>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadConfig() {
      const { data, error } = await supabase
        .from('configuraciones')
        .select('*')
        .limit(1)
        .single()
      
      if (data) {
        setLimite(data.lista_espera_limite ?? 10)
      }
      setLoading(false)
    }
    loadConfig()
  }, [supabase])

  const handleSave = async () => {
    if (limite === '' || limite < 0) return
    setSaving(true)

    // Al ser fila única, podemos intentar un update genérico (o upsert si no existe).
    // Suponemos que la tabla tiene una fila con id 1 o similar. 
    // Usaremos upsert o update sobre el id que queramos, pero como es fila única, 
    // usualmente actualizamos sin .eq('id', 1) o usamos .eq('id', 1).
    // Para asegurar, hacemos un upsert asumiendo id=1.
    const { error } = await supabase
      .from('configuraciones')
      .update({ lista_espera_limite: Number(limite) })
      .neq('id', '00000000-0000-0000-0000-000000000000') // truco para actualizar toda la tabla si hay una sola fila
      
    if (error) {
      toast({ title: 'Error', description: 'No se pudo guardar la configuración.', variant: 'destructive' })
    } else {
      toast({ title: 'Configuración guardada', description: 'El límite global ha sido actualizado.' })
    }
    setSaving(false)
  }

  if (loading) return <div className="animate-pulse h-32 bg-slate-100 rounded-3xl" />

  return (
    <Card className="rounded-3xl shadow-sm border-2 border-slate-100 mt-8">
      <CardHeader>
        <CardTitle className="text-xl">Lista de Espera</CardTitle>
        <CardDescription>
          Configuración global para las clases e inscripciones.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-w-xs space-y-2">
          <label className="text-sm font-semibold text-slate-700">
            Límite global de lista de espera
          </label>
          <Input 
            type="number" 
            min="0"
            value={limite}
            onChange={(e) => setLimite(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-slate-500">
            Este valor se aplica a todas las clases que no tengan un límite propio definido.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={saving || limite === ''}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Guardar Cambios
        </Button>
      </CardFooter>
    </Card>
  )
}
