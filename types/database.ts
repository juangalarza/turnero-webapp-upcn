// TODO: Reemplazar con tipos generados por Supabase CLI:
// npx supabase gen types typescript --project-id <PROJECT_ID> > types/database.ts

export type Database = {
  public: {
    Tables: {
      sedes: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
      especialidades: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
      profesionales: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
      horarios_atencion: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
      bloqueos_agenda: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
      afiliados: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
      turnos: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
      staff_profiles: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
