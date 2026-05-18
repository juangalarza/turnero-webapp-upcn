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
  ClipboardList,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import logo from '../../public/logo.png'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStaffProfile } from '@/hooks/useStaffProfile'
import { RolGuard } from '@/components/layout/RolGuard'

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin'] },
  { name: 'Turnos', href: '/dashboard/turnos', icon: Calendar, roles: ['admin', 'recepcion', 'profesional'] },
  { name: 'Afiliados', href: '/dashboard/afiliados', icon: Users, roles: ['admin', 'recepcion', 'profesional'] },
  { name: 'Profesionales', href: '/dashboard/profesionales', icon: User, roles: ['admin', 'recepcion', 'profesional'] },
  { name: 'Agenda', href: '/dashboard/agenda', icon: ClipboardList, roles: ['admin', 'recepcion', 'profesional'] },
  { name: 'Reportes', href: '/dashboard/reportes', icon: FileText, roles: ['admin'] },
  { name: 'Gestión de Staff', href: '/dashboard/configuracion/staff', icon: Users, roles: ['admin'] },
  { name: 'Configuraciones', href: '/dashboard/configuracion', icon: Settings, roles: ['admin'] },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { profile: userProfile, loading } = useStaffProfile()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

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
      <Link href="/dashboard/perfil" className="p-6 flex items-center justify-between group cursor-pointer hover:bg-slate-800/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center text-white font-bold shadow-lg shadow-sky-900/20">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : userProfile ? `${userProfile.nombre.charAt(0)}${userProfile.apellido.charAt(0)}` : '??'}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white group-hover:text-sky-400 transition-colors truncate max-w-[120px]">
              {loading ? 'Cargando...' : userProfile ? `${userProfile.nombre} ${userProfile.apellido}` : 'Usuario'}
            </span>
            <span className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">
              {loading ? '...' : userProfile ? userProfile.rol : 'Staff'}
            </span>
          </div>
        </div>
        <ChevronDown className="h-4 w-4 text-slate-500 group-hover:text-sky-400 transition-colors" />
      </Link>

      <hr className="mx-6 border-slate-700/30" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-hide">
        {menuItems
          .filter(item => item.roles.includes(userProfile?.rol || 'recepcion'))
          .map((item) => {
            const isActive = pathname === item.href
            const content = (
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

            if (item.roles.length === 1 && item.roles[0] === 'admin') {
              return (
                <RolGuard key={item.name} roles={['admin']}>
                  {content}
                </RolGuard>
              )
            }

            return content
          })}
      </nav>

      {/* Footer */}
      <div className="p-4 mt-auto">
        <button 
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all group"
        >
          <LogOut className="h-5 w-5 text-slate-500 group-hover:text-red-400" />
          <span className="text-sm font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </aside>

  )
}
