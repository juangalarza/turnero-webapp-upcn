'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RolGuard } from '@/components/layout/RolGuard'
import { useToast } from '@/hooks/use-toast'
import {
  FileText,
  Loader2,
  TrendingUp,
  Users,
  Calendar,
  Activity,
  Download,
  CalendarDays,
  UserCheck,
  Percent,
  Clock,
  ArrowRight,
  ChevronRight,
  TrendingDown,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs'

interface StatCardProps {
  title: string
  value: string | number
  subtext: string
  icon: React.ComponentType<any>
  colorClass: string
  trend?: {
    value: string
    positive: boolean
  }
}

export default function ReportesPage() {
  const { toast } = useToast()
  const supabase = createClient()

  // State
  const [loading, setLoading] = useState(true)
  const [rangoDias, setRangoDias] = useState<number>(30) // 7, 30, 90 días
  
  // Data
  const [dataTurnos, setDataTurnos] = useState<any[]>([])
  const [dataClases, setDataClases] = useState<any[]>([])
  const [dataInscripciones, setDataInscripciones] = useState<any[]>([])
  const [dataAsistencias, setDataAsistencias] = useState<any[]>([])
  const [totalAfiliados, setTotalAfiliados] = useState<number>(0)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)

      // Fetch turnos
      const { data: turnos, error: turnosError } = await supabase
        .from('turnos')
        .select(`
          id,
          estado,
          fecha,
          hora,
          profesional_id,
          profesionales (
            id,
            nombre,
            apellido,
            especialidad_id,
            especialidades (
              id,
              nombre,
              color
            )
          )
        `)
      if (turnosError) throw turnosError
      setDataTurnos(turnos || [])

      // Fetch clases
      const { data: clases, error: clasesError } = await supabase
        .from('clases')
        .select(`
          id,
          nombre,
          cupo_maximo,
          dia_semana,
          hora_inicio,
          hora_fin,
          profesional_id,
          profesionales (
            nombre,
            apellido
          )
        `)
      if (clasesError) throw clasesError
      setDataClases(clases || [])

      // Fetch inscripciones
      const { data: inscripciones, error: insError } = await supabase
        .from('inscripciones')
        .select('id, clase_id, estado, perfil_id')
      if (insError) throw insError
      setDataInscripciones(inscripciones || [])

      // Fetch asistencias
      const { data: asistencias, error: asisError } = await supabase
        .from('asistencia')
        .select(`
          id,
          presente,
          fecha,
          inscripcion_id,
          inscripciones (
            clase_id
          )
        `)
      if (asisError) throw asisError
      setDataAsistencias(asistencias || [])

      // Fetch total afiliados
      const { count, error: countError } = await supabase
        .from('afiliados')
        .select('*', { count: 'exact', head: true })
      if (countError) throw countError
      setTotalAfiliados(count || 0)

    } catch (error: any) {
      toast({
        title: "Error al cargar reportes",
        description: error.message || "No se pudieron obtener las estadísticas.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Filtrado por fecha en el cliente
  const filterByDateRange = (items: any[], dateField: string = 'fecha') => {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - rangoDias)
    return items.filter(item => {
      if (!item[dateField]) return false
      const itemDate = new Date(item[dateField])
      return itemDate >= cutoffDate
    })
  }

  // Procesamiento de datos de turnos filtrados
  const turnosFiltrados = filterByDateRange(dataTurnos, 'fecha')
  const totalTurnosFiltrados = turnosFiltrados.length

  // Métricas de Turnos
  const turnosPorEstado = turnosFiltrados.reduce((acc: any, t) => {
    acc[t.estado] = (acc[t.estado] || 0) + 1
    return acc
  }, { atendido: 0, ausente: 0, cancelado: 0, confirmado: 0, pendiente: 0 })

  const totalAtendidosYAusentes = turnosPorEstado.atendido + turnosPorEstado.ausente
  const tasaEfectividadMedica = totalAtendidosYAusentes > 0 
    ? Math.round((turnosPorEstado.atendido / totalAtendidosYAusentes) * 100) 
    : 0

  const tasaAusentismoMedica = totalAtendidosYAusentes > 0 
    ? Math.round((turnosPorEstado.ausente / totalAtendidosYAusentes) * 100) 
    : 0

  const tasaCancelacionesMedica = totalTurnosFiltrados > 0 
    ? Math.round((turnosPorEstado.cancelado / totalTurnosFiltrados) * 100) 
    : 0

  // Turnos por Especialidad
  const especialidadesStats = turnosFiltrados.reduce((acc: any, t) => {
    const espNombre = t.profesionales?.especialidades?.nombre || 'General / Desconocida'
    const color = t.profesionales?.especialidades?.color || '#cbd5e1'
    if (!acc[espNombre]) {
      acc[espNombre] = { nombre: espNombre, count: 0, color, atendidos: 0, ausentes: 0, total: 0 }
    }
    acc[espNombre].count += 1
    acc[espNombre].total += 1
    if (t.estado === 'atendido') acc[espNombre].atendidos += 1
    if (t.estado === 'ausente') acc[espNombre].ausentes += 1
    return acc
  }, {})

  const especialidadesStatsList: any[] = Object.values(especialidadesStats).sort((a: any, b: any) => b.count - a.count)

  // Turnos por Profesional
  const profesionalesStats = turnosFiltrados.reduce((acc: any, t) => {
    if (!t.profesionales) return acc
    const profNombre = `${t.profesionales.apellido}, ${t.profesionales.nombre}`
    const esp = t.profesionales.especialidades?.nombre || 'General'
    if (!acc[profNombre]) {
      acc[profNombre] = { nombre: profNombre, esp, atendidos: 0, ausentes: 0, cancelados: 0, total: 0 }
    }
    acc[profNombre].total += 1
    if (t.estado === 'atendido') acc[profNombre].atendidos += 1
    if (t.estado === 'ausente') acc[profNombre].ausentes += 1
    if (t.estado === 'cancelado') acc[profNombre].cancelados += 1
    return acc
  }, {})

  const profesionalesStatsList: any[] = Object.values(profesionalesStats).sort((a: any, b: any) => b.total - a.total)

  // Métricas de Clases
  // 1. Tasa de asistencia histórica
  const asistenciasFiltradas = filterByDateRange(dataAsistencias, 'fecha')
  const totalAsistenciasRegistradas = asistenciasFiltradas.length
  const presentesTotal = asistenciasFiltradas.filter(a => a.presente).length
  const tasaAsistenciaClases = totalAsistenciasRegistradas > 0
    ? Math.round((presentesTotal / totalAsistenciasRegistradas) * 100)
    : 0

  // 2. Ocupación de cupos actual
  const clasesOcupacionStats = dataClases.map(clase => {
    const inscriptos = dataInscripciones.filter(i => i.clase_id === clase.id)
    const inscriptosActivos = inscriptos.filter(i => i.estado === 'activa').length
    const enListaEspera = inscriptos.filter(i => i.estado === 'lista_espera').length
    const ocupacionPct = clase.cupo_maximo > 0 
      ? Math.round((inscriptosActivos / clase.cupo_maximo) * 100) 
      : 0

    // Promedio de asistencia específico de esta clase
    const asistenciasDeClase = dataAsistencias.filter(a => (a.inscripciones as any)?.clase_id === clase.id)
    const clasePresentes = asistenciasDeClase.filter(a => a.presente).length
    const asistClasePct = asistenciasDeClase.length > 0
      ? Math.round((clasePresentes / asistenciasDeClase.length) * 100)
      : 0

    return {
      ...clase,
      inscriptosActivos,
      enListaEspera,
      ocupacionPct,
      asistenciaPct: asistClasePct || 0,
      totalAsistencias: asistenciasDeClase.length
    }
  })

  const promedioOcupacionClases = clasesOcupacionStats.length > 0
    ? Math.round(clasesOcupacionStats.reduce((sum, c) => sum + c.ocupacionPct, 0) / clasesOcupacionStats.length)
    : 0

  // Función de Exportación a CSV
  const handleExportCSV = (tipo: 'turnos' | 'clases' | 'profesionales') => {
    let headers = ''
    let rows = ''
    let filename = ''

    if (tipo === 'turnos') {
      headers = 'ID,Fecha,Estado,Profesional,Especialidad\n'
      rows = turnosFiltrados.map(t => (
        `"${t.id}","${t.fecha}","${t.estado}","${t.profesionales?.nombre} ${t.profesionales?.apellido}","${t.profesionales?.especialidades?.nombre || 'General'}"`
      )).join('\n')
      filename = `reporte_turnos_${rangoDias}dias.csv`
    } else if (tipo === 'clases') {
      headers = 'ID,Clase,Instructor,Dia,Ocupacion_Activos,Cupo_Maximo,En_Espera,Asistencia_Promedio\n'
      rows = clasesOcupacionStats.map(c => (
        `"${c.id}","${c.nombre}","${c.profesionales?.nombre} ${c.profesionales?.apellido}","${c.dia_semana}",${c.inscriptosActivos},${c.cupo_maximo},${c.enListaEspera},"${c.asistenciaPct}%"`
      )).join('\n')
      filename = `reporte_clases.csv`
    } else if (tipo === 'profesionales') {
      headers = 'Profesional,Especialidad,Atendidos,Ausentes,Cancelados,Total_Asignado,Efectividad_Presencia\n'
      rows = profesionalesStatsList.map((p: any) => {
        const totalAt = p.atendidos + p.ausentes
        const pct = totalAt > 0 ? Math.round((p.atendidos / totalAt) * 100) : 0
        return `"${p.nombre}","${p.esp}",${p.atendidos},${p.ausentes},${p.cancelados},${p.total},"${pct}%"`
      }).join('\n')
      filename = `reporte_rendimiento_profesionales_${rangoDias}dias.csv`
    }

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers + rows
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Exportación exitosa",
      description: `Se ha descargado el reporte ${filename} correctamente.`
    })
  }

  if (loading) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-sky-600" />
        <p className="text-sm text-slate-500 font-medium animate-pulse">Cargando métricas y análisis de base de datos...</p>
      </div>
    )
  }

  return (
    <RolGuard roles={['admin']}>
      <div className="space-y-8 pb-10 w-full animate-in fade-in duration-500">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <FileText className="h-8 w-8 text-sky-600" /> Reportes & Estadísticas
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Monitoreo analítico de demanda médica, ausentismo de afiliados y rendimiento de clases grupales.
            </p>
          </div>

          {/* Rango de Días & Actualización */}
          <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm self-start">
            <button
              onClick={() => setRangoDias(7)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                rangoDias === 7 
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-100' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Últimos 7 días
            </button>
            <button
              onClick={() => setRangoDias(30)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                rangoDias === 30 
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-100' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Últimos 30 días
            </button>
            <button
              onClick={() => setRangoDias(90)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                rangoDias === 90 
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-100' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Últimos 90 días
            </button>
          </div>
        </div>

        {/* 4 Cards Summary Widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Efectividad Médica"
            value={`${tasaEfectividadMedica}%`}
            subtext={`${turnosPorEstado.atendido} atendidos vs ${turnosPorEstado.ausente} ausentes`}
            icon={UserCheck}
            colorClass="from-emerald-500 to-teal-600 text-emerald-600 shadow-emerald-100/50"
            trend={{ value: `${tasaAusentismoMedica}% ausentismo`, positive: false }}
          />
          <StatCard
            title="Asistencia a Clases"
            value={`${tasaAsistenciaClases}%`}
            subtext="Tasa promedio de asistencia presencial"
            icon={Percent}
            colorClass="from-indigo-500 to-indigo-600 text-indigo-600 shadow-indigo-100/50"
            trend={{ value: "Alto compromiso", positive: true }}
          />
          <StatCard
            title="Ocupación de Clases"
            value={`${promedioOcupacionClases}%`}
            subtext="Cupos ocupados en talleres activos"
            icon={Activity}
            colorClass="from-pink-500 to-rose-600 text-pink-600 shadow-rose-100/50"
          />
          <StatCard
            title="Total Afiliados"
            value={totalAfiliados}
            subtext="Afiliados registrados en la base"
            icon={Users}
            colorClass="from-sky-500 to-blue-600 text-sky-600 shadow-sky-100/50"
          />
        </div>

        {/* Tabbed Analytical Sections */}
        <Tabs defaultValue="general" className="w-full space-y-6">
          <TabsList className="bg-white p-1 rounded-2xl border border-slate-100 shadow-sm h-12 w-full sm:w-auto flex overflow-x-auto whitespace-nowrap">
            <TabsTrigger value="general" className="rounded-xl font-bold px-6 text-sm">Resumen General</TabsTrigger>
            <TabsTrigger value="turnos" className="rounded-xl font-bold px-6 text-sm">Reporte de Turnos</TabsTrigger>
            <TabsTrigger value="clases" className="rounded-xl font-bold px-6 text-sm">Asistencia y Clases</TabsTrigger>
            <TabsTrigger value="rendimiento" className="rounded-xl font-bold px-6 text-sm">Rendimiento Staff</TabsTrigger>
          </TabsList>

          {/* TAB 1: GENERAL OVERVIEW */}
          <TabsContent value="general" className="space-y-6 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Turnos Breakdown Graph (Custom CSS Bar Chart) */}
              <Card className="lg:col-span-2 p-8 rounded-3xl border border-slate-100 shadow-sm bg-white flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Estado de Citas Médicas</h3>
                      <p className="text-slate-500 text-xs mt-0.5">Distribución general de todos los turnos del periodo ({totalTurnosFiltrados} en total)</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleExportCSV('turnos')} className="rounded-xl border-slate-200 text-xs font-semibold gap-1.5 h-9">
                      <Download className="h-3.5 w-3.5" /> CSV
                    </Button>
                  </div>

                  {/* Elegant Horizontal Bar Ratio breakdowns */}
                  <div className="space-y-6 my-4">
                    {/* Atendidos bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-600">
                        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>Atendidos</span>
                        <span>{turnosPorEstado.atendido} ({totalTurnosFiltrados > 0 ? Math.round((turnosPorEstado.atendido / totalTurnosFiltrados) * 100) : 0}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${totalTurnosFiltrados > 0 ? (turnosPorEstado.atendido / totalTurnosFiltrados) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Ausentes bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-600">
                        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>Ausentes (No asistió)</span>
                        <span>{turnosPorEstado.ausente} ({totalTurnosFiltrados > 0 ? Math.round((turnosPorEstado.ausente / totalTurnosFiltrados) * 100) : 0}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${totalTurnosFiltrados > 0 ? (turnosPorEstado.ausente / totalTurnosFiltrados) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Cancelados bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-600">
                        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>Cancelados</span>
                        <span>{turnosPorEstado.cancelado} ({totalTurnosFiltrados > 0 ? Math.round((turnosPorEstado.cancelado / totalTurnosFiltrados) * 100) : 0}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-rose-400 to-rose-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${totalTurnosFiltrados > 0 ? (turnosPorEstado.cancelado / totalTurnosFiltrados) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Confirmados y pendientes bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-600">
                        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-sky-500"></span>Próximos Turnos (Confirmados/Pendientes)</span>
                        <span>{(turnosPorEstado.confirmado + turnosPorEstado.pendiente)} ({totalTurnosFiltrados > 0 ? Math.round(((turnosPorEstado.confirmado + turnosPorEstado.pendiente) / totalTurnosFiltrados) * 100) : 0}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-sky-400 to-sky-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${totalTurnosFiltrados > 0 ? ((turnosPorEstado.confirmado + turnosPorEstado.pendiente) / totalTurnosFiltrados) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-50 mt-6 flex items-center gap-2 text-xs text-slate-400">
                  <Info className="h-4 w-4 text-sky-500 shrink-0" />
                  <span>La tasa de ausentismo médico actual es de un <b>{tasaAusentismoMedica}%</b> de los turnos agendados en este periodo.</span>
                </div>
              </Card>

              {/* Right Column: Demand rankings / top stats */}
              <Card className="p-8 rounded-3xl border border-slate-100 shadow-sm bg-white">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Especialidades Más Solicitadas</h3>
                
                {especialidadesStatsList.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">No hay turnos registrados en este periodo.</div>
                ) : (
                  <div className="space-y-5">
                    {especialidadesStatsList.slice(0, 5).map((esp: any, idx) => {
                      const percentage = totalTurnosFiltrados > 0 ? Math.round((esp.count / totalTurnosFiltrados) * 100) : 0
                      return (
                        <div key={esp.nombre} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-slate-50 border border-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold shrink-0">{idx + 1}</span>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-700">{esp.nombre}</span>
                              <span className="text-[10px] text-slate-400 font-semibold uppercase">{esp.total} turnos agendados</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-slate-800">{percentage}%</span>
                            <div className="w-12 bg-slate-50 h-1.5 rounded-full overflow-hidden shrink-0 border">
                              <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: esp.color }}></div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>

            </div>
          </TabsContent>

          {/* TAB 2: TURNOS DETAILS */}
          <TabsContent value="turnos" className="space-y-6 outline-none">
            <Card className="p-8 rounded-3xl border border-slate-100 shadow-sm bg-white space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Análisis Detallado por Prestaciones Médicas</h3>
                  <p className="text-slate-500 text-xs">Monitoreo estadístico de efectividad, inasistencias y demanda por especialidad.</p>
                </div>
                <Button size="sm" onClick={() => handleExportCSV('turnos')} className="rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold h-10 px-4">
                  <Download className="h-4 w-4 mr-2" /> Exportar a CSV
                </Button>
              </div>

              {/* Grid of horizontal progress bars */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">Demanda y Carga por Especialidad</h4>
                  <div className="space-y-4">
                    {especialidadesStatsList.map((esp: any) => {
                      const totalAt = esp.atendidos + esp.ausentes
                      const efectividad = totalAt > 0 ? Math.round((esp.atendidos / totalAt) * 100) : 0
                      return (
                        <div key={esp.nombre} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: esp.color }}></span>
                              {esp.nombre}
                            </span>
                            <span className="text-[11px] font-bold text-slate-500">{esp.count} turnos agendados</span>
                          </div>
                          
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                            <span>Efectividad de asistencia: <b>{efectividad}%</b></span>
                            <span>{esp.atendidos} atendidos / {esp.ausentes} inasistencias</span>
                          </div>
                          <div className="w-full bg-slate-200/50 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${efectividad}%`, backgroundColor: esp.color }}></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Demand stats and analysis comments */}
                <div className="space-y-6">
                  <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Conclusiones Analíticas del Período</h4>
                  
                  <div className="p-5 rounded-2xl border border-sky-100 bg-sky-50/20 space-y-3">
                    <h5 className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-sky-600" /> Especialidad de Mayor Demanda
                    </h5>
                    <p className="text-xs text-sky-900 leading-relaxed">
                      La especialidad con mayor volumen de solicitudes es <b>{especialidadesStatsList[0]?.nombre || 'ninguna'}</b>, representando un <b>{totalTurnosFiltrados > 0 ? Math.round((especialidadesStatsList[0]?.count / totalTurnosFiltrados) * 100) : 0}%</b> del total de turnos otorgados. Se recomienda mantener o incrementar la disponibilidad de agenda en esta área.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl border border-emerald-100 bg-emerald-50/20 space-y-3">
                    <h5 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <UserCheck className="h-4 w-4 text-emerald-600" /> Máxima Efectividad de Asistencia
                    </h5>
                    {(() => {
                      const bestEsp = [...especialidadesStatsList]
                        .filter((e: any) => (e.atendidos + e.ausentes) >= 5)
                        .sort((a: any, b: any) => {
                          const rateA = a.atendidos / (a.atendidos + a.ausentes)
                          const rateB = b.atendidos / (b.atendidos + b.ausentes)
                          return rateB - rateA
                        })[0] as any
                      
                      const rate = bestEsp ? Math.round((bestEsp.atendidos / (bestEsp.atendidos + bestEsp.ausentes)) * 100) : 0
                      return (
                        <p className="text-xs text-emerald-900 leading-relaxed">
                          La especialidad con mejor tasa de asistencia efectiva es <b>{bestEsp?.nombre || 'ninguna'}</b>, con un excelente <b>{rate}% de concurrencia</b> ({bestEsp?.atendidos} pacientes atendidos).
                        </p>
                      )
                    })()}
                  </div>

                  <div className="p-5 rounded-2xl border border-rose-100 bg-rose-50/20 space-y-3">
                    <h5 className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                      <TrendingDown className="h-4 w-4 text-rose-600" /> Foco de Alerta: Ausentismo
                    </h5>
                    {(() => {
                      const worstEsp = [...especialidadesStatsList]
                        .filter((e: any) => (e.atendidos + e.ausentes) >= 5)
                        .sort((a: any, b: any) => {
                          const rateA = a.ausentes / (a.atendidos + a.ausentes)
                          const rateB = b.ausentes / (b.atendidos + b.ausentes)
                          return rateB - rateA
                        })[0] as any
                      
                      const rate = worstEsp ? Math.round((worstEsp.ausentes / (worstEsp.atendidos + worstEsp.ausentes)) * 100) : 0
                      return (
                        <p className="text-xs text-rose-900 leading-relaxed">
                          La especialidad que registra la mayor tasa de inasistencias es <b>{worstEsp?.nombre || 'ninguna'}</b>, alcanzando un <b>{rate}% de ausentismo</b>. Se aconseja disparar recordatorios de WhatsApp automatizados con mayor frecuencia para estas citas.
                        </p>
                      )
                    })()}
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* TAB 3: CLASSES AND ATTENDANCE */}
          <TabsContent value="clases" className="space-y-6 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Side: Classes grid list with status progress */}
              <Card className="lg:col-span-2 p-8 rounded-3xl border border-slate-100 shadow-sm bg-white space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Ocupación y Presentismo en Clases / Talleres</h3>
                    <p className="text-slate-500 text-xs">Estadísticas actuales de asignación de cupos y asistencia presencial por actividad.</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleExportCSV('clases')} className="rounded-xl border-slate-200 text-xs font-semibold gap-1.5 h-9">
                    <Download className="h-3.5 w-3.5" /> CSV Clases
                  </Button>
                </div>

                <div className="space-y-5">
                  {clasesOcupacionStats.map(clase => {
                    let ocupacionColor = "bg-emerald-500"
                    if (clase.ocupacionPct > 100) ocupacionColor = "bg-purple-500"
                    else if (clase.ocupacionPct >= 85) ocupacionColor = "bg-amber-500"

                    return (
                      <div key={clase.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div>
                            <h4 className="text-sm font-bold text-slate-800">{clase.nombre}</h4>
                            <p className="text-xs text-slate-500">Instructor: {clase.profesionales?.nombre} {clase.profesionales?.apellido}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold px-2.5 py-1 bg-white border border-slate-100 rounded-full text-slate-500 uppercase">
                              {clase.dia_semana}
                            </span>
                            {clase.enListaEspera > 0 && (
                              <span className="text-[10px] font-bold px-2.5 py-1 bg-purple-50 border border-purple-100 rounded-full text-purple-600">
                                {clase.enListaEspera} en Espera
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Two gauges: Occupancy & Attendance */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                          
                          {/* Occupancy bar */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[11px] font-bold text-slate-600">
                              <span>Ocupación de Cupos</span>
                              <span>{clase.inscriptosActivos} / {clase.cupo_maximo} ({clase.ocupacionPct}%)</span>
                            </div>
                            <div className="w-full bg-slate-200/50 h-2 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all ${ocupacionColor}`} 
                                style={{ width: `${Math.min(clase.ocupacionPct, 100)}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Attendance bar */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[11px] font-bold text-slate-600">
                              <span>Asistencia Promedio</span>
                              <span>{clase.asistenciaPct}% (Últimas 3 semanas)</span>
                            </div>
                            <div className="w-full bg-slate-200/50 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-indigo-500 h-full rounded-full transition-all" 
                                style={{ width: `${clase.asistenciaPct}%` }}
                              ></div>
                            </div>
                          </div>

                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>

              {/* Right Side: Waitlist alerts / suggestions */}
              <Card className="p-8 rounded-3xl border border-slate-100 shadow-sm bg-white flex flex-col justify-between">
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-slate-800">Lista de Espera y Demanda Reprimida</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Las listas de espera reflejan actividades con capacidad saturada. A continuación se detallan las actividades con demanda excedente que justifican la apertura de nuevas comisiones u horarios.
                  </p>

                  <div className="space-y-4">
                    {clasesOcupacionStats.filter(c => c.enListaEspera > 0).length === 0 ? (
                      <div className="text-center py-10 bg-slate-50 rounded-2xl text-slate-400 text-xs border border-dashed">
                        No hay afiliados en lista de espera actualmente.
                      </div>
                    ) : (
                      clasesOcupacionStats
                        .filter(c => c.enListaEspera > 0)
                        .map(clase => (
                          <div key={clase.id} className="p-4 rounded-xl border border-purple-100 bg-purple-50/20 flex justify-between items-center">
                            <div>
                              <span className="text-xs font-bold text-purple-950 block">{clase.nombre}</span>
                              <span className="text-[10px] text-purple-700 font-semibold">{clase.inscriptosActivos} activos / {clase.cupo_maximo} máx.</span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-lg font-extrabold text-purple-700 block">+{clase.enListaEspera}</span>
                              <span className="text-[9px] text-purple-500 uppercase font-bold tracking-wider">Esperando cupo</span>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t mt-6">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Recomendación Organizativa</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Abrir una nueva comisión para <b>{clasesOcupacionStats.sort((a,b) => b.enListaEspera - a.enListaEspera)[0]?.nombre || 'actividades grupales'}</b> los días alternos aliviará la lista de espera actual y aumentará la retención de afiliados.
                  </p>
                </div>
              </Card>

            </div>
          </TabsContent>

          {/* TAB 4: STAFF PERFORMANCE */}
          <TabsContent value="rendimiento" className="space-y-6 outline-none">
            <Card className="p-8 rounded-3xl border border-slate-100 shadow-sm bg-white space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Rendimiento e Indicadores del Staff Profesional</h3>
                  <p className="text-slate-500 text-xs">Evaluación individual de volumen de pacientes, presentismo efectivo y cancelaciones registradas.</p>
                </div>
                <Button size="sm" onClick={() => handleExportCSV('profesionales')} className="rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold h-10 px-4">
                  <Download className="h-4 w-4 mr-2" /> Exportar Rendimiento
                </Button>
              </div>

              {/* Table of staff metrics */}
              <div className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-slate-600 text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="p-4 pl-6">Profesional / Especialista</th>
                      <th className="p-4">Especialidad</th>
                      <th className="p-4 text-center">Total Asignado</th>
                      <th className="p-4 text-center">Atendidos</th>
                      <th className="p-4 text-center">Ausentes</th>
                      <th className="p-4 text-center">Cancelados</th>
                      <th className="p-4 pr-6 text-right">Efectividad Presencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {profesionalesStatsList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-10 text-center text-slate-400">No hay profesionales registrados en este periodo.</td>
                      </tr>
                    ) : (
                      profesionalesStatsList.map((p: any) => {
                        const totalAt = p.atendidos + p.ausentes
                        const pct = totalAt > 0 ? Math.round((p.atendidos / totalAt) * 100) : 0
                        
                        let badgeColor = "bg-rose-50 text-rose-600"
                        if (pct >= 85) badgeColor = "bg-emerald-50 text-emerald-600"
                        else if (pct >= 70) badgeColor = "bg-amber-50 text-amber-600"

                        return (
                          <tr key={p.nombre} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 pl-6 font-bold text-slate-800">{p.nombre}</td>
                            <td className="p-4 text-slate-500 font-semibold">{p.esp}</td>
                            <td className="p-4 text-center font-bold text-slate-700">{p.total}</td>
                            <td className="p-4 text-center text-emerald-600 font-semibold">{p.atendidos}</td>
                            <td className="p-4 text-center text-amber-600 font-semibold">{p.ausentes}</td>
                            <td className="p-4 text-center text-rose-600 font-semibold">{p.cancelados}</td>
                            <td className="p-4 pr-6 text-right">
                              <span className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold ${badgeColor}`}>
                                {totalAt > 0 ? `${pct}%` : 'N/D'}
                              </span>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

      </div>
    </RolGuard>
  )
}

function StatCard({ title, value, subtext, icon: Icon, colorClass, trend }: StatCardProps) {
  return (
    <Card className="p-6 rounded-3xl border border-slate-100 shadow-sm bg-white hover:shadow-md transition-all relative overflow-hidden group">
      
      {/* Background visual highlight */}
      <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-slate-50 group-hover:scale-110 transition-transform duration-300"></div>

      <div className="flex items-center justify-between relative">
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">{title}</span>
          <span className="text-3xl font-extrabold text-slate-900 block tracking-tight">{value}</span>
          <span className="text-[10px] font-semibold text-slate-500 block leading-tight">{subtext}</span>
        </div>
        
        <div className={`h-12 w-12 rounded-2xl bg-gradient-to-tr ${colorClass.includes('from-') ? colorClass : 'from-slate-100 to-slate-200'} flex items-center justify-center text-white shadow-lg`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>

      {trend && (
        <div className="mt-4 pt-3 border-t border-slate-50 flex items-center gap-1 text-[10px] font-bold text-slate-400 relative">
          {trend.positive ? (
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-amber-500" />
          )}
          <span>{trend.value}</span>
        </div>
      )}
    </Card>
  )
}
