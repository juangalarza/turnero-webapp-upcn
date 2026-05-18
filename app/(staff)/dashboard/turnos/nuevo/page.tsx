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
import { Calendar as CalendarIcon, CheckCircle2, User, Stethoscope, Clock, Loader2 } from 'lucide-react'
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
    <div className="w-full h-full pb-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Nuevo Turno</h1>
        <p className="text-slate-500 text-sm">Gestiona la asignación de turnos siguiendo el flujo.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* COLUMNA 1: Afiliado */}
        <div className={cn("flex flex-col gap-4", step > 1 && "opacity-80")}>
          <Card className="border-t-4 border-t-sky-500 shadow-md">
            <CardHeader className="pb-3 bg-slate-50/50 rounded-t-xl border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-md flex items-center gap-2">
                  <User className="h-5 w-5 text-sky-500" /> Paciente
                </CardTitle>
                {afiliado && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
              </div>
            </CardHeader>
          {step === 1 && (
            <CardContent className="pt-4">
              <BuscadorAfiliado onSelect={(a) => { setAfiliado(a); setStep(2); }} />
            </CardContent>
          )}
          {step > 1 && afiliado && (
            <CardContent className="pt-4">
              <div className="flex flex-col gap-2 rounded-xl border bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 block">{(afiliado.nombre as string)} {(afiliado.apellido as string)}</span>
                    <span className="text-xs text-slate-500">DNI: {(afiliado.dni as string)}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => { setStep(1); setAfiliado(null); }} className="mt-2 w-full text-xs">
                  Cambiar Paciente
                </Button>
              </div>
            </CardContent>
          )}
          </Card>
        </div>

        {/* COLUMNA 2: Prestación & Profesional */}
        <div className={cn("flex flex-col gap-4", step < 2 && "opacity-40 pointer-events-none")}>
          <Card className={cn("border-t-4 shadow-md transition-colors", step >= 2 ? "border-t-indigo-500" : "border-t-slate-200")}>
            <CardHeader className="pb-3 bg-slate-50/50 rounded-t-xl border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-md flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-indigo-500" /> Prestación
                </CardTitle>
                {profesionalId && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">
              {/* Especialidad */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-500 uppercase">Especialidad</Label>
                {step === 2 || !especialidadId ? (
                  <Select value={especialidadId} onValueChange={(val) => { setEspecialidadId(val); setStep(3); }}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Seleccionar especialidad..." />
                    </SelectTrigger>
                    <SelectContent>
                      {especialidades.map((e) => (
                        <SelectItem key={(e.id as string)} value={(e.id as string)}>{(e.nombre as string)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center justify-between rounded-xl border bg-slate-50 p-3">
                    <span className="font-medium text-sm text-slate-700">{(especialidades.find(e => e.id === especialidadId)?.nombre as string)}</span>
                    <Button variant="ghost" size="sm" onClick={() => { setStep(2); setEspecialidadId(''); setProfesionalId(''); }} className="h-6 text-xs px-2">Cambiar</Button>
                  </div>
                )}
              </div>

              {/* Profesional */}
              <div className={cn("space-y-2 transition-opacity duration-300", step < 3 && "opacity-30 pointer-events-none")}>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Profesional</Label>
                {step === 3 || !profesionalId ? (
                  <div className="space-y-2">
                    <Select value={profesionalId} onValueChange={(val) => { setProfesionalId(val); setStep(4); }}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Seleccionar profesional..." />
                      </SelectTrigger>
                      <SelectContent>
                        {profesionales.map((p) => (
                          <SelectItem key={(p.id as string)} value={(p.id as string)}>{(p.apellido as string)}, {(p.nombre as string)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {step === 3 && profesionales.length === 0 && (
                      <p className="text-xs text-rose-500 font-medium">No hay profesionales disponibles.</p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-xl border bg-slate-50 p-3">
                    <span className="font-medium text-sm text-slate-700">
                      {(profesionales.find(p => p.id === profesionalId)?.apellido as string)}, {(profesionales.find(p => p.id === profesionalId)?.nombre as string)}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => { setStep(3); setProfesionalId(''); }} className="h-6 text-xs px-2">Cambiar</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* COLUMNA 3: Horarios */}
        <div className={cn("flex flex-col gap-4", step < 4 && "opacity-40 pointer-events-none")}>
          <Card className={cn("border-t-4 shadow-md transition-colors", step >= 4 ? "border-t-amber-500" : "border-t-slate-200")}>
            <CardHeader className="pb-3 bg-slate-50/50 rounded-t-xl border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-md flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-amber-500" /> Horario
                </CardTitle>
                {slot && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">
              {/* Fecha */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-500 uppercase">Fecha del Turno</Label>
                {step === 4 || !fecha ? (
                  <div className="flex justify-center bg-white border border-slate-200 rounded-xl overflow-hidden p-2">
                    <Calendar
                      mode="single"
                      selected={fecha}
                      onSelect={(f) => { setFecha(f); if (f) { setStep(5); setSlot(''); } }}
                      disabled={(date) => {
                        if (date < new Date(new Date().setHours(0,0,0,0))) return true
                        return !diasAtencion.includes(date.getDay())
                      }}
                      className="mx-auto"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-xl border bg-slate-50 p-3">
                    <span className="font-medium text-sm text-slate-700">{format(fecha, "PPPP", { locale: es })}</span>
                    <Button variant="ghost" size="sm" onClick={() => { setStep(4); setFecha(undefined); setSlot(''); }} className="h-6 text-xs px-2">Cambiar</Button>
                  </div>
                )}
              </div>

              {/* Slot */}
              <div className={cn("space-y-2 transition-opacity duration-300", step < 5 && "opacity-30 pointer-events-none")}>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Hora de Atención</Label>
                {step === 5 || !slot ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-3 min-h-[100px] flex flex-col justify-center">
                    {loadingSlots ? (
                      <div className="flex flex-col items-center justify-center gap-2 text-sky-600">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="text-xs font-medium">Buscando horarios...</span>
                      </div>
                    ) : slots.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {slots.map((s) => (
                          <Button
                            key={s}
                            variant={slot === s ? "default" : "outline"}
                            className={cn(
                              "font-mono text-sm h-9",
                              slot === s ? "bg-amber-500 hover:bg-amber-600" : "hover:bg-amber-50 hover:text-amber-700"
                            )}
                            onClick={() => { setSlot(s); setStep(6); }}
                          >
                            {s}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-sm text-rose-500 font-medium">No hay turnos disponibles para este día.</p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-xl border bg-slate-50 p-3">
                    <span className="font-bold text-lg text-amber-600">{slot} hs</span>
                    <Button variant="ghost" size="sm" onClick={() => { setStep(5); setSlot(''); }} className="h-6 text-xs px-2">Cambiar</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* COLUMNA 4: Confirmación */}
        <div className={cn("flex flex-col gap-4", step < 6 && "opacity-40 pointer-events-none")}>
          <Card className={cn("border-t-4 shadow-md transition-colors", step >= 6 ? "border-t-emerald-500" : "border-t-slate-200")}>
            <CardHeader className="pb-3 bg-slate-50/50 rounded-t-xl border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CardTitle className="text-md flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" /> Confirmación
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Resumen</h4>
                
                <div className="space-y-1">
                  <span className="block text-[10px] text-emerald-600 font-bold uppercase">Paciente</span>
                  <p className="text-sm font-medium text-emerald-900 truncate">
                    {afiliado ? `${afiliado.nombre} ${afiliado.apellido}` : '-'}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <span className="block text-[10px] text-emerald-600 font-bold uppercase">Atención</span>
                  <p className="text-sm font-medium text-emerald-900 truncate">
                    {profesionalId ? `${profesionales.find(p => p.id === profesionalId)?.nombre} ${profesionales.find(p => p.id === profesionalId)?.apellido}` : '-'}
                  </p>
                  <p className="text-xs text-emerald-700">
                    {fecha ? format(fecha, "PPP", { locale: es }) : '-'} a las {slot || '-'} hs
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="motivo" className="text-xs font-semibold text-slate-500 uppercase">Motivo (opcional)</Label>
                <Textarea
                  id="motivo"
                  placeholder="Ej: Control de rutina..."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="resize-none h-20 bg-white"
                />
              </div>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-[0.98]"
                onClick={handleConfirmarTurno}
                disabled={loading || step < 6}
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Agendar Turno"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

