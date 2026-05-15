'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileText, 
  Settings, 
  ChevronDown,
  LogOut,
  User,
  ClipboardList
} from 'lucide-react'
import { cn } from '@/lib/utils'
import logo from '../../public/logo.png'

const menuItems = [
  {
    title: 'DASHBOARDS',
    items: [
      { name: 'Analytics', href: '/dashboard', icon: LayoutDashboard },
    ]
  },
  {
    title: 'GESTIÓN',
    items: [
      { name: 'Turnos', href: '/turnos', icon: Calendar },
      { name: 'Afiliados', href: '/afiliados', icon: Users },
      { name: 'Profesionales', href: '/profesionales', icon: User },
      { name: 'Agenda', href: '/agenda', icon: ClipboardList },
    ]
  },
  {
    title: 'SISTEMA',
    items: [
      { name: 'Reportes', href: '/reportes', icon: FileText },
      { name: 'Configuración', href: '/configuracion', icon: Settings },
    ]
  }
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-4 top-4 bottom-4 w-64 bg-[#1f283e] rounded-3xl overflow-hidden shadow-2xl flex flex-col text-slate-300">
      {/* Brand */}
      <div className="p-6 flex items-center gap-3 border-b border-slate-700/50">
        <div className="bg-white p-1.5 rounded-xl shadow-sm">
          <Image src={logo} alt="Logo" width={28} height={28} className="object-contain" />
        </div>
        <span className="font-bold text-white tracking-tight text-lg">UPCN Turnos</span>
      </div>

      {/* User Profile */}
      <div className="p-6 flex items-center justify-between group cursor-pointer hover:bg-slate-800/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center text-white font-bold shadow-lg shadow-sky-900/20">
            JD
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white">Juan Galarza</span>
            <span className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">Administrador</span>
          </div>
        </div>
        <ChevronDown className="h-4 w-4 text-slate-500" />
      </div>

      <hr className="mx-6 border-slate-700/30" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-hide">
        {menuItems.map((group) => (
          <div key={group.title} className="space-y-2">
            <h3 className="px-4 text-[10px] font-bold text-slate-500 tracking-[0.1em] uppercase">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                      isActive 
                        ? "bg-gradient-to-r from-sky-600 to-sky-500 text-white shadow-lg shadow-sky-900/40" 
                        : "hover:bg-slate-800/50 text-slate-400 hover:text-white"
                    )}
                  >
                    <item.icon className={cn(
                      "h-5 w-5 transition-colors",
                      isActive ? "text-white" : "text-slate-500 group-hover:text-white"
                    )} />
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 mt-auto">
        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all group">
          <LogOut className="h-5 w-5 text-slate-500 group-hover:text-red-400" />
          <span className="text-sm font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  )
}
