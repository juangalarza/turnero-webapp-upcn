'use client'

import { Search, Bell, Settings, User, Menu } from 'lucide-react'
import { usePathname } from 'next/navigation'

export function Header() {
  const pathname = usePathname()

  // Simple breadcrumb logic
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumb = segments.length > 0
    ? segments.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' / ')
    : 'Dashboards'

  const currentTitle = segments[segments.length - 1]?.charAt(0).toUpperCase() + segments[segments.length - 1]?.slice(1) || 'Dashboard'

  return (
    <header className="h-24 flex items-center justify-between px-8 bg-transparent">
      <div className="flex flex-col">
        <div className="flex items-center gap-2 text-[18px] font-medium text-slate-400">
          <span className="opacity-60">Páginas</span>
          <span className="opacity-40">/</span>
          <span className="text-slate-600">{breadcrumb}</span>
        </div>
        {/* <h2 className="text-xl font-bold text-slate-800 tracking-tight mt-0.5">
          {currentTitle}
        </h2> */}
      </div>

      <div className="flex items-center gap-6">
        {/* Search Bar */}
        <div className="relative hidden md:block group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
          <input
            type="text"
            placeholder="Buscar aquí..."
            className="pl-10 pr-4 py-2 bg-white/50 backdrop-blur-sm border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 w-64 shadow-sm focus:bg-white transition-all"
          />
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-1.5 text-slate-500">
          <button className="p-2.5 hover:bg-white hover:shadow-md rounded-xl transition-all relative group">
            <Bell className="h-5 w-5 group-hover:text-sky-600" />
            <span className="absolute top-3 right-3 h-2 w-2 bg-red-500 rounded-full border-2 border-[#f8f9fa] shadow-sm"></span>
          </button>
          <button className="p-2.5 hover:bg-white hover:shadow-md rounded-xl transition-all group">
            <Settings className="h-5 w-5 group-hover:text-sky-600" />
          </button>
          <button className="p-2.5 hover:bg-white hover:shadow-md rounded-xl transition-all group lg:hidden">
            <Menu className="h-5 w-5 group-hover:text-sky-600" />
          </button>
          <div className="h-6 w-[1px] bg-slate-200 mx-2 hidden md:block" />
          <button className="p-1 hover:bg-white hover:shadow-md rounded-xl transition-all flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <User className="h-4 w-4 text-slate-500 group-hover:text-sky-600" />
            </div>
          </button>
        </div>
      </div>
    </header>
  )
}
