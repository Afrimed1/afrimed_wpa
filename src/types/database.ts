export type StaffRole = 'admin' | 'doctor' | 'lab'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      establishments: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          establishment_id: string
          role: StaffRole
          first_name: string
          last_name: string
          email: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          establishment_id: string
          role: StaffRole
          first_name: string
          last_name: string
          email: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          establishment_id?: string
          role?: StaffRole
          first_name?: string
          last_name?: string
          email?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          id: string
          establishment_id: string
          first_name: string
          last_name: string
          access_code: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          establishment_id: string
          first_name: string
          last_name: string
          access_code: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          establishment_id?: string
          first_name?: string
          last_name?: string
          access_code?: string
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Patient = Database['public']['Tables']['patients']['Row']
