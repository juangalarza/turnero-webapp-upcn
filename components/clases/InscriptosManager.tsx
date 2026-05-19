'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Search, UserMinus, ArrowUpCircle, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Inscripto {
  id: string
  estado: string
  posicion_espera: number | null
  perfil_id: string
  afiliados: {
    id: string
    nombre: string
    apellido: string
    dni: string
  }
}

export function InscriptosManager({
  claseId,
  cupoMaximo,
  initialInscripciones,
}: {
  claseId: string
  cupoMaximo: number
  initialInscripciones: any[]
}) {
  const supabase = createClient()
  const { toast } = useToast()

  const [inscripciones, setInscripciones] = useState<Inscripto[]>(initialInscripciones as any)
  const [isSearching, setIsSearching] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Promover de lista de espera
  const [promoverCandidato, setPromoverCandidato] = useState<Inscripto | null>(null)

  const activas = inscripciones.filter((i) => i.estado === 'activa')
  const espera = inscripciones.filter((i) => i.estado === 'lista_espera').sort((a, b) => (a.posicion_espera || 999) - (b.posicion_espera || 999))

  const handleSearch = async () => {
    if (searchTerm.length < 3) return
    setIsSearching(true)
    const { data, error } = await supabase
      .from('afiliados')
      .select('id, nombre, apellido, dni')
      .ilike('nombre', `%${searchTerm}%`)
      .limit(5)
    
    // Also try by DNI
    if (data?.length === 0 && !isNaN(Number(searchTerm))) {
      const { data: dniData } = await supabase
        .from('afiliados')
        .select('id, nombre, apellido, dni')
        .ilike('dni', `%${searchTerm}%`)
        .limit(5)
      setSearchResults(dniData || [])
    } else {
      setSearchResults(data || [])
    }
    setIsSearching(false)
  }

  const reloadInscripciones = async () => {
    const { data } = await supabase
      .from('inscripciones')
      .select(`*, afiliados ( id, nombre, apellido, dni )`)
      .eq('clase_id', claseId)
      .neq('estado', 'baja')
      .order('posicion_espera', { ascending: true })
    if (data) {
      setInscripciones(data as any)
    }
  }

  const handleAddInscripto = async (afiliado: any) => {
    // Prevent duplicate
    if (inscripciones.some(i => i.perfil_id === afiliado.id)) {
      toast({ title: 'Error', description: 'Esta persona ya se encuentra inscripta o en lista de espera.', variant: 'destructive' })
      return
    }

    try {
      const { error } = await supabase
        .from('inscripciones')
        .insert({
          clase_id: claseId,
          perfil_id: afiliado.id,
          // el trigger define si va a activa o lista_espera
        })

      if (error) throw error

      toast({ title: 'Inscripción exitosa', description: `${afiliado.nombre} fue agregado.` })
      setIsDialogOpen(false)
      setSearchTerm('')
      setSearchResults([])
      reloadInscripciones()
    } catch (error: any) {
      toast({
        title: 'No se pudo inscribir',
        description: error.message || 'El cupo y la lista de espera están llenos.',
        variant: 'destructive',
      })
    }
  }

  const handleDarDeBaja = async (id: string) => {
    const { error } = await supabase
      .from('inscripciones')
      .update({ estado: 'baja', fecha_baja: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      toast({ title: 'Error', description: 'No se pudo dar de baja.', variant: 'destructive' })
      return
    }

    toast({ title: 'Baja exitosa', description: 'El inscripto fue dado de baja.' })
    
    // Check if we can promote someone
    const esperando = inscripciones.filter((i) => i.estado === 'lista_espera' && i.id !== id).sort((a, b) => (a.posicion_espera || 999) - (b.posicion_espera || 999))
    if (esperando.length > 0) {
      setPromoverCandidato(esperando[0])
    }
    
    reloadInscripciones()
  }

  const handlePromover = async () => {
    if (!promoverCandidato) return
    const { error } = await supabase
      .from('inscripciones')
      .update({ estado: 'activa', posicion_espera: null })
      .eq('id', promoverCandidato.id)

    if (error) {
      toast({ title: 'Error', description: 'No se pudo promover al inscripto.', variant: 'destructive' })
    } else {
      toast({ title: 'Inscripto promovido', description: 'Pasó de la lista de espera a activa.' })
    }
    setPromoverCandidato(null)
    reloadInscripciones()
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Inscripciones ({activas.length} / {cupoMaximo})</CardTitle>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> Agregar Persona
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Inscribir persona a la clase</DialogTitle>
            </DialogHeader>
            <div className="flex items-center gap-2 mt-4">
              <Input
                placeholder="Buscar por nombre o DNI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
            <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
              {searchResults.map((af) => (
                <div key={af.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-semibold text-sm">{af.nombre} {af.apellido}</p>
                    <p className="text-xs text-slate-500">DNI: {af.dni}</p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => handleAddInscripto(af)}>
                    Inscribir
                  </Button>
                </div>
              ))}
              {searchResults.length === 0 && searchTerm.length >= 3 && !isSearching && (
                <p className="text-sm text-center text-slate-500 py-4">No se encontraron resultados.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>

      </CardHeader>
      <CardContent>
        <Tabs defaultValue="activos">
          <TabsList className="mb-4">
            <TabsTrigger value="activos">Inscriptos Activos ({activas.length})</TabsTrigger>
            <TabsTrigger value="espera">Lista de Espera ({espera.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="activos">
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre y Apellido</TableHead>
                    <TableHead>DNI</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center h-24 text-slate-500">No hay inscriptos activos.</TableCell>
                    </TableRow>
                  ) : (
                    activas.map((ins) => (
                      <TableRow key={ins.id}>
                        <TableCell className="font-medium">
                          {ins.afiliados?.nombre} {ins.afiliados?.apellido}
                        </TableCell>
                        <TableCell className="text-slate-500">{ins.afiliados?.dni}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => handleDarDeBaja(ins.id)}>
                            <UserMinus className="h-4 w-4 mr-2" /> Baja
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="espera">
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Pos</TableHead>
                    <TableHead>Nombre y Apellido</TableHead>
                    <TableHead>DNI</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {espera.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-24 text-slate-500">No hay personas en lista de espera.</TableCell>
                    </TableRow>
                  ) : (
                    espera.map((ins) => (
                      <TableRow key={ins.id}>
                        <TableCell className="font-bold text-amber-600">#{ins.posicion_espera}</TableCell>
                        <TableCell className="font-medium">
                          {ins.afiliados?.nombre} {ins.afiliados?.apellido}
                        </TableCell>
                        <TableCell className="text-slate-500">{ins.afiliados?.dni}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="sm" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => { setPromoverCandidato(ins); handlePromover() }}>
                            <ArrowUpCircle className="h-4 w-4 mr-2" /> Activar
                          </Button>
                          <Button variant="ghost" size="sm" className="text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => handleDarDeBaja(ins.id)}>
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialog Promover Automático */}
        <AlertDialog open={!!promoverCandidato} onOpenChange={(o) => !o && setPromoverCandidato(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Se liberó un cupo</AlertDialogTitle>
              <AlertDialogDescription>
                Hay lugar disponible en la clase. El primero en la lista de espera es <b>{promoverCandidato?.afiliados?.nombre} {promoverCandidato?.afiliados?.apellido}</b>. ¿Deseas pasarlo a inscripto activo automáticamente?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>No, dejar en espera</AlertDialogCancel>
              <AlertDialogAction onClick={handlePromover} className="bg-emerald-600 hover:bg-emerald-700">Sí, activar cupo</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </CardContent>
    </Card>
  )
}
