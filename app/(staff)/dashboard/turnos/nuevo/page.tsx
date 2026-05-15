'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BuscadorAfiliado } from '@/components/afiliados/BuscadorAfiliado'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar as CalendarIcon, CheckCircle2, User, Stethoscope, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Database } from '@/types/database'

type Afiliado = Database['public']['Tables']['afiliados']['Row']
type Especialidad = Database['public']['Tables']['especialidades']['Row']
type Profesional = Database['public']['Tables']['profesionales']['Row']

export default function NuevoTurnoPage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  // Estado del formulario
  const [step, setStep] = useState(1)
  const [afiliado, setAfiliado] = useState<Afiliado | null>(null)
  const [especialidadId, setEspecialidadId] = useState<string>('')
  const [profesionalId, setProfesionalId] = useState<string>('')
  const [fecha, setFecha] = useState<Date | undefined>(undefined)
  const [slot, setSlot] = useState<string>('')
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState(false)

  // Datos de Supabase
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([])
  const [profesionales, setProfesionales] = useState<Profesional[]>([])
  const [diasAtencion, setDiasAtencion] = useState<number[]>([]) // [1, 3, 5] etc
  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Cargar especialidades al inicio
  useEffect(() => {
    const fetchEspecialidades = async () => {
      const { data } = await supabase
        .from('especialidades')
        .select('*')
        .eq('activa', true)
        .order('nombre')
      if (data) setEspecialidades(data)
    }
    fetchEspecialidades()
  }, [supabase])

  // Cargar profesionales cuando cambia especialidad
  useEffect(() => {
    if (!especialidadId) return
    const fetchProfesionales = async () => {
      const { data } = await supabase
        .from('profesionales')
        .select('*')
        .eq('especialidad_id', especialidadId)
        .eq('activo', true)
        .order('apellido')
      if (data) setProfesionales(data)
    }
    fetchProfesionales()
    setProfesionalId('')
    setFecha(undefined)
    setSlot('')
  }, [especialidadId, supabase])

  // Cargar días de atención cuando cambia profesional
  useEffect(() => {
    if (!profesionalId) return
    const fetchHorarios = async () => {
      const { data } = await supabase
        .from('horarios_atencion')
        .select('dia_semana')
        .eq('profesional_id', profesionalId)
        .eq('activo', true)
      if (data) setDiasAtencion((data as { dia_semana: number }[]).map(h => h.dia_semana))
    }
    fetchHorarios()
    setFecha(undefined)
    setSlot('')
  }, [profesionalId, supabase])

  // Cargar slots cuando cambia fecha
  useEffect(() => {
    if (!profesionalId || !fecha) return
    const fetchSlots = async () => {
      setLoadingSlots(true)
      const fechaStr = format(fecha, 'yyyy-MM-dd')
      const res = await fetch(`/api/disponibilidad?profesional_id=${profesionalId}&fecha=${fechaStr}`)
      const data = await res.json()
      if (data.slots) setSlots(data.slots)
      setLoadingSlots(false)
    }
    fetchSlots()
    setSlot('')
  }, [fecha, profesionalId])

  const handleConfirmarTurno = async () => {
    if (!afiliado || !profesionalId || !fecha || !slot) return

    setLoading(true)
    const payload = {
      afiliado_id: afiliado.id,
      profesional_id: profesionalId,
      fecha: format(fecha, 'yyyy-MM-dd'),
      hora: slot,
      motivo_consulta: motivo,
      sede_id: profesionales.find(p => p.id === profesionalId)?.sede_id // usar sede del profesional
    }

    try {
      const res = await fetch('/api/turnos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Error al crear el turno')

      toast({
        title: "¡Turno creado!",
        description: `El turno para ${afiliado.nombre} ha sido agendado con éxito.`,
      })
      router.push('/dashboard/turnos')
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="container max-w-2xl py-8">
      <h1 className="mb-8 text-3xl font-bold">Nuevo Turno</h1>

      <div className="space-y-6">
        {/* Paso 1: Afiliado */}
        <Card className={cn(step > 1 && "opacity-60")}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn("flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold", step === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>1</div>
                <CardTitle className="text-lg">Afiliado</CardTitle>
              </div>
              {afiliado && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            </div>
          </CardHeader>
          {step === 1 && (
            <CardContent>
              <BuscadorAfiliado onSelect={(a) => { setAfiliado(a); setStep(2); }} />
            </CardContent>
          )}
          {step > 1 && afiliado && (
            <CardContent className="pt-0">
              <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{(afiliado.nombre as string)} {(afiliado.apellido as string)}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep(1)}>Cambiar</Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Paso 2: Especialidad */}
        {step >= 2 && (
          <Card className={cn(step > 2 && "opacity-60")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold", step === 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>2</div>
                  <CardTitle className="text-lg">Especialidad</CardTitle>
                </div>
                {especialidadId && <CheckCircle2 className="h-5 w-5 text-green-500" />}
              </div>
            </CardHeader>
            {step === 2 && (
              <CardContent>
                <Select value={especialidadId} onValueChange={(val) => { setEspecialidadId(val); setStep(3); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar especialidad..." />
                  </SelectTrigger>
                  <SelectContent>
                    {especialidades.map((e) => (
                      <SelectItem key={(e.id as string)} value={(e.id as string)}>{(e.nombre as string)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            )}
            {step > 2 && especialidadId && (
              <CardContent className="pt-0">
                <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center gap-3">
                    <Stethoscope className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{(especialidades.find(e => e.id === especialidadId)?.nombre as string)}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setStep(2)}>Cambiar</Button>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Paso 3: Profesional */}
        {step >= 3 && (
          <Card className={cn(step > 3 && "opacity-60")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold", step === 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>3</div>
                  <CardTitle className="text-lg">Profesional</CardTitle>
                </div>
                {profesionalId && <CheckCircle2 className="h-5 w-5 text-green-500" />}
              </div>
            </CardHeader>
            {step === 3 && (
              <CardContent>
                <Select value={profesionalId} onValueChange={(val) => { setProfesionalId(val); setStep(4); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar profesional..." />
                  </SelectTrigger>
                  <SelectContent>
                    {profesionales.map((p) => (
                      <SelectItem key={(p.id as string)} value={(p.id as string)}>{(p.apellido as string)}, {(p.nombre as string)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {profesionales.length === 0 && <p className="mt-2 text-sm text-destructive">No hay profesionales activos para esta especialidad.</p>}
              </CardContent>
            )}
            {step > 3 && profesionalId && (
              <CardContent className="pt-0">
                <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {(profesionales.find(p => p.id === profesionalId)?.apellido as string)}, {(profesionales.find(p => p.id === profesionalId)?.nombre as string)}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setStep(3)}>Cambiar</Button>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Paso 4: Fecha */}
        {step >= 4 && (
          <Card className={cn(step > 4 && "opacity-60")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold", step === 4 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>4</div>
                  <CardTitle className="text-lg">Fecha</CardTitle>
                </div>
                {fecha && <CheckCircle2 className="h-5 w-5 text-green-500" />}
              </div>
            </CardHeader>
            {step === 4 && (
              <CardContent>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !fecha && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fecha ? format(fecha, "PPP", { locale: es }) : <span>Seleccionar fecha...</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={fecha}
                      onSelect={(f) => { setFecha(f); if (f) setStep(5); }}
                      disabled={(date) => {
                        // Deshabilitar fechas pasadas
                        if (date < new Date(new Date().setHours(0,0,0,0))) return true
                        // Deshabilitar días que no atiende
                        return !diasAtencion.includes(date.getDay())
                      }}
                      // initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </CardContent>
            )}
            {step > 4 && fecha && (
              <CardContent className="pt-0">
                <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{format(fecha, "PPP", { locale: es })}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setStep(4)}>Cambiar</Button>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Paso 5: Horario */}
        {step >= 5 && (
          <Card className={cn(step > 5 && "opacity-60")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold", step === 5 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>5</div>
                  <CardTitle className="text-lg">Horario</CardTitle>
                </div>
                {slot && <CheckCircle2 className="h-5 w-5 text-green-500" />}
              </div>
            </CardHeader>
            {step === 5 && (
              <CardContent>
                {loadingSlots ? (
                  <p className="text-center text-sm text-muted-foreground py-4">Buscando slots disponibles...</p>
                ) : slots.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map((s) => (
                      <Button
                        key={s}
                        variant={slot === s ? "default" : "outline"}
                        className="font-mono"
                        onClick={() => { setSlot(s); setStep(6); }}
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-sm text-destructive py-4">No hay turnos disponibles para esta fecha.</p>
                )}
              </CardContent>
            )}
            {step > 5 && slot && (
              <CardContent className="pt-0">
                <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{slot} hs</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setStep(5)}>Cambiar</Button>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Paso 6: Motivo y Confirmación */}
        {step >= 6 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">6</div>
                <CardTitle className="text-lg">Confirmación</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo de consulta (opcional)</Label>
                <Textarea
                  id="motivo"
                  placeholder="Ej: Control de rutina, dolor de garganta..."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={handleConfirmarTurno}
                disabled={loading}
              >
                {loading ? "Agendando..." : "Confirmar Turno"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

