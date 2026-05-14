'use client'
// TODO: Fase 1 — Oculta/muestra secciones según el rol del usuario autenticado
// import { useStaffProfile } from '@/hooks/useStaffProfile'

type Rol = 'admin' | 'recepcion' | 'profesional'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function RolGuard({ _roles, children }: { _roles: Rol[], children: React.ReactNode }) {
  // const { profile } = useStaffProfile()
  // if (!profile || !roles.includes(profile.rol)) return null
  return <>{children}</>
}

// Uso:
// <RolGuard roles={['admin']}>
//   <SeccionConfiguracion />
// </RolGuard>
