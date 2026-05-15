'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import logo from '../../public/logo.png'
import bgLogin from '../../public/bg-login.jpg'

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      toast({
        title: "Sesión iniciada",
        description: "Bienvenido al sistema de gestión de turnos.",
      })
      
      router.push('/dashboard')
      router.refresh()
    } catch (error: unknown) {
      toast({
        title: "Error de acceso",
        description: error instanceof Error ? error.message : "Credenciales inválidas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-white text-slate-900">
      {/* Left Side: Image */}
      <div className="relative hidden w-1/2 lg:block">
        <Image
          src={bgLogin}
          alt="UPCN Salud"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-blue-900/10" />
      </div>

      {/* Right Side: Login Form */}
      <div className="flex w-full items-center justify-center px-8 lg:w-1/2 lg:px-24">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center">
            <div className="flex items-center justify-center mb-6">
              <Image 
                src={logo} 
                alt="Logo Institucional" 
                width={200} 
                height={80} 
                className="object-contain"
                priority
              />
            </div>
            
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Gestión de Turnos</h1>
            <p className="text-slate-500 max-w-xs mx-auto">
              Inicia sesión para gestionar citas y pacientes.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6 mt-8">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                Correo Electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@upcn.org.ar"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-sky-500 focus:border-sky-500 h-11"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Contraseña
                </Label>
                <span className="text-xs text-sky-600 hover:underline cursor-pointer font-medium">
                  ¿Olvidaste tu contraseña?
                </span>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-slate-50 border-slate-200 text-slate-900 focus:ring-sky-500 focus:border-sky-500 h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="remember" 
                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer" 
              />
              <Label htmlFor="remember" className="text-sm font-normal text-slate-500 cursor-pointer">
                Recordar mi sesión
              </Label>
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-6 text-base shadow-md shadow-sky-100 transition-all active:scale-[0.98]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Validando...</span>
                </div>
              ) : (
                "Entrar al sistema"
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-8">
            &copy; {new Date().getFullYear()} UPCN - Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  )
}
