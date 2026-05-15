'use client'

import { useState, useEffect, useCallback } from 'react'
import { User, Mail, Phone, Lock, Save, Camera, Shield, MapPin, Fingerprint, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Database } from '@/types/database'

type StaffProfile = Database['public']['Tables']['staff_profiles']['Row']

export default function ProfilePage() {
  const { toast } = useToast()
  const supabase = createClient()
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  // Estados del formulario
  const [profile, setProfile] = useState<Partial<StaffProfile>>({
    nombre: '',
    apellido: '',
    username: '',
    dni: '',
    email: '',
    telefono: '',
    sede_id: ''
  })

  const [sedes, setSedes] = useState<{ id: string, nombre: string }[]>([])

  const fetchProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      if (data) setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast({
        title: "Error",
        description: "No se pudo cargar la información del perfil.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [supabase, toast])

  const fetchSedes = useCallback(async () => {
    const { data } = await supabase.from('sedes').select('id, nombre').eq('activa', true)
    if (data) setSedes(data)
  }, [supabase])

  useEffect(() => {
    fetchProfile()
    fetchSedes()
  }, [fetchProfile, fetchSedes])

  // Lógica de generación automática de usuario: inicial del nombre + apellido
  useEffect(() => {
    if (profile.nombre && profile.apellido) {
      const generated = (profile.nombre.charAt(0) + profile.apellido).toLowerCase().trim().replace(/\s+/g, '')
      if (generated !== profile.username) {
        setProfile(prev => ({ ...prev, username: generated }))
      }
    }
  }, [profile.nombre, profile.apellido, profile.username])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No hay sesión activa")

      const { error } = await supabase
        .from('staff_profiles')
        .update({
          nombre: profile.nombre,
          apellido: profile.apellido,
          username: profile.username,
          dni: profile.dni,
          email: profile.email,
          telefono: profile.telefono,
          sede_id: profile.sede_id,
        })
        .eq('id', user.id)

      if (error) throw error

      toast({
        title: "Perfil actualizado",
        description: "Tus datos se han guardado correctamente."
      })
    } catch (error: any) {
      toast({
        title: "Error al guardar",
        description: error.message || "Ocurrió un error inesperado.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Mi Perfil</h1>
        <p className="text-slate-500">Gestiona tu información personal y configuración de seguridad.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Quick Info */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <div className="relative group">
              <div className="h-32 w-32 rounded-full bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center text-white text-4xl font-bold shadow-xl shadow-sky-900/20">
                {profile.nombre?.charAt(0)}{profile.apellido?.charAt(0)}
              </div>
              <button type="button" className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border border-slate-100 text-sky-600 hover:text-sky-700 transition-colors">
                <Camera className="h-5 w-5" />
              </button>
            </div>
            <h2 className="mt-6 text-xl font-bold text-slate-800">{profile.nombre} {profile.apellido}</h2>
            <p className="text-slate-500 font-medium capitalize">{profile.rol}</p>
            <div className="mt-4 flex gap-2">
              <span className="px-3 py-1 bg-green-100 text-green-600 text-xs font-bold rounded-full uppercase tracking-wider">
                {profile.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4 text-sky-500" />
              Nivel de Seguridad
            </h3>
            <div className="space-y-4">
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-sky-500 h-full w-[85%]" />
              </div>
              <p className="text-xs text-slate-500">Tu cuenta tiene un nivel de seguridad alto. Te recomendamos cambiar tu contraseña cada 90 días.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 space-y-8">
              {/* Personal Information */}
              <section>
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <User className="h-5 w-5 text-sky-500" />
                  Información Personal
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Nombre</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input 
                        type="text" 
                        value={profile.nombre || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, nombre: e.target.value }))}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all outline-none text-slate-600"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Apellido</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input 
                        type="text" 
                        value={profile.apellido || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, apellido: e.target.value }))}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all outline-none text-slate-600"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 ml-1 flex justify-between items-center">
                      Usuario
                      <span className="text-[10px] text-sky-500 font-bold uppercase tracking-tighter">Generado automáticamente</span>
                    </label>
                    <div className="relative">
                      <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input 
                        type="text" 
                        value={profile.username || ''}
                        readOnly
                        className="w-full pl-11 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl outline-none text-slate-500 cursor-not-allowed font-medium"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 ml-1">DNI / CUIL</label>
                    <div className="relative">
                      <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input 
                        type="text" 
                        value={profile.dni || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, dni: e.target.value }))}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all outline-none text-slate-600"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input 
                        type="email" 
                        value={profile.email || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all outline-none text-slate-600"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Teléfono</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input 
                        type="tel" 
                        value={profile.telefono || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, telefono: e.target.value }))}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all outline-none text-slate-600"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Sede Asignada</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <select 
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all outline-none text-slate-600 appearance-none"
                        value={profile.sede_id || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, sede_id: e.target.value }))}
                      >
                        <option value="">Seleccionar sede...</option>
                        {sedes.map(s => (
                          <option key={s.id} value={s.id}>{s.nombre}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </section>

              <hr className="border-slate-100" />

              {/* Password Change */}
              <section>
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-sky-500" />
                  Cambio de Contraseña
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Nueva Contraseña</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input 
                        type="password" 
                        placeholder="••••••••"
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all outline-none text-slate-600"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Confirmar Contraseña</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input 
                        type="password" 
                        placeholder="••••••••"
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all outline-none text-slate-600"
                      />
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-xs text-slate-400 italic">* Para cambiar la contraseña se requiere confirmación vía email por seguridad.</p>
              </section>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-sky-600 to-sky-500 text-white font-bold rounded-xl shadow-lg shadow-sky-900/20 hover:shadow-sky-900/40 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
