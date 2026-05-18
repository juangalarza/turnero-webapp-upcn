'use client'

import { useStaffProfile } from '@/hooks/useStaffProfile'

type Rol = 'admin' | 'recepcion' | 'profesional'

interface RolGuardProps {
  roles: Rol[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RolGuard({ roles, children, fallback = null }: RolGuardProps) {
  const { profile, loading } = useStaffProfile()
  
  if (loading) return null
  if (!profile) return null
  if (!roles.includes(profile.rol as Rol)) return <>{fallback}</>
  
  return <>{children}</>
}
