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
      user_profile: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id_auth: string
          user_name: string
          providers: string[] | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id_auth: string
          user_name?: string
          providers?: string[] | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id_auth?: string
          user_name?: string
          providers?: string[] | null
        }
      }
      provider_data: {
        Row: {
          id: string
          created_at: string
          provider_id_ref: string
          auth_provider_id: string
          name: string
          type: number
          token: string
          refresh: string | null
          expires: string | null
          data: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          provider_id_ref: string
          auth_provider_id: string
          name: string
          type: number
          token: string
          refresh?: string | null
          expires?: string | null
          data?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          provider_id_ref?: string
          auth_provider_id?: string
          name?: string
          type?: number
          token?: string
          refresh?: string | null
          expires?: string | null
          data?: Json | null
        }
      }
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
  }
}

// Provider types enum
export enum ProviderType {
  GHL = 1,
  Email = 2,
  Phone = 3
}

// Helper type for provider data
export type ProviderData = Database['public']['Tables']['provider_data']['Row']
export type ProviderDataInsert = Database['public']['Tables']['provider_data']['Insert']
export type ProviderDataUpdate = Database['public']['Tables']['provider_data']['Update']

// Helper type for user profile
export type UserProfile = Database['public']['Tables']['user_profile']['Row']
export type UserProfileInsert = Database['public']['Tables']['user_profile']['Insert']
export type UserProfileUpdate = Database['public']['Tables']['user_profile']['Update']