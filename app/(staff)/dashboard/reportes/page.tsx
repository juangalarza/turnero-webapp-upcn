import { RolGuard } from '@/components/layout/RolGuard'

// TODO: Fase 5 — Reportes: ocupación, demanda por especialidad, ausencias
export default function ReportesPage() {
  return (
    <RolGuard roles={['admin']}>
      <div>Reportes</div>
    </RolGuard>
  )
}
