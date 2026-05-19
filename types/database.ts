export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      sedes: {
        Row: {
          id: string
          nombre: string
          direccion: string | null
          telefono: string | null
          responsable_id: string | null
          activa: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          nombre: string
          direccion?: string | null
          telefono?: string | null
          responsable_id?: string | null
          activa?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          nombre?: string
          direccion?: string | null
          telefono?: string | null
          responsable_id?: string | null
          activa?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
      especialidades: {
        Row: {
          id: string
          nombre: string
          color: string | null
          tipo_prestacion: 'turno' | 'cupo' | null
          activa: boolean | null
        }
        Insert: {
          id?: string
          nombre: string
          color?: string | null
          tipo_prestacion?: 'turno' | 'cupo' | null
          activa?: boolean | null
        }
        Update: {
          id?: string
          nombre?: string
          color?: string | null
          tipo_prestacion?: 'turno' | 'cupo' | null
          activa?: boolean | null
        }
        Relationships: []
      }
      profesionales: {
        Row: {
          id: string
          nombre: string
          apellido: string
          matricula: string | null
          especialidad_id: string | null
          sede_id: string | null
          telefono: string | null
          activo: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          nombre: string
          apellido: string
          matricula?: string | null
          especialidad_id?: string | null
          sede_id?: string | null
          telefono?: string | null
          activo?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          nombre?: string
          apellido?: string
          matricula?: string | null
          especialidad_id?: string | null
          sede_id?: string | null
          telefono?: string | null
          activo?: boolean | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profesionales_especialidad_id_fkey"
            columns: ["especialidad_id"]
            isOneToOne: false
            referencedRelation: "especialidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profesionales_sede_id_fkey"
            columns: ["sede_id"]
            isOneToOne: false
            referencedRelation: "sedes"
            referencedColumns: ["id"]
          }
        ]
      }
      horarios_atencion: {
        Row: {
          id: string
          profesional_id: string | null
          dia_semana: number
          hora_inicio: string
          hora_fin: string
          duracion_turno_minutos: number | null
          activo: boolean | null
        }
        Insert: {
          id?: string
          profesional_id?: string | null
          dia_semana: number
          hora_inicio: string
          hora_fin: string
          duracion_turno_minutos?: number | null
          activo?: boolean | null
        }
        Update: {
          id?: string
          profesional_id?: string | null
          dia_semana?: number
          hora_inicio?: string
          hora_fin?: string
          duracion_turno_minutos?: number | null
          activo?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "horarios_atencion_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "profesionales"
            referencedColumns: ["id"]
          }
        ]
      }
      bloqueos_agenda: {
        Row: {
          id: string
          profesional_id: string | null
          fecha_inicio: string
          fecha_fin: string
          motivo: string | null
          created_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          profesional_id?: string | null
          fecha_inicio: string
          fecha_fin: string
          motivo?: string | null
          created_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          profesional_id?: string | null
          fecha_inicio?: string
          fecha_fin?: string
          motivo?: string | null
          created_by?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bloqueos_agenda_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "profesionales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bloqueos_agenda_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      afiliados: {
        Row: {
          id: string
          numero_afiliado: string | null
          dni: string
          nombre: string
          apellido: string
          fecha_nacimiento: string | null
          telefono: string | null
          email: string | null
          grupo_familiar_titular_id: string | null
          observaciones: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          numero_afiliado?: string | null
          dni: string
          nombre: string
          apellido: string
          fecha_nacimiento?: string | null
          telefono?: string | null
          email?: string | null
          grupo_familiar_titular_id?: string | null
          observaciones?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          numero_afiliado?: string | null
          dni?: string
          nombre?: string
          apellido?: string
          fecha_nacimiento?: string | null
          telefono?: string | null
          email?: string | null
          grupo_familiar_titular_id?: string | null
          observaciones?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "afiliados_grupo_familiar_titular_id_fkey"
            columns: ["grupo_familiar_titular_id"]
            isOneToOne: false
            referencedRelation: "afiliados"
            referencedColumns: ["id"]
          }
        ]
      }
      turnos: {
        Row: {
          id: string
          afiliado_id: string | null
          profesional_id: string | null
          sede_id: string | null
          fecha: string
          hora: string
          estado: string | null
          motivo_consulta: string | null
          notas_internas: string | null
          recordatorio_enviado: boolean | null
          created_by: string | null
          updated_by: string | null
          created_at: string | null
          updated_at: string | null
          cancelled_at: string | null
          cancel_reason: string | null
        }
        Insert: {
          id?: string
          afiliado_id?: string | null
          profesional_id?: string | null
          sede_id?: string | null
          fecha: string
          hora: string
          estado?: string | null
          motivo_consulta?: string | null
          notas_internas?: string | null
          recordatorio_enviado?: boolean | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          cancelled_at?: string | null
          cancel_reason?: string | null
        }
        Update: {
          id?: string
          afiliado_id?: string | null
          profesional_id?: string | null
          sede_id?: string | null
          fecha?: string
          hora?: string
          estado?: string | null
          motivo_consulta?: string | null
          notas_internas?: string | null
          recordatorio_enviado?: boolean | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          cancelled_at?: string | null
          cancel_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "turnos_afiliado_id_fkey"
            columns: ["afiliado_id"]
            isOneToOne: false
            referencedRelation: "afiliados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turnos_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "profesionales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turnos_sede_id_fkey"
            columns: ["sede_id"]
            isOneToOne: false
            referencedRelation: "sedes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turnos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turnos_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      staff_profiles: { 
        Row: { 
          id: string
          nombre: string
          apellido: string
          username: string | null
          dni: string | null
          telefono: string | null
          email: string | null
          rol: 'admin' | 'recepcion' | 'profesional'
          profesional_id: string | null
          sede_id: string | null
          activo: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: { 
          id: string
          nombre: string
          apellido: string
          username?: string | null
          dni?: string | null
          telefono?: string | null
          email?: string | null
          rol: 'admin' | 'recepcion' | 'profesional'
          profesional_id?: string | null
          sede_id?: string | null
          activo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: { 
          id?: string
          nombre?: string
          apellido?: string
          username?: string | null
          dni?: string | null
          telefono?: string | null
          email?: string | null
          rol?: 'admin' | 'recepcion' | 'profesional'
          profesional_id?: string | null
          sede_id?: string | null
          activo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_profiles_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "profesionales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_profiles_sede_id_fkey"
            columns: ["sede_id"]
            isOneToOne: false
            referencedRelation: "sedes"
            referencedColumns: ["id"]
          }
        ]
      }
      configuraciones: {
        Row: {
          id: string
          lista_espera_limite: number | null
        }
        Insert: {
          id?: string
          lista_espera_limite?: number | null
        }
        Update: {
          id?: string
          lista_espera_limite?: number | null
        }
        Relationships: []
      }
      clases: {
        Row: {
          id: string
          profesional_id: string | null
          nombre: string
          descripcion: string | null
          dia_semana: string
          hora_inicio: string
          hora_fin: string
          cupo_maximo: number
          lista_espera_limite: number | null
          activa: boolean | null
        }
        Insert: {
          id?: string
          profesional_id?: string | null
          nombre: string
          descripcion?: string | null
          dia_semana: string
          hora_inicio: string
          hora_fin: string
          cupo_maximo: number
          lista_espera_limite?: number | null
          activa?: boolean | null
        }
        Update: {
          id?: string
          profesional_id?: string | null
          nombre?: string
          descripcion?: string | null
          dia_semana?: string
          hora_inicio?: string
          hora_fin?: string
          cupo_maximo?: number
          lista_espera_limite?: number | null
          activa?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "clases_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "profesionales"
            referencedColumns: ["id"]
          }
        ]
      }
      inscripciones: {
        Row: {
          id: string
          clase_id: string | null
          perfil_id: string | null
          estado: string
          posicion_espera: number | null
          fecha_inscripcion: string | null
          fecha_baja: string | null
          notas_admin: string | null
        }
        Insert: {
          id?: string
          clase_id?: string | null
          perfil_id?: string | null
          estado?: string
          posicion_espera?: number | null
          fecha_inscripcion?: string | null
          fecha_baja?: string | null
          notas_admin?: string | null
        }
        Update: {
          id?: string
          clase_id?: string | null
          perfil_id?: string | null
          estado?: string
          posicion_espera?: number | null
          fecha_inscripcion?: string | null
          fecha_baja?: string | null
          notas_admin?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inscripciones_clase_id_fkey"
            columns: ["clase_id"]
            isOneToOne: false
            referencedRelation: "clases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscripciones_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "afiliados"
            referencedColumns: ["id"]
          }
        ]
      }
      asistencia: {
        Row: {
          id: string
          inscripcion_id: string | null
          fecha: string
          presente: boolean | null
          justificada: boolean | null
          nota: string | null
          registrado_por: string | null
        }
        Insert: {
          id?: string
          inscripcion_id?: string | null
          fecha: string
          presente?: boolean | null
          justificada?: boolean | null
          nota?: string | null
          registrado_por?: string | null
        }
        Update: {
          id?: string
          inscripcion_id?: string | null
          fecha?: string
          presente?: boolean | null
          justificada?: boolean | null
          nota?: string | null
          registrado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asistencia_inscripcion_id_fkey"
            columns: ["inscripcion_id"]
            isOneToOne: false
            referencedRelation: "inscripciones"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_staff_email_by_username: {
        Args: { p_username: string }
        Returns: string | null
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
