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
          birth_date: string | null
          sex: 'M' | 'F' | 'U' | null
          phone: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          personal_history: string
          family_history: string
          chronic_treatments: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          establishment_id: string
          first_name: string
          last_name: string
          access_code: string
          birth_date?: string | null
          sex?: 'M' | 'F' | 'U' | null
          phone?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          personal_history?: string
          family_history?: string
          chronic_treatments?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          establishment_id?: string
          first_name?: string
          last_name?: string
          access_code?: string
          birth_date?: string | null
          sex?: 'M' | 'F' | 'U' | null
          phone?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          personal_history?: string
          family_history?: string
          chronic_treatments?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      patient_allergies: {
        Row: {
          id: string
          patient_id: string
          substance: string
          severity: 'mild' | 'moderate' | 'severe'
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          substance: string
          severity: 'mild' | 'moderate' | 'severe'
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          substance?: string
          severity?: 'mild' | 'moderate' | 'severe'
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      medications: {
        Row: {
          id: string
          name: string
          form: string | null
          default_posology: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          name: string
          form?: string | null
          default_posology?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          name?: string
          form?: string | null
          default_posology?: string | null
          is_active?: boolean
        }
        Relationships: []
      }
      lab_exam_types: {
        Row: {
          id: string
          code: string
          name: string
          category: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          code: string
          name: string
          category?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          code?: string
          name?: string
          category?: string | null
          is_active?: boolean
        }
        Relationships: []
      }
      consultations: {
        Row: {
          id: string
          establishment_id: string
          patient_id: string
          doctor_id: string
          status: 'in_progress' | 'awaiting_labs' | 'closed' | 'deferred'
          motif: string | null
          history_of_illness: string | null
          temperature_c: number | null
          blood_pressure: string | null
          pulse_bpm: number | null
          weight_kg: number | null
          height_cm: number | null
          review_of_systems: Json
          physical_exam: string | null
          ai_suggestions: Json | null
          ai_decisions: Json | null
          diagnosis: string | null
          deferral_reason: string | null
          follow_up_date: string | null
          follow_up_notes: string | null
          started_at: string
          closed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          establishment_id: string
          patient_id: string
          doctor_id: string
          status?: 'in_progress' | 'awaiting_labs' | 'closed' | 'deferred'
          motif?: string | null
          history_of_illness?: string | null
          temperature_c?: number | null
          blood_pressure?: string | null
          pulse_bpm?: number | null
          weight_kg?: number | null
          height_cm?: number | null
          review_of_systems?: Json
          physical_exam?: string | null
          ai_suggestions?: Json | null
          ai_decisions?: Json | null
          diagnosis?: string | null
          deferral_reason?: string | null
          follow_up_date?: string | null
          follow_up_notes?: string | null
          started_at?: string
          closed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          establishment_id?: string
          patient_id?: string
          doctor_id?: string
          status?: 'in_progress' | 'awaiting_labs' | 'closed' | 'deferred'
          motif?: string | null
          history_of_illness?: string | null
          temperature_c?: number | null
          blood_pressure?: string | null
          pulse_bpm?: number | null
          weight_kg?: number | null
          height_cm?: number | null
          review_of_systems?: Json
          physical_exam?: string | null
          ai_suggestions?: Json | null
          ai_decisions?: Json | null
          diagnosis?: string | null
          deferral_reason?: string | null
          follow_up_date?: string | null
          follow_up_notes?: string | null
          started_at?: string
          closed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      consultation_lab_requests: {
        Row: {
          id: string
          consultation_id: string
          patient_id: string
          establishment_id: string
          requested_by: string
          exam_type_id: string
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          result_text: string | null
          result_values: Json | null
          completed_by: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          consultation_id: string
          patient_id: string
          establishment_id: string
          requested_by: string
          exam_type_id: string
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          result_text?: string | null
          result_values?: Json | null
          completed_by?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          consultation_id?: string
          patient_id?: string
          establishment_id?: string
          requested_by?: string
          exam_type_id?: string
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          result_text?: string | null
          result_values?: Json | null
          completed_by?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      prescriptions: {
        Row: {
          id: string
          consultation_id: string
          patient_id: string
          doctor_id: string
          establishment_id: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          consultation_id: string
          patient_id: string
          doctor_id: string
          establishment_id: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          consultation_id?: string
          patient_id?: string
          doctor_id?: string
          establishment_id?: string
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      prescription_items: {
        Row: {
          id: string
          prescription_id: string
          medication_id: string | null
          medication_name: string
          posology: string
          duration: string | null
          allergy_override: boolean
          allergy_override_reason: string | null
        }
        Insert: {
          id?: string
          prescription_id: string
          medication_id?: string | null
          medication_name: string
          posology: string
          duration?: string | null
          allergy_override?: boolean
          allergy_override_reason?: string | null
        }
        Update: {
          id?: string
          prescription_id?: string
          medication_id?: string | null
          medication_name?: string
          posology?: string
          duration?: string | null
          allergy_override?: boolean
          allergy_override_reason?: string | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      current_profile: {
        Args: Record<string, never>
        Returns: Database['public']['Tables']['profiles']['Row']
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Patient = Database['public']['Tables']['patients']['Row']
export type PatientAllergy = Database['public']['Tables']['patient_allergies']['Row']
export type Medication = Database['public']['Tables']['medications']['Row']
export type LabExamType = Database['public']['Tables']['lab_exam_types']['Row']
export type Consultation = Database['public']['Tables']['consultations']['Row']
export type ConsultationLabRequest =
  Database['public']['Tables']['consultation_lab_requests']['Row']
export type Prescription = Database['public']['Tables']['prescriptions']['Row']
export type PrescriptionItem = Database['public']['Tables']['prescription_items']['Row']
