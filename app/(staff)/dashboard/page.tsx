'use client'

import { 
  Clock, 
  TrendingUp, 
  MoreVertical, 
  Globe,
  Loader2
} from 'lucide-react'
import { useStaffProfile } from '@/hooks/useStaffProfile'
import TurnosPage from './turnos/page'

export default function DashboardPage() {
  const { profile: userProfile, loading } = useStaffProfile()
  const rol = userProfile?.rol

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    )
  }

  // Switch de vistas según el rol
  if (rol !== 'admin') {
    return <TurnosPage />
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Card: Turnos por Especialidad (Inspired by Sales by Country) */}
      <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 p-8 overflow-hidden relative">
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-12 w-12 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200 text-white">
                <Globe className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Turnos por Especialidad</h3>
            </div>

            <div className="space-y-6">
              {[
                { name: 'Odontología', count: '1,240', value: '45%', color: 'bg-sky-500' },
                { name: 'Clínica Médica', count: '980', value: '32%', color: 'bg-emerald-500' },
                { name: 'Pediatría', count: '450', value: '15%', color: 'bg-amber-500' },
                { name: 'Ginecología', count: '210', value: '8%', color: 'bg-rose-500' },
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className={`h-2 w-2 rounded-full ${item.color}`} />
                    <span className="text-sm font-semibold text-slate-600">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-12 text-sm">
                    <span className="font-bold text-slate-800 w-16 text-right">{item.count}</span>
                    <span className="text-slate-400 w-12 text-right">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:w-[450px] h-[250px] bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 relative group">
            {/* Mock Map / Graphic */}
            <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-30 transition-opacity">
               <Globe className="h-40 w-40 text-sky-600" />
            </div>
            <div className="text-center z-10">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Resumen Geográfico</span>
               <p className="text-sm text-slate-500 mt-1">Sedes Activas: 12</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Chart Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Blue Card: Website Views / Pacientes */}
        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 flex flex-col group">
          <div className="p-4 pt-4 px-4">
            <div className="h-48 rounded-[1.5rem] bg-gradient-to-tr from-sky-600 to-sky-400 shadow-xl shadow-sky-200 p-6 flex flex-col justify-between -mt-10 relative overflow-hidden">
               <div className="absolute top-0 right-0 h-32 w-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
               <div className="flex items-end gap-1 h-32 px-2">
                  {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                    <div 
                      key={i} 
                      className="flex-1 bg-white/30 rounded-t-sm transition-all hover:bg-white/60 cursor-pointer" 
                      style={{ height: `${h}%` }}
                    />
                  ))}
               </div>
            </div>
          </div>
          <div className="p-6 pt-2">
            <h4 className="text-lg font-bold text-slate-800">Vistas de Turnos</h4>
            <p className="text-sm text-slate-500">Rendimiento de la última semana</p>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
              <Clock className="h-3 w-3" />
              <span>Actualizado hace 5 minutos</span>
            </div>
          </div>
        </div>

        {/* Green Card: Daily Sales / Turnos Confirmados */}
        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 flex flex-col group">
          <div className="p-4 pt-4 px-4">
            <div className="h-48 rounded-[1.5rem] bg-gradient-to-tr from-emerald-600 to-emerald-400 shadow-xl shadow-emerald-200 p-6 flex flex-col justify-end -mt-10 relative overflow-hidden">
               <div className="absolute bottom-0 left-0 h-32 w-32 bg-white/10 rounded-full -ml-16 -mb-16 blur-2xl" />
               <svg className="w-full h-24" viewBox="0 0 200 100" preserveAspectRatio="none">
                  <path 
                    d="M0,80 Q25,75 50,60 T100,40 T150,65 T200,30" 
                    fill="none" 
                    stroke="rgba(255,255,255,0.6)" 
                    strokeWidth="4" 
                    strokeLinecap="round" 
                  />
                  <circle cx="200" cy="30" r="5" fill="white" />
               </svg>
            </div>
          </div>
          <div className="p-6 pt-2">
            <h4 className="text-lg font-bold text-slate-800">Turnos Diarios</h4>
            <p className="text-sm text-slate-500">
               <span className="font-bold text-emerald-500">(+15%)</span> de incremento hoy.
            </p>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
              <Clock className="h-3 w-3" />
              <span>Actualizado ayer</span>
            </div>
          </div>
        </div>

        {/* Dark Card: Completed Tasks / Atenciones Realizadas */}
        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 flex flex-col group">
          <div className="p-4 pt-4 px-4">
            <div className="h-48 rounded-[1.5rem] bg-gradient-to-tr from-slate-800 to-slate-900 shadow-xl shadow-slate-400 p-6 flex flex-col justify-end -mt-10 relative overflow-hidden">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-40 bg-sky-500/10 rounded-full blur-3xl" />
               <svg className="w-full h-24" viewBox="0 0 200 100" preserveAspectRatio="none">
                  <path 
                    d="M0,90 L20,70 L40,80 L60,50 L80,60 L100,30 L120,50 L140,40 L160,60 L180,45 L200,20" 
                    fill="none" 
                    stroke="rgba(255,255,255,0.4)" 
                    strokeWidth="3" 
                  />
                  <circle cx="200" cy="20" r="4" fill="white" />
               </svg>
            </div>
          </div>
          <div className="p-6 pt-2">
            <h4 className="text-lg font-bold text-slate-800">Atenciones Realizadas</h4>
            <p className="text-sm text-slate-500">Última campaña de salud</p>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
              <Clock className="h-3 w-3" />
              <span>Actualizado recién</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Activity & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 p-8">
           <div className="flex items-center justify-between mb-8">
              <h4 className="text-lg font-bold text-slate-800">Próximos Turnos</h4>
              <button className="p-2 hover:bg-slate-50 rounded-lg">
                 <MoreVertical className="h-5 w-5 text-slate-400" />
              </button>
           </div>
           <div className="space-y-6">
              {[
                { time: '09:00', patient: 'Ana Martínez', service: 'Odontología', status: 'Confirmado' },
                { time: '10:30', patient: 'Carlos Ruiz', service: 'Clínica Médica', status: 'En espera' },
                { time: '11:15', patient: 'Sofía López', service: 'Pediatría', status: 'Confirmado' },
                { time: '12:45', patient: 'Roberto Gómez', service: 'Ginecología', status: 'Cancelado' },
              ].map((turno, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                   <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-slate-100 flex flex-col items-center justify-center group-hover:bg-white transition-colors">
                         <span className="text-xs font-bold text-sky-600">{turno.time}</span>
                      </div>
                      <div>
                         <p className="font-bold text-slate-800">{turno.patient}</p>
                         <p className="text-xs text-slate-400">{turno.service}</p>
                      </div>
                   </div>
                   <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                      turno.status === 'Confirmado' ? 'bg-emerald-100 text-emerald-600' :
                      turno.status === 'En espera' ? 'bg-amber-100 text-amber-600' :
                      'bg-rose-100 text-rose-600'
                   }`}>
                      {turno.status}
                   </span>
                </div>
              ))}
           </div>
        </div>

        <div className="bg-gradient-to-br from-sky-600 to-sky-700 rounded-[2rem] shadow-xl shadow-sky-200 p-8 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 h-40 w-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
           <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                 <TrendingUp className="h-12 w-12 opacity-80 mb-6" />
                 <h4 className="text-2xl font-bold">Crecimiento Mensual</h4>
                 <p className="text-sky-100 text-sm mt-2">Este mes hemos aumentado la capacidad de atención en un 24% gracias a la nueva sede.</p>
              </div>
              <div className="mt-12">
                 <div className="text-4xl font-bold">+24%</div>
                 <div className="h-2 w-full bg-white/20 rounded-full mt-4 overflow-hidden">
                    <div className="h-full bg-white w-3/4 rounded-full" />
                 </div>
                 <p className="text-xs text-sky-100 mt-4">Meta mensual: 30%</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
