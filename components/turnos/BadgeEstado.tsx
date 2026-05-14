import { Badge } from "@/components/ui/badge"

type EstadoTurno = 'pendiente' | 'confirmado' | 'cancelado' | 'ausente' | 'atendido'

interface BadgeEstadoProps {
  estado: EstadoTurno | string
}

export function BadgeEstado({ estado }: BadgeEstadoProps) {
  const styles: Record<string, string> = {
    pendiente: "bg-slate-100 text-slate-700 hover:bg-slate-100",
    confirmado: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    cancelado: "bg-red-100 text-red-700 hover:bg-red-100",
    ausente: "bg-orange-100 text-orange-700 hover:bg-orange-100",
    atendido: "bg-green-100 text-green-700 hover:bg-green-100",
  }

  const labels: Record<string, string> = {
    pendiente: "Pendiente",
    confirmado: "Confirmado",
    cancelado: "Cancelado",
    ausente: "Ausente",
    atendido: "Atendido",
  }

  return (
    <Badge className={styles[estado] || "bg-slate-100 text-slate-700"}>
      {labels[estado] || estado}
    </Badge>
  )
}

