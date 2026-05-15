type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      sedes: { Row: { [key: string]: Json | undefined }; Insert: { [key: string]: Json | undefined }; Update: { [key: string]: Json | undefined }; Relationships: [] }
      especialidades: { Row: { [key: string]: Json | undefined }; Insert: { [key: string]: Json | undefined }; Update: { [key: string]: Json | undefined }; Relationships: [] }
      profesionales: { Row: { [key: string]: Json | undefined }; Insert: { [key: string]: Json | undefined }; Update: { [key: string]: Json | undefined }; Relationships: [] }
      horarios_atencion: { Row: { [key: string]: Json | undefined }; Insert: { [key: string]: Json | undefined }; Update: { [key: string]: Json | undefined }; Relationships: [] }
      bloqueos_agenda: { Row: { [key: string]: Json | undefined }; Insert: { [key: string]: Json | undefined }; Update: { [key: string]: Json | undefined }; Relationships: [] }
      afiliados: { Row: { [key: string]: Json | undefined }; Insert: { [key: string]: Json | undefined }; Update: { [key: string]: Json | undefined }; Relationships: [] }
      turnos: { Row: { [key: string]: Json | undefined }; Insert: { [key: string]: Json | undefined }; Update: { [key: string]: Json | undefined }; Relationships: [] }
      staff_profiles: { Row: { [key: string]: Json | undefined }; Insert: { [key: string]: Json | undefined }; Update: { [key: string]: Json | undefined }; Relationships: [] }
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
