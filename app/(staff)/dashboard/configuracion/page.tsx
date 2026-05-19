import { RolGuard } from '@/components/layout/RolGuard'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { ListaEsperaConfig } from '@/components/configuracion/ListaEsperaConfig'
import { 
  Users, 
  Building2, 
  Stethoscope, 
  Webhook, 
  ShieldAlert, 
  BellRing,
  ChevronRight
} from 'lucide-react'

const settingsModules = [
  {
    title: 'Gestión de Staff',
    description: 'Administra usuarios, roles (Admin/Recepción) y accesos al sistema.',
    icon: Users,
    href: '/dashboard/configuracion/staff',
    color: 'text-sky-600',
    bgColor: 'bg-sky-100',
    borderColor: 'hover:border-sky-300'
  },
  {
    title: 'Especialidades Médicas',
    description: 'Administra las prestaciones base para dar de alta a profesionales.',
    icon: Stethoscope,
    href: '/dashboard/configuracion/especialidades',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    borderColor: 'hover:border-indigo-300'
  },
  {
    title: 'Sedes y Consultorios',
    description: 'Configura las sucursales donde se atiende físicamente.',
    icon: Building2,
    href: '/dashboard/configuracion/sedes',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    borderColor: 'hover:border-emerald-300'
  },
  {
    title: 'Integraciones y APIs',
    description: 'Configura Webhooks de Make.com y credenciales externas dinámicas.',
    icon: Webhook,
    href: '/dashboard/configuracion/integraciones',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    borderColor: 'hover:border-amber-300'
  },
  {
    title: 'Plantillas de Notificación',
    description: 'Textos de WhatsApp para recordatorios y confirmación de turnos.',
    icon: BellRing,
    href: '/dashboard/configuracion/notificaciones',
    color: 'text-rose-600',
    bgColor: 'bg-rose-100',
    borderColor: 'hover:border-rose-300'
  },
  {
    title: 'Auditoría del Sistema',
    description: 'Registro de seguridad, logs de acceso y cambios críticos.',
    icon: ShieldAlert,
    href: '/dashboard/configuracion/auditoria',
    color: 'text-slate-600',
    bgColor: 'bg-slate-200',
    borderColor: 'hover:border-slate-400'
  }
]

export default function ConfiguracionHubPage() {
  return (
    <RolGuard roles={['admin']}>
      <div className="space-y-8 animate-in fade-in duration-500 pb-10">
        
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-slate-800">Centro de Configuración</h1>
          <p className="text-slate-500 text-sm max-w-2xl">
            Panel de control central. Aquí puedes administrar las variables de entorno dinámicas,
            las políticas de la clínica y los accesos del personal sin necesidad de tocar código.
          </p>
        </div>

        {/* Grid de Módulos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {settingsModules.map((module) => (
            <Link key={module.href} href={module.href}>
              <Card className={`p-6 rounded-3xl border-2 border-transparent transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer group bg-white ${module.borderColor}`}>
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-2xl ${module.bgColor} ${module.color} transition-transform group-hover:scale-110 duration-300`}>
                    <module.icon className="h-6 w-6" />
                  </div>
                  <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className={`h-4 w-4 ${module.color}`} />
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-2">{module.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {module.description}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Configuración Global de Lista de Espera */}
        <div className="mt-12">
          <ListaEsperaConfig />
        </div>

      </div>
    </RolGuard>
  )
}
