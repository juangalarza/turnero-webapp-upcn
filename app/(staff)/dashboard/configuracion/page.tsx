import { RolGuard } from '@/components/layout/RolGuard'

// TODO: Fase 5 — Configuración: especialidades, horarios, usuarios staff
export default function ConfiguracionPage() {
  return (
    <RolGuard roles={['admin']}>
      <div>Configuración</div>
    </RolGuard>
  )
}
