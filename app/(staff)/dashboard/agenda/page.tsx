'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useStaffProfile } from '@/hooks/useStaffProfile'
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, startOfMonth, endOfMonth, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, Stethoscope, Loader2, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function AgendaPage() {
  const supabase = createClient()
  const { profile } = useStaffProfile()
  
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [view, setView] = useState('dia') // 'dia', 'semana'
  
  const [turnos, setTurnos] = useState<any[]>([])
  const [profesionales, setProfesionales] = useState<any[]>([])
  const [selectedProfesional, setSelectedProfesional] = useState<string>('todos')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    
    // Si es un profesional, forzar el filtro a su ID
    if (profile.rol === 'profesional' && profile.profesional_id) {
      setSelectedProfesional(profile.profesional_id)
    }

    // Cargar lista de profesionales (solo para admin/recepcion)
    if (profile.rol !== 'profesional') {
      supabase.from('profesionales').select('*').eq('activo', true).order('apellido')
        .then(({ data }) => {
          if (data) setProfesionales(data)
        })
    }
  }, [profile, supabase])

  useEffect(() => {
    fetchTurnos()
  }, [currentDate, view, selectedProfesional, profile])

  async function fetchTurnos() {
    if (!profile) return
    setLoading(true)
    
    let fromDate, toDate
    
    if (view === 'dia') {
      fromDate = format(currentDate, 'yyyy-MM-dd')
      toDate = format(currentDate, 'yyyy-MM-dd')
    } else if (view === 'semana') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 })
      const end = endOfWeek(currentDate, { weekStartsOn: 1 })
      fromDate = format(start, 'yyyy-MM-dd')
      toDate = format(end, 'yyyy-MM-dd')
    } else {
      // mes
      const start = startOfMonth(currentDate)
      const end = endOfMonth(currentDate)
      fromDate = format(start, 'yyyy-MM-dd')
      toDate = format(end, 'yyyy-MM-dd')
    }

    let query = supabase
      .from('turnos')
      .select(`
        id, fecha, hora, estado, motivo_consulta,
        afiliados ( nombre, apellido, dni, telefono ),
        profesionales ( nombre, apellido, especialidades(nombre) )
      `)
      .gte('fecha', fromDate)
      .lte('fecha', toDate)
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true })

    if (selectedProfesional !== 'todos') {
      query = query.eq('profesional_id', selectedProfesional)
    }

    const { data, error } = await query
    
    if (data) {
      setTurnos(data)
    }
    setLoading(false)
  }

  const handlePrev = () => {
    if (view === 'dia') setCurrentDate(subDays(currentDate, 1))
    if (view === 'semana') setCurrentDate(subDays(currentDate, 7))
  }

  const handleNext = () => {
    if (view === 'dia') setCurrentDate(addDays(currentDate, 1))
    if (view === 'semana') setCurrentDate(addDays(currentDate, 7))
  }

  const handleToday = () => setCurrentDate(new Date())

  // Helpers de UI
  const getStatusColor = (estado: string) => {
    switch(estado) {
      case 'confirmado': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'pendiente': return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'cancelado': return 'bg-rose-100 text-rose-700 border-rose-200'
      case 'atendido': return 'bg-sky-100 text-sky-700 border-sky-200'
      case 'ausente': return 'bg-slate-100 text-slate-700 border-slate-200'
      default: return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const formatHora = (time: string) => time.slice(0, 5)

  // Vista Día
  const renderDia = () => {
    if (loading) return <div className="h-64 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-sky-500" /></div>
    
    if (turnos.length === 0) {
      return (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
          <CalendarIcon className="h-12 w-12 opacity-20" />
          <p>No hay turnos agendados para este día.</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {turnos.map(turno => (
          <div key={turno.id} className="flex gap-4">
            {/* Timeline */}
            <div className="w-20 flex-shrink-0 flex flex-col items-end pt-4 pr-4 border-r-2 border-slate-100">
              <span className="text-lg font-bold text-slate-700">{formatHora(turno.hora)}</span>
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">HS</span>
            </div>
            
            {/* Card */}
            <div className={`flex-1 rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md ${getStatusColor(turno.estado)}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 opacity-70" />
                  <h3 className="font-bold text-lg">{turno.afiliados?.apellido}, {turno.afiliados?.nombre}</h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-white/50 text-[10px] font-bold uppercase tracking-wider">
                  {turno.estado}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="flex items-center gap-2 opacity-80 text-sm font-medium">
                  <Stethoscope className="h-4 w-4" />
                  <span>Dr/a. {turno.profesionales?.apellido} - {turno.profesionales?.especialidades?.nombre}</span>
                </div>
                {turno.motivo_consulta && (
                  <div className="flex items-start gap-2 opacity-80 text-sm">
                    <span className="font-bold">Motivo:</span>
                    <span className="truncate">{turno.motivo_consulta}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Vista Semana
  const renderSemana = () => {
    if (loading) return <div className="h-64 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-sky-500" /></div>

    const start = startOfWeek(currentDate, { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start, end: addDays(start, 5) }) // Lunes a Sábado

    return (
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {days.map(day => {
          const dayTurnos = turnos.filter(t => isSameDay(parseISO(t.fecha), day))
          const isCurrentDay = isToday(day)
          
          return (
            <div key={day.toString()} className={`flex flex-col rounded-2xl border bg-slate-50 overflow-hidden ${isCurrentDay ? 'ring-2 ring-sky-500' : ''}`}>
              <div className={`p-3 text-center border-b ${isCurrentDay ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-700'}`}>
                <span className="block text-xs font-bold uppercase tracking-widest">{format(day, 'EEEE', { locale: es })}</span>
                <span className="block text-2xl font-light">{format(day, 'dd')}</span>
              </div>
              <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[600px] scrollbar-hide">
                {dayTurnos.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-4 font-medium">Libre</p>
                ) : (
                  dayTurnos.map(turno => (
                    <div key={turno.id} className={`p-2 rounded-xl border text-xs shadow-sm ${getStatusColor(turno.estado)}`}>
                      <div className="font-bold mb-1 flex justify-between">
                        <span>{formatHora(turno.hora)}</span>
                        <span className="opacity-70 truncate max-w-[60px]">{turno.profesionales?.apellido}</span>
                      </div>
                      <div className="font-medium truncate opacity-90">{turno.afiliados?.apellido}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in duration-500 pb-10 h-full min-h-[calc(100vh-100px)]">
      
      {/* Sidebar de Agenda */}
      <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
        {/* Filtros */}
        <Card className="p-5 rounded-3xl shadow-sm border-slate-100 bg-white">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Filter className="h-4 w-4 text-sky-500" /> Filtros
          </h3>
          
          {profile?.rol !== 'profesional' && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-500 uppercase">Profesional</Label>
              <Select value={selectedProfesional} onValueChange={setSelectedProfesional}>
                <SelectTrigger className="bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Todos los profesionales" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los profesionales</SelectItem>
                  {profesionales.map(p => (
                    <SelectItem key={p.id} value={p.id}>Dr/a. {p.apellido}, {p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </Card>

        {/* Mini Calendario */}
        <Card className="p-4 rounded-3xl shadow-sm border-slate-100 bg-white flex justify-center">
          <Calendar
            mode="single"
            selected={currentDate}
            onSelect={(d) => d && setCurrentDate(d)}
            locale={es}
            className="w-full"
          />
        </Card>
      </div>

      {/* Main Agenda */}
      <div className="flex-1 flex flex-col min-w-0">
        <Card className="flex-1 p-6 rounded-3xl shadow-sm border-slate-100 bg-white flex flex-col">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-slate-100 rounded-xl p-1 shadow-inner">
                <Button variant="ghost" size="icon" onClick={handlePrev} className="h-8 w-8 rounded-lg hover:bg-white hover:shadow-sm">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" onClick={handleToday} className="h-8 px-4 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-white hover:shadow-sm">
                  Hoy
                </Button>
                <Button variant="ghost" size="icon" onClick={handleNext} className="h-8 w-8 rounded-lg hover:bg-white hover:shadow-sm">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <h2 className="text-2xl font-light text-slate-700 capitalize">
                {view === 'dia' 
                  ? format(currentDate, "EEEE d 'de' MMMM, yyyy", { locale: es })
                  : `Semana del ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), "d MMM", { locale: es })}`}
              </h2>
            </div>

            <Tabs value={view} onValueChange={setView} className="w-[200px]">
              <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-xl">
                <TabsTrigger value="dia" className="rounded-lg text-xs font-bold uppercase tracking-wider data-[state=active]:shadow-sm">Día</TabsTrigger>
                <TabsTrigger value="semana" className="rounded-lg text-xs font-bold uppercase tracking-wider data-[state=active]:shadow-sm">Semana</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Content */}
          <div className="flex-1">
            {view === 'dia' ? renderDia() : renderSemana()}
          </div>
          
        </Card>
      </div>

    </div>
  )
}
